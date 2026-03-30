import { publicProcedure, createTRPCRouter } from "@/server/trpc";

export const authRouter = createTRPCRouter({
  getUserSession: publicProcedure.query(({ ctx }) => {
    return {
      isAuthenticated: Boolean(ctx.session?.user),
      user: ctx.session?.user ?? null,
    };
  }),
});
