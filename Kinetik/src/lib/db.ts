import { PrismaClient } from "@prisma/client";

// Prevent exhausting the Postgres connection pool during dev hot-reloads
// by reusing a single PrismaClient across module reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
