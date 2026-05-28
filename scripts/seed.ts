import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin padrão (troque a senha no primeiro login).
  const hashedPassword = await bcrypt.hash("Admin@2026", 10);
  await prisma.user.upsert({
    where: { email: "admin@local" },
    update: {},
    create: {
      email: "admin@local",
      name: "Administrador",
      password: hashedPassword,
      role: "admin"
    }
  });
  console.log("Admin user created");

  // Parceiros placeholder (substitua pelos do site no admin).
  const partners = [
    { name: "Parceiro 01", logoUrl: "/placeholder-logo.svg", description: "Descrição do parceiro.", website: "https://example.com", order: 1 },
    { name: "Parceiro 02", logoUrl: "/placeholder-logo.svg", description: "Descrição do parceiro.", website: "https://example.com", order: 2 },
    { name: "Parceiro 03", logoUrl: "/placeholder-logo.svg", description: "Descrição do parceiro.", website: "https://example.com", order: 3 }
  ];
  for (const partner of partners) {
    const id = partner.name.toLowerCase().replace(/\s+/g, "-");
    await prisma.partner.upsert({
      where: { id },
      update: partner,
      create: { ...partner, id }
    });
  }
  console.log("Partners created");

  // Autor editorial padrão (substitua/adicione no admin).
  await prisma.blogAuthor.upsert({
    where: { slug: "equipe-editorial" },
    update: { name: "Equipe Editorial", bio: "Equipe editorial do site." },
    create: { name: "Equipe Editorial", slug: "equipe-editorial", bio: "Equipe editorial do site." }
  });
  console.log("Blog author created");

  // Voice templates genéricos (servem qualquer nicho).
  const voiceTemplates = [
    {
      name: "Padrão",
      description: "Tom profissional padrão para conteúdo institucional.",
      persona: "Você é um redator de conteúdo institucional.\n\nTom: Profissional, claro e objetivo.\nEstilo: Direto e informativo.\nObjetivo: Comunicar com clareza e gerar engajamento.\n\nDiretrizes:\n- Use linguagem acessível\n- Foque em benefícios práticos\n- Termine com um CTA claro",
      tone: "Profissional",
      isDefault: true
    },
    {
      name: "Educativo",
      description: "Tom didático para explicar conceitos complexos.",
      persona: "Você é um educador que explica conceitos complexos de forma simples.\n\nTom: Didático, acessível e paciente.\nEstilo: Usa analogias e exemplos do dia a dia.\nObjetivo: Desmistificar conceitos para um público amplo.\n\nDiretrizes:\n- Evite jargões desnecessários\n- Use analogias para explicar conceitos\n- Divida informações em tópicos claros\n- Inclua exemplos práticos",
      tone: "Educativo e acessível",
      isDefault: false
    },
    {
      name: "Urgência",
      description: "Tom que transmite urgência para temas críticos.",
      persona: "Você é um especialista alertando sobre riscos.\n\nTom: Urgente mas não alarmista.\nEstilo: Direto, com fatos e dados de impacto.\nObjetivo: Motivar ação imediata sem causar pânico.\n\nDiretrizes:\n- Apresente os riscos de forma clara\n- Use dados concretos\n- Ofereça soluções práticas\n- Crie senso de urgência para ação",
      tone: "Urgente e direto",
      isDefault: false
    }
  ];
  for (const template of voiceTemplates) {
    const existing = await prisma.voiceTemplate.findFirst({ where: { name: template.name } });
    if (!existing) {
      await prisma.voiceTemplate.create({ data: template });
    }
  }
  console.log("Voice templates created");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
