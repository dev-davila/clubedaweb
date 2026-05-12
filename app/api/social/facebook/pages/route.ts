export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Listar páginas disponíveis
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const pagesConfig = await prisma.siteConfig.findFirst({
      where: { key: "facebook_pages" }
    });

    let pages: any[] = [];
    if (pagesConfig?.value) {
      try {
        pages = JSON.parse(pagesConfig.value);
      } catch (e) {
        // ignore parse error
      }
    }

    // Pegar página atual selecionada
    const account = await prisma.socialMediaAccount.findFirst({
      where: { platform: "facebook" }
    });

    return NextResponse.json({
      pages,
      selectedPageId: account?.accountId || null
    });
  } catch (error) {
    console.error("Erro ao buscar páginas:", error);
    return NextResponse.json({ error: "Erro ao buscar páginas" }, { status: 500 });
  }
}

// POST - Selecionar uma página para publicação
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { pageId } = await request.json();

    if (!pageId) {
      return NextResponse.json(
        { error: "ID da página é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar conta atual
    const account = await prisma.socialMediaAccount.findFirst({
      where: { platform: "facebook" }
    });

    if (!account || !account.refreshToken) {
      return NextResponse.json(
        { error: "Conta do Facebook não encontrada. Reconecte." },
        { status: 400 }
      );
    }

    // Buscar token da página específica
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token,picture&access_token=${account.refreshToken}`
    );

    if (!pagesResponse.ok) {
      return NextResponse.json(
        { error: "Erro ao buscar páginas. Token pode ter expirado." },
        { status: 400 }
      );
    }

    const pagesData = await pagesResponse.json();
    const selectedPage = (pagesData.data || []).find((p: any) => p.id === pageId);

    if (!selectedPage) {
      return NextResponse.json(
        { error: "Página não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar conta com a nova página
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: {
        accessToken: selectedPage.access_token,
        accountId: selectedPage.id,
        accountName: selectedPage.name,
        profileUrl: `https://www.facebook.com/${selectedPage.id}`,
        profileImage: selectedPage.picture?.data?.url || null,
        lastError: null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      page: {
        id: selectedPage.id,
        name: selectedPage.name
      }
    });
  } catch (error) {
    console.error("Erro ao selecionar página:", error);
    return NextResponse.json({ error: "Erro ao selecionar página" }, { status: 500 });
  }
}
