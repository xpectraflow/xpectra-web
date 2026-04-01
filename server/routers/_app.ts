import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "@/server/routers/auth";
import { channelsRouter } from "@/server/routers/channels";
import { experimentsRouter } from "@/server/routers/experiments";
import { runsRouter } from "@/server/routers/runs";
import { organizationsRouter } from "@/server/routers/organizations";
import { telemetryRouter } from "@/server/routers/telemetry";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  channels: channelsRouter,
  experiments: experimentsRouter,
  runs: runsRouter,
  organizations: organizationsRouter,
  telemetry: telemetryRouter,
});

export type AppRouter = typeof appRouter;
