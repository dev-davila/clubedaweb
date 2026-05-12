export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { DEFAULT_BRAND, getActiveBrand } from "@/lib/theme-config";

export async function GET() {
  try {
    const brand = await getActiveBrand();
    return NextResponse.json(brand);
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json({ error: "Erro ao buscar tema" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = {
      primaryColor: body.primaryColor ?? DEFAULT_BRAND.primaryColor,
      secondaryColor: body.secondaryColor ?? DEFAULT_BRAND.secondaryColor,
      accentColor: body.accentColor ?? DEFAULT_BRAND.accentColor,
      textColor: body.textColor ?? DEFAULT_BRAND.textColor,
      textLightColor: body.textLightColor ?? DEFAULT_BRAND.textLightColor,
      backgroundColor: body.backgroundColor ?? DEFAULT_BRAND.backgroundColor,
      surfaceColor: body.surfaceColor ?? DEFAULT_BRAND.surfaceColor,
      fontPrimary: body.fontPrimary ?? DEFAULT_BRAND.fontPrimary,
      fontSecondary: body.fontSecondary ?? DEFAULT_BRAND.fontSecondary,
      fontHeading: body.fontHeading ?? DEFAULT_BRAND.fontHeading,
      logoUrl: body.logoUrl ?? null,
      logoLightUrl: body.logoLightUrl ?? null,
      logoIconUrl: body.logoIconUrl ?? null,
      styleType: body.styleType ?? DEFAULT_BRAND.styleType,
      borderRadius: body.borderRadius ?? DEFAULT_BRAND.borderRadius,
      buttonStyle: body.buttonStyle ?? DEFAULT_BRAND.buttonStyle,
      iconStyle: body.iconStyle ?? DEFAULT_BRAND.iconStyle,
      active: true,
    };

    const existing = await prisma.brandTokens.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.brandTokens.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.brandTokens.create({ data });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating brand:", error);
    return NextResponse.json({ error: "Erro ao salvar tema" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
