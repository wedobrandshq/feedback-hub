import { seedDatabase } from "../src/server/seed";
import { prisma } from "../src/server/db";

seedDatabase()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
