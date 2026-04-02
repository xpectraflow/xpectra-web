import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("personal"),
  slug:    varchar("slug", { length: 255 }).notNull(),
  ...timestamps,
},
  (t) => ({
    organizationsSlugKey: uniqueIndex("organizations_slug_key").on(t.slug),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Invite flow (no separate org_members table):
 *
 *  1. Admin invites → row inserted:
 *       organisationId        = <target org>
 *       role         = 'member'
 *       inviteStatus = 'pending'
 *       inviteToken  = <signed token>
 *       passwordHash = '' (placeholder)
 *
 *  2. User accepts → row updated:
 *       inviteStatus = 'accepted'
 *       inviteToken  = null
 *       passwordHash = <hash>
 *       joinedAt     = now()
 *
 * primaryOrganizationId (from the original schema) is kept for users who may
 * later belong to multiple orgs. For MVP it equals organisationId.
 */
export const users = pgTable(
  "users",
  {
    id:           uuid("id").primaryKey(),
    email:        text("email").notNull(),
    name:         text("name").notNull(),
    passwordHash: text("password_hash").notNull().default(""),
    organisationId: uuid("organisation_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    role: text("role").notNull().default("admin"),
    ...timestamps,
  },
  (t) => ({
    usersEmailKey: uniqueIndex("users_email_key").on(t.email),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Sensors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calibration model (Go service applies before storing):
 *
 *   calibrated = calibrationMatrix · raw + bias
 *
 *   calibrationMatrix  NxN  jsonb  e.g. [[a,b],[c,d]]
 *   bias               Nx1  jsonb  e.g. [e, f]
 *   raw                Nx1  one ADC sample per channel
 *
 * channelCount = N drives the expected matrix dimensions.
 */
export const sensors = pgTable("sensors", {
  id:           uuid("id").primaryKey(),
  organisationId:        uuid("organisation_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),
  description:  text("description"),
  serialNumber: varchar("serial_number", { length: 255 }),
  channelCount: integer("channel_count").notNull(),

  /** NxN — outer = rows, inner = columns */
  calibrationMatrix: jsonb("calibration_matrix")
    .$type<number[][]>(),
  /** Nx1 bias vector */
  bias: jsonb("bias").$type<number[]>(),

  calibratedAt: timestamp("calibrated_at", { withTimezone: true }),
  /** Calibration cert / datasheet URL in s3 or pre-signed HTTPS. */
  sensorSheetUrl: text("sensor_sheet_url"),

  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});

// ─────────────────────────────────────────────────────────────────────────────
// Sensor Channels
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One row per physical channel on the sensor (0-based channelIndex).
 * The Go service uses channelIndex to pick the correct matrix column
 * and bias element, and to tag rows in hyper_channel_data.
 */
export const sensorChannels = pgTable(
  "sensor_channels",
  {
    id:           uuid("id").primaryKey(),
    sensorId:     uuid("sensor_id")
                    .notNull()
                    .references(() => sensors.id, { onDelete: "cascade" }),
    channelIndex: integer("channel_index").notNull(), // 0 … N-1
    name:         text("name").notNull(),             // e.g. "Strain Gauge X"
    unit:         text("unit").notNull(),             // e.g. "µε", "°C", "MPa"

    /** Post-calibration operating range */
    minValue: real("min_value"),
    maxValue: real("max_value"),

    /** Post-calibration fault thresholds */
    failureThresholdLo: real("failure_threshold_lo"),
    failureThresholdHi: real("failure_threshold_hi"),

    ...timestamps,
  },
  (t) => ({
    sensorChannelUnique: uniqueIndex("sensor_channels_sensor_idx_unique").on(
      t.sensorId,
      t.channelIndex,
    ),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Experiments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sensorConfig — sensor membership + chart layout in one JSONB blob.
 * Replaces the experiment_sensors join table entirely.
 *
 * Shape:
 * {
 *   sensors: [
 *     {
 *       sensorId: "<uuid>",
 *       channelIndices: [0, 1]   // null = all channels
 *     }
 *   ],
 *   charts: [
 *     {
 *       id: "c1",
 *       title: "Bridge Strain vs Load",
 *       type: "line",            // 'line'|'bar'|'scatter'|'fft'|'heatmap'
 *       xAxis: { label: "Time", unit: "s" },
 *       series: [
 *         {
 *           sensorId: "<uuid>",
 *           channelIndex: 0,
 *           label: "Strain (µε)",
 *           color: "#E25C5C",
 *           transform: "value * 1e6"   // JS expr; vars: value, t
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
type SensorConfig = {
  sensors: Array<{
    sensorId: string;
    channelIndices: number[] | null;
  }>;
  charts: Array<{
    id: string;
    title: string;
    type: "line" | "bar" | "scatter" | "fft" | "heatmap";
    xAxis: { label: string; unit: string };
    series: Array<{
      sensorId: string;
      channelIndex: number;
      label: string;
      color?: string;
      transform?: string;
    }>;
  }>;
};

export const experiments = pgTable("experiments", {
  id:             uuid("id").primaryKey(),
  organizationId: uuid("organization_id")
                    .notNull()
                    .references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by_user_id")
               .notNull()
               .references(() => users.id, { onDelete: "cascade" }),
  name:        text("name").notNull(),
  description: text("description"),

  /**
   * Experiment lifecycle.
   * Values: 'draft' | 'active' | 'archived'
   */
  status: text("status").notNull().default("draft"),

  /**
   * Sensor membership + chart config — no join table needed.
   * Null until the user configures sensors for this experiment.
   */
  sensorConfig: jsonb("sensor_config").$type<SensorConfig>(),

  ...timestamps,
});

// ─────────────────────────────────────────────────────────────────────────────
// Runs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One timed execution of an experiment.
 * The Go service streams samples into hyper_channel_data keyed by run_id.
 *
 * Storage state machine:
 *   timescale ──(3 days)──► archiving ──► s3
 *   s3 ──(user request)──► restoring ──► timescale
 */
export const runs = pgTable("runs", {
    id:           uuid("id").primaryKey(),
    experimentId: uuid("experiment_id")
                    .notNull()
                    .references(() => experiments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),

    /**
     * Run lifecycle.
     * Values: 'queued' | 'running' | 'completed' | 'failed' | 'stopped'
     */
    status: text("status").notNull().default("queued"),

    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt:   timestamp("ended_at",   { withTimezone: true }),

    // ── Storage tracking ────────────────────────────────────────────────
    /**
     * Where the raw channel data lives right now.
     * Values: 'timescale' | 'archiving' | 's3' | 'restoring'
     */
    storageLocation: text("storage_location").notNull().default("timescale"),

    /**
     * Usually 'hyper_channel_data' (shared table).
     * Go may create per-run tables hyper_{run_id} for very high-throughput runs.
     */
    hypertableName: text("hypertable_name").notNull().default("hyper_channel_data"),

    /** Approximate row count — Go service updates this periodically. */
    rowCount: integer("row_count").default(0),

    // ── s3 / Parquet ──────────────────────────────────────────────────
    /** Populated once archived. e.g. runs/{organisation_id}/{experiment_id}/{run_id}/data.parquet */
    s3Path:    text("s3_path"),
    s3Bucket:  text("s3_bucket"),
    /** Parquet file size in bytes (informational). */
    parquetBytes: integer("parquet_bytes"),
    archivedAt:   timestamp("archived_at",  { withTimezone: true }),
    restoredAt:   timestamp("restored_at",  { withTimezone: true }),

    notes: text("notes"),
    /** Go service stores sampling_rate_hz, firmware_version, trigger_source, etc. */
    meta: jsonb("meta").$type<Record<string, unknown>>(),

    ...timestamps,
  },
  (t) => ({
    runsExperimentIdx:    index("runs_experiment_idx").on(t.experimentId),
    runsStorageIdx:       index("runs_storage_location_idx").on(t.storageLocation),
    runsStatusIdx:        index("runs_status_idx").on(t.status),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// Channels  (from original schema — per-run channel metadata)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lightweight channel descriptor attached to a run.
 * Mirrors what sensor_channels holds at the sensor level, but scoped to
 * a specific run — useful for storing any run-specific overrides or
 * for the Go service to register which channels were actually active.
 *
 * dataType values: 'float' | 'int' | 'bool' | 'string'
 */
export const channels = pgTable("channels", {
  id:    uuid("id").primaryKey(),
  runId: uuid("run_id")
           .notNull()
           .references(() => runs.id, { onDelete: "cascade" }),
  /** Links back to the source sensor channel (nullable — custom channels have no sensor). */
  sensorChannelId: uuid("sensor_channel_id").references(
    () => sensorChannels.id,
    { onDelete: "set null" },
  ),
  name:     text("name").notNull(),
  unit:     text("unit"),
  dataType: text("data_type").notNull().default("float"),
  ...timestamps,
});

// ─────────────────────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users:       many(users),
  sensors:     many(sensors),
  experiments: many(experiments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  primaryOrganization: one(organizations, {
    fields:     [users.organisationId],
    references: [organizations.id],
  }),
  org: one(organizations, {
    fields:     [users.organisationId],
    references: [organizations.id],
  }),
  createdSensors:     many(sensors),
  createdExperiments: many(experiments),
}));

export const sensorsRelations = relations(sensors, ({ one, many }) => ({
  org: one(organizations, {
    fields:     [sensors.organisationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields:     [sensors.createdBy],
    references: [users.id],
  }),
  channels: many(sensorChannels),
}));

export const sensorChannelsRelations = relations(sensorChannels, ({ one, many }) => ({
  sensor: one(sensors, {
    fields:     [sensorChannels.sensorId],
    references: [sensors.id],
  }),
  channels: many(channels),
}));

export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  organization: one(organizations, {
    fields:     [experiments.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields:     [experiments.createdBy],
    references: [users.id],
  }),
  runs: many(runs),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  experiment: one(experiments, {
    fields:     [runs.experimentId],
    references: [experiments.id],
  }),
  channels: many(channels),
}));

export const channelsRelations = relations(channels, ({ one }) => ({
  run: one(runs, {
    fields:     [channels.runId],
    references: [runs.id],
  }),
  sensorChannel: one(sensorChannels, {
    fields:     [channels.sensorChannelId],
    references: [sensorChannels.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Hypertable DDL  (Go-owned — NOT managed by Drizzle)
// ─────────────────────────────────────────────────────────────────────────────
//
// /migrations/hypertables.sql
//
// CREATE TABLE hyper_channel_data (
//   time              TIMESTAMPTZ      NOT NULL,
//   run_id            UUID             NOT NULL,   -- → runs.id
//   channel_id        UUID,                        -- → channels.id (nullable for raw streams)
//   sensor_id         UUID             NOT NULL,   -- → sensors.id
//   channel_index     SMALLINT         NOT NULL,
//   raw_value         DOUBLE PRECISION,
//   calibrated_value  DOUBLE PRECISION,
//   is_valid          BOOLEAN          NOT NULL DEFAULT TRUE,
//   PRIMARY KEY (time, run_id, channel_index)
// );
//
// SELECT create_hypertable('hyper_channel_data', 'time',
//   chunk_time_interval => INTERVAL '1 hour');
//
// ALTER TABLE hyper_channel_data SET (
//   timescaledb.compress,
//   timescaledb.compress_orderby   = 'time DESC',
//   timescaledb.compress_segmentby = 'run_id, sensor_id'
// );
// SELECT add_compression_policy('hyper_channel_data',
//   compress_after => INTERVAL '3 days');