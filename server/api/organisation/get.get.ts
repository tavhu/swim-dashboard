import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const organisations = await prisma.organisation.findMany();
  return organisations;
});
