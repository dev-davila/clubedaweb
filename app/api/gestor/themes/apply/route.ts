export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { THEME_PRESETS } from "@/lib/themes/presets";
import { applyThemePreset } from "@/lib/themes/apply-theme";
import { REQUIRED_PAGE_TYPES } from "@/lib/themes/required-pages";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { themeKey } = await request.json();
    const preset = THEME_PRESETS[themeKey];
    if (!preset) return NextResponse.json({ error: "Tema inválido" }, { status: 400 });

    await applyThemePreset(preset);

    return NextResponse.json({
      success: true,
      applied: themeKey,
      requiredPages: REQUIRED_PAGE_TYPES,
    });
  } catch (error) {
    console.error("[THEMES] apply error:", error);
    return NextResponse.json({ error: "Erro ao aplicar tema" }, { status: 500 });
  }
}
