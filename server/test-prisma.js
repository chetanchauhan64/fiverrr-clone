import { PrismaClient } from '@prisma/client';
console.log("Starting script");
try {
  const prisma = new PrismaClient();
  console.log("Success");
} catch(e) {
  console.error(e);
}
