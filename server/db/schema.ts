import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestampColumns = {
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
  ...timestampColumns,
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    primaryOrganizationId: uuid("primary_organization_id").references(
      () => organizations.id,
    ),
    ...timestampColumns,
  },
  (table) => ({
    usersEmailKey: uniqueIndex("users_email_key").on(table.email),
  }),
);

export const experiments = pgTable("experiments", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  ...timestampColumns,
});

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey(),
  experimentId: uuid("experiment_id")
    .notNull()
    .references(() => experiments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("queued"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  ...timestampColumns,
});

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey(),
  runId: uuid("run_id")
    .notNull()
    .references(() => runs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  unit: text("unit"),
  dataType: text("data_type").notNull().default("float"),
  ...timestampColumns,
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  experiments: many(experiments),
}));

export const usersRelations = relations(users, ({ one }) => ({
  primaryOrganization: one(organizations, {
    fields: [users.primaryOrganizationId],
    references: [organizations.id],
  }),
}));

export const experimentsRelations = relations(experiments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [experiments.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [experiments.createdBy],
    references: [users.id],
  }),
  runs: many(runs),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  experiment: one(experiments, {
    fields: [runs.experimentId],
    references: [experiments.id],
  }),
  channels: many(channels),
}));

export const channelsRelations = relations(channels, ({ one }) => ({
  run: one(runs, {
    fields: [channels.runId],
    references: [runs.id],
  }),
}));
