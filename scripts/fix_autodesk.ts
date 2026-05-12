import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.partner.updateMany({
    where: { name: "Autodesk" },
    data: { website: "https://www.autodesk.com" }
  });
  console.log("Autodesk URL updated");
}

main().catch(console.error).finally(() => prisma.$disconnect());
