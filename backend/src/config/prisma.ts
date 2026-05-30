import { PrismaClient } from "@prisma/client";
const g=globalThis as any;
export const prisma=g.prisma||new PrismaClient({log:process.env.NODE_ENV==="development"?["error","warn"]:["error"]});
if(process.env.NODE_ENV!=="production") g.prisma=prisma;
