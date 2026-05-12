export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// POST - Seed menus from current hardcoded data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // Check if menus already exist
    const existing = await prisma.navigationMenu.count();
    if (existing > 0) {
      return NextResponse.json({ message: "Menus já existem. Use a interface para editar." });
    }

    // ========== HEADER MENU ==========
    const headerMenu = await prisma.navigationMenu.create({
      data: { name: "header", label: "Menu Principal" }
    });

    const headerItems = [
      { label: "Home", url: "/", children: [] },
      {
        label: "Soluções",
        url: "/solucoes",
        children: [
          { label: "Segurança Cibernética", url: "/solucoes/seguranca" },
          { label: "Backup e Disaster Recovery", url: "/solucoes/backup" },
          { label: "Cloud Computing", url: "/solucoes/cloud" },
          { label: "Gestão de TI", url: "/solucoes/gestao" },
          { label: "Suporte Técnico", url: "/solucoes/suporte" },
          { label: "Consultoria", url: "/solucoes/consultoria" },
          { label: "Projetos", url: "/solucoes/projetos" },
          { label: "Nuvem Privada", url: "/solucoes/nuvem-privada" },
          { label: "Locação de Equipamentos", url: "/solucoes/locacao" }
        ]
      },
      {
        label: "Portfólio",
        url: "/catalogo",
        children: [
          { label: "Microsoft", url: "/catalogo/microsoft" },
          { label: "Segurança", url: "/catalogo/seguranca" },
          { label: "Backup", url: "/catalogo/backup" },
          { label: "Virtualização", url: "/catalogo/virtualizacao" },
          { label: "Autodesk", url: "/catalogo/autodesk" },
          { label: "Adobe", url: "/catalogo/adobe" }
        ]
      },
      {
        label: "Institucional",
        url: "#",
        children: [
          { label: "Quem Somos", url: "/quem-somos" },
          { label: "Nossos Parceiros", url: "/nossos-parceiros" },
          { label: "Trabalhe Conosco", url: "/trabalhe-conosco" },
          { label: "Missão, Visão e Valores", url: "/missao-visao-e-valores" }
        ]
      },
      { label: "Notícias", url: "/noticias", children: [] },
      { label: "Contato", url: "/contato", children: [] }
    ];

    for (let i = 0; i < headerItems.length; i++) {
      const item = headerItems[i];
      const parentItem = await prisma.navigationItem.create({
        data: { menuId: headerMenu.id, label: item.label, url: item.url, order: i }
      });
      for (let j = 0; j < item.children.length; j++) {
        await prisma.navigationItem.create({
          data: {
            menuId: headerMenu.id,
            parentId: parentItem.id,
            label: item.children[j].label,
            url: item.children[j].url,
            order: j
          }
        });
      }
    }

    // ========== FOOTER - SOLUÇÕES ==========
    const footerSolucoes = await prisma.navigationMenu.create({
      data: { name: "footer-solucoes", label: "Soluções" }
    });
    const solLinks = [
      { label: "Segurança Cibernética", url: "/solucoes/seguranca" },
      { label: "Backup e Recovery", url: "/solucoes/backup" },
      { label: "Cloud Computing", url: "/solucoes/cloud" },
      { label: "Gestão de TI", url: "/solucoes/gestao" },
      { label: "Suporte Técnico", url: "/solucoes/suporte" },
      { label: "Consultoria", url: "/solucoes/consultoria" }
    ];
    for (let i = 0; i < solLinks.length; i++) {
      await prisma.navigationItem.create({
        data: { menuId: footerSolucoes.id, label: solLinks[i].label, url: solLinks[i].url, order: i }
      });
    }

    // ========== FOOTER - PORTFÓLIO ==========
    const footerPortfolio = await prisma.navigationMenu.create({
      data: { name: "footer-portfolio", label: "Portfólio" }
    });
    const portLinks = [
      { label: "Microsoft", url: "/catalogo/microsoft" },
      { label: "Segurança", url: "/catalogo/seguranca" },
      { label: "Backup", url: "/catalogo/backup" },
      { label: "Virtualização", url: "/catalogo/virtualizacao" },
      { label: "Autodesk", url: "/catalogo/autodesk" },
      { label: "Adobe", url: "/catalogo/adobe" }
    ];
    for (let i = 0; i < portLinks.length; i++) {
      await prisma.navigationItem.create({
        data: { menuId: footerPortfolio.id, label: portLinks[i].label, url: portLinks[i].url, order: i }
      });
    }

    // ========== FOOTER - INSTITUCIONAL ==========
    const footerInst = await prisma.navigationMenu.create({
      data: { name: "footer-institucional", label: "Institucional" }
    });
    const instLinks = [
      { label: "Quem Somos", url: "/quem-somos" },
      { label: "Nossos Parceiros", url: "/nossos-parceiros" },
      { label: "Trabalhe Conosco", url: "/trabalhe-conosco" },
      { label: "Missão, Visão e Valores", url: "/missao-visao-e-valores" },
      { label: "Notícias", url: "/noticias" },
      { label: "Contato", url: "/contato" }
    ];
    for (let i = 0; i < instLinks.length; i++) {
      await prisma.navigationItem.create({
        data: { menuId: footerInst.id, label: instLinks[i].label, url: instLinks[i].url, order: i }
      });
    }

    // ========== FOOTER - LEGAL ==========
    const footerLegal = await prisma.navigationMenu.create({
      data: { name: "footer-legal", label: "Legal" }
    });
    const legalLinks = [
      { label: "Aviso de Privacidade", url: "/aviso-de-privacidade" },
      { label: "Aviso de Cookies", url: "/aviso-de-cookies" },
      { label: "LGPD", url: "/lgpd" },
      { label: "Canal de Denúncias", url: "/canal-de-denuncias" }
    ];
    for (let i = 0; i < legalLinks.length; i++) {
      await prisma.navigationItem.create({
        data: { menuId: footerLegal.id, label: legalLinks[i].label, url: legalLinks[i].url, order: i }
      });
    }

    return NextResponse.json({ success: true, message: "Menus criados com sucesso" });
  } catch (error) {
    console.error("[NAVIGATION-SEED] Error:", error);
    return NextResponse.json({ error: "Erro ao criar menus" }, { status: 500 });
  }
}
