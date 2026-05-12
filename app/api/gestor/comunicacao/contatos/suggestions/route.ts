export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET — returns distinct companies and tags from existing contacts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "N\u00e3o autorizado" }, { status: 401 });
    }

    // Fetch distinct companies
    const companiesRaw = await prisma.waContact.findMany({
      where: { ownerId: session.user.id, company: { not: null } },
      select: { company: true },
      distinct: ["company"],
      orderBy: { company: "asc" },
    });
    const companies = companiesRaw
      .map((c) => c.company?.trim())
      .filter((c): c is string => !!c);

    // Fetch distinct tags (stored as comma-separated in each contact)
    const tagsRaw = await prisma.waContact.findMany({
      where: { ownerId: session.user.id, tags: { not: null } },
      select: { tags: true },
    });
    const tagSet = new Set<string>();
    for (const row of tagsRaw) {
      if (row.tags) {
        row.tags.split(",").forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    }
    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return NextResponse.json({ companies, tags });
  } catch (err: any) {
    console.error("[Contatos Suggestions GET]", err);
    return NextResponse.json({ error: "Erro ao buscar sugest\u00f5es" }, { status: 500 });
  }
}
