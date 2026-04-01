## Xpectra Web (Phase 1)

Phase 1 includes local, offline-friendly credentials authentication with NextAuth.

### Environment

Create `.env.local`:

```bash
NEXTAUTH_SECRET=replace-with-a-long-random-string
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
```

Credentials users live in Postgres (`users` table). Drizzle migrations run once on Node server startup (`instrumentation.ts`).

### Drizzle

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Schema and migrations are in `server/db/schema.ts` and `drizzle/`.

### Getting started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000), then create an account at `/register`.

### Auth routes

- `GET/POST /api/auth/[...nextauth]`
- `POST /api/auth/register`

### tRPC route

- `GET/POST /api/trpc/[trpc]`

### Experiments (Phase 3)

- `/experiments`
- `/experiments/create`
- `/experiments/[experimentId]`
- `/experiments/[experimentId]/edit`

### Runs & channels (Phase 4)

- `/experiments/[experimentId]/runs/[runId]`

### Telemetry visualization (Phase 5)

- tRPC procedure: `telemetry.getTelemetryData`
- Data source: `xpectra-consumer` gRPC `TelemetryService/Query` (hypertable-backed)
- Components: `TelemetryChart` (Apache ECharts), `ChannelSelector`, `TimeRangeSelector`, `MetricsPanel`
