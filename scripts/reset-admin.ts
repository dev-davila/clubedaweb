import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, name: true, role: true } });
  console.log("Users:", users);
  
  // Reset admin password
  const hashedPassword = await bcrypt.hash("M3Admin@2024", 10);
  const result = await prisma.user.updateMany({
    where: { email: "admin@m3solutions.com.br" },
    data: { password: hashedPassword }
  });
  console.log("Password reset for admin@m3solutions.com.br:", result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
