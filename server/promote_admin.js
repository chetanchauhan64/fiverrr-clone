import { prisma } from "./utils/prisma.js";

async function promoteToAdmin() {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "admin" },
      });
      console.log(`User ${user.email} promoted to admin!`);
    } else {
      console.log("No users found in database.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

promoteToAdmin();
