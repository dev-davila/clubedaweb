export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Busca organizações que o usuário administra
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar conta do LinkedIn
    const account = await prisma.socialMediaAccount.findFirst({
      where: { platform: "linkedin", isConnected: true, active: true }
    });

    if (!account || !account.accessToken) {
      return NextResponse.json(
        { error: "LinkedIn não conectado" },
        { status: 400 }
      );
    }

    // Buscar organizações que o usuário administra
    // Usando a API v2 organizationalEntityAcls
    const orgsResponse = await fetch(
      "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(id,localizedName,vanityName,logoV2(original~:playableStreams))))",
      {
        headers: {
          "Authorization": `Bearer ${account.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0"
        }
      }
    );

    if (!orgsResponse.ok) {
      const errorData = await orgsResponse.json();
      console.error("Erro ao buscar organizações:", errorData);
      
      // Se o erro for de permissão, retornar mensagem amigável
      if (orgsResponse.status === 403) {
        return NextResponse.json({
          organizations: [],
          message: "Sem permissão para acessar organizações. Verifique se o app LinkedIn tem as permissões necessárias (w_organization_social).",
          needsPermission: true
        });
      }
      
      return NextResponse.json(
        { error: errorData.message || "Erro ao buscar organizações" },
        { status: 400 }
      );
    }

    const data = await orgsResponse.json();
    
    // Extrair informações das organizações
    const organizations = (data.elements || []).map((element: any) => {
      const org = element["organizationalTarget~"];
      if (!org) return null;
      
      // Extrair ID do URN (urn:li:organization:XXXXX)
      const orgUrn = element.organizationalTarget;
      const orgId = orgUrn?.replace("urn:li:organization:", "");
      
      // Extrair logo se disponível
      let logoUrl = null;
      try {
        const logoData = org.logoV2?.["original~"];
        if (logoData?.elements?.[0]?.identifiers?.[0]?.identifier) {
          logoUrl = logoData.elements[0].identifiers[0].identifier;
        }
      } catch (e) {}
      
      return {
        id: orgId,
        urn: orgUrn,
        name: org.localizedName,
        vanityName: org.vanityName,
        logoUrl
      };
    }).filter(Boolean);

    return NextResponse.json({
      organizations,
      currentOrganizationId: account.organizationId,
      postAsOrganization: account.postAsOrganization,
      postAsBoth: account.postAsBoth
    });

  } catch (error: any) {
    console.error("Erro ao buscar organizações:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Configura a organização para postar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationId, organizationName, postAsOrganization, postAsBoth } = body;

    // Buscar conta do LinkedIn
    const account = await prisma.socialMediaAccount.findFirst({
      where: { platform: "linkedin", isConnected: true, active: true }
    });

    if (!account) {
      return NextResponse.json(
        { error: "LinkedIn não conectado" },
        { status: 400 }
      );
    }

    // Atualizar configuração
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: {
        organizationId: organizationId || null,
        organizationName: organizationName || null,
        postAsOrganization: postAsOrganization ?? false,
        postAsBoth: postAsBoth ?? false
      }
    });

    // Determinar mensagem de sucesso
    let message = "Configurado para postar como perfil pessoal";
    if (postAsBoth) {
      message = `Configurado para postar em ambos: Perfil Pessoal e ${organizationName}`;
    } else if (postAsOrganization) {
      message = `Configurado para postar como ${organizationName}`;
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error: any) {
    console.error("Erro ao configurar organização:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
