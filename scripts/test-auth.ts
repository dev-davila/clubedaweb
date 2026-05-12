import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const credentials = {
    email: "admin@m3solutions.com.br",
    password: "M3Admin@2024"
  };
  
  if (!credentials?.email || !credentials?.password) {
    console.log("Missing credentials");
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: credentials.email }
  });
  
  if (!user) {
    console.log("User not found");
    return null;
  }
  
  console.log("User found:", user.email);
  console.log("User password hash:", user.password);
  
  const isValid = await bcrypt.compare(credentials.password, user.password);
  console.log("Password valid:", isValid);
  
  if (!isValid) {
    console.log("Invalid password");
    return null;
  }
  
  console.log("Login would succeed with:", {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
