import type { PrismaClient } from "@prisma/client";
import { usePrisma } from "../utils/db";

declare module "h3" {
  interface H3EventContext {
    prisma: PrismaClient;
  }
}

// The client itself now lives in server/utils/db.ts so that middleware which
// runs before this one (Nitro orders by filename) can reach the same instance
// instead of opening a second connection pool.
export default eventHandler((event) => {
  usePrisma(event);
});
