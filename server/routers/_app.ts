import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "@/server/routers/auth";

export const appRouter = createTRPCRouter({
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
