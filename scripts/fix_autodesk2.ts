import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.partner.updateMany({
    where: { name: "Autodesk" },
    data: { website: null }
  });
  console.log("Autodesk URL removed");
}

main().catch(console.error).finally(() => prisma.$disconnect());
