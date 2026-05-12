import { prisma } from "@/lib/db";

export type LayoutVariant = "m3" | "bd";

export async function getActiveLayout(): Promise<LayoutVariant> {
  try {
    const cfg = await prisma.siteConfig.findUnique({
      where: { key: "theme_layout" },
    });
    if (cfg?.value === "m3" || cfg?.value === "bd") return cfg.value;
  } catch {}
  // Fallback: infer from company_name
  try {
    const company = await prisma.siteConfig.findUnique({ where: { key: "company_name" } });
    if (company?.value === "Bitdefender") return "bd";
  } catch {}
  return "m3";
}
