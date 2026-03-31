import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "@/server/routers/auth";
import { channelsRouter } from "@/server/routers/channels";
import { experimentsRouter } from "@/server/routers/experiments";
import { runsRouter } from "@/server/routers/runs";
import { telemetryRouter } from "@/server/routers/telemetry";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  channels: channelsRouter,
  experiments: experimentsRouter,
  runs: runsRouter,
  telemetry: telemetryRouter,
});

export type AppRouter = typeof appRouter;
