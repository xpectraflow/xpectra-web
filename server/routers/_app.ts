import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "@/server/routers/auth";
import { experimentsRouter } from "@/server/routers/experiments";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  experiments: experimentsRouter,
});

export type AppRouter = typeof appRouter;
