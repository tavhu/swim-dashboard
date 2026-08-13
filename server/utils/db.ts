import { PrismaClient } from "@prisma/client";
import type { H3Event } from "h3";

/**
 * One PrismaClient for the whole server process.
 *
 * `server/middleware/prisma.ts` puts this on `event.context.prisma`, but Nitro
 * runs middleware in filename order, so anything alphabetically before
 * "prisma" — including `authorize.ts` — sees an empty context. Rather than
 * depend on that ordering (or spin up a second connection pool), both go
 * through here.
 *
 * The `globalThis` cache survives Nitro's dev-mode hot reloads, which
 * otherwise leak a new pool on every file save until Postgres refuses
 * connections.
 */
const globalForPrisma = globalThis as unknown as { __swimsPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__swimsPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__swimsPrisma = prisma;
}

/** The client for this request, attaching it to the context if it isn't yet. */
export function usePrisma(event: H3Event): PrismaClient {
  if (!event.context.prisma) event.context.prisma = prisma;
  return event.context.prisma;
}
