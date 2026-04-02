import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "@/server/routers/auth";
import { channelsRouter } from "@/server/routers/channels";
import { experimentsRouter } from "@/server/routers/experiments";
import { runsRouter } from "@/server/routers/runs";
import { organizationsRouter } from "@/server/routers/organizations";
import { telemetryRouter } from "@/server/routers/telemetry";
import { sensorsRouter } from "@/server/routers/sensors";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  channels: channelsRouter,
  experiments: experimentsRouter,
  runs: runsRouter,
  organizations: organizationsRouter,
  telemetry: telemetryRouter,
  sensors: sensorsRouter,
});

export type AppRouter = typeof appRouter;
