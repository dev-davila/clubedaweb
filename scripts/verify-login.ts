import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: "admin@m3solutions.com.br" },
    select: { id: true, email: true, password: true }
  });
  
  if (!user) {
    console.log("User not found");
    return;
  }
  
  console.log("User found:", user.email);
  console.log("Password hash length:", user.password?.length);
  
  // Test the password
  const testPassword = "M3Admin@2024";
  const isMatch = await bcrypt.compare(testPassword, user.password || "");
  console.log("Password match:", isMatch);
}

main().catch(console.error).finally(() => prisma.$disconnect());
