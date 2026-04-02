import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const gigCount = await prisma.gigs.count();
  const allGigs = await prisma.gigs.findMany({ select: { title: true } });
  
  console.log("Users:", userCount);
  console.log("Gigs:", gigCount);
  console.log("Titles:", allGigs.map(g => g.title));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
