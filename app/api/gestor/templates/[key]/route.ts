export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTemplate } from "@/lib/templates";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { key } = await params;
    const template = getTemplate(key);
    if (!template) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });

    // Strip Component (not serializable) — keep only metadata
    const sections: Record<string, any> = {};
    for (const [k, def] of Object.entries(template.sections)) {
      sections[k] = {
        key: def.key,
        label: def.label,
        description: def.description,
        fields: def.fields,
      };
    }

    return NextResponse.json({
      key: template.key,
      name: template.name,
      description: template.description,
      sections,
    });
  } catch (error) {
    console.error("[TEMPLATES] GET error:", error);
    return NextResponse.json({ error: "Erro ao buscar template" }, { status: 500 });
  }
}
