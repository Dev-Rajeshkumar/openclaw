/**
 * Prisma Client — Server-side only (Next.js API routes, SSR)
 * 
 * IMPORTANT: Only import this in server-side code (API routes, getServerSideProps, etc.)
 * For client-side data fetching, use the Strapi API via lib/api.ts
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
