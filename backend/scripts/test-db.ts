import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connection successful!");

    const teamCount = await prisma.team.count();
    console.log(`Current team count: ${teamCount}`);

    await prisma.$disconnect();
    console.log("Database disconnected.");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

main();
