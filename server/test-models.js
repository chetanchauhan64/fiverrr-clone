import { prisma } from "./utils/prisma.js";
async function test() {
  try {
    console.log("Checking LoginLog model...");
    const count = await prisma.loginLog.count();
    console.log("Count:", count);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
test();
