import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import superjson from "superjson";
import { authOptions } from "@/lib/auth/auth-options";
import { db } from "@/server/db";
import { logger } from "@/lib/logger";

export async function createTRPCContext() {
  const session = await getServerSession(authOptions);

  return {
    session,
    db,
    logger,
  };
}

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

const loggerMiddleware = t.middleware(async ({ path, type, next, input }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  const meta = { path, type, durationMs };

  if (result.ok) {
    logger.info(meta, `tRPC ${type} ${path} - OK`);
  } else {
    logger.error({ ...meta, error: result.error }, `tRPC ${type} ${path} - ERROR: ${result.error.message}`);
  }

  return result;
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const protectedProcedure = t.procedure.use(loggerMiddleware).use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
