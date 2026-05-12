export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// GET - Listar menus (admin) ou obter menu específico (público)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuName = searchParams.get("name");
    const publicAccess = searchParams.get("public") === "true";

    // Public access - get specific menu by name
    if (publicAccess && menuName) {
      const menu = await prisma.navigationMenu.findUnique({
        where: { name: menuName },
        include: {
          items: {
            where: { active: true, parentId: null },
            orderBy: { order: "asc" },
            include: {
              children: {
                where: { active: true },
                orderBy: { order: "asc" }
              }
            }
          }
        }
      });
      return NextResponse.json(menu);
    }

    // Admin access - list all menus
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const menus = await prisma.navigationMenu.findMany({
      orderBy: { name: "asc" },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { order: "asc" },
          include: {
            children: { orderBy: { order: "asc" } }
          }
        }
      }
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("[NAVIGATION] GET error:", error);
    return NextResponse.json({ error: "Erro ao buscar menus" }, { status: 500 });
  }
}

// POST - Criar menu
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { name, label } = await request.json();
    if (!name || !label) {
      return NextResponse.json({ error: "Nome e label são obrigatórios" }, { status: 400 });
    }

    const menu = await prisma.navigationMenu.create({ data: { name, label } });
    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("[NAVIGATION] POST error:", error);
    return NextResponse.json({ error: "Erro ao criar menu" }, { status: 500 });
  }
}

// PUT - Atualizar itens de um menu (bulk update)
// Accepts flat list with parentId references OR tree with children array
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { menuId, menuName, label, items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items é obrigatório" }, { status: 400 });
    }

    // Find or create the menu
    let actualMenuId = menuId;
    if (!actualMenuId && menuName) {
      const existing = await prisma.navigationMenu.findUnique({ where: { name: menuName } });
      if (existing) {
        actualMenuId = existing.id;
        if (label && label !== existing.label) {
          await prisma.navigationMenu.update({ where: { id: existing.id }, data: { label } });
        }
      } else {
        const newMenu = await prisma.navigationMenu.create({
          data: { name: menuName, label: label || menuName }
        });
        actualMenuId = newMenu.id;
      }
    }

    if (!actualMenuId) {
      return NextResponse.json({ error: "menuId ou menuName é obrigatório" }, { status: 400 });
    }

    // Delete all existing items for this menu
    await prisma.navigationItem.deleteMany({ where: { menuId: actualMenuId } });

    // Separate root items and children (flat list with parentId)
    const rootItems = items.filter((i: any) => !i.parentId);
    const childItems = items.filter((i: any) => i.parentId);

    // Map old IDs/tempIds to new DB IDs
    const idMap = new Map<string, string>();

    // Create root items first
    for (let i = 0; i < rootItems.length; i++) {
      const item = rootItems[i];
      const created = await prisma.navigationItem.create({
        data: {
          menuId: actualMenuId,
          label: item.label,
          url: item.url,
          icon: item.icon || null,
          target: item.target || "_self",
          order: item.order ?? i,
          active: item.active !== false,
          highlight: item.highlight || false
        }
      });
      // Map both old DB id and temp id
      if (item.id) idMap.set(item.id, created.id);
      if (item._tempId) idMap.set(item._tempId, created.id);
    }

    // Create child items
    for (let j = 0; j < childItems.length; j++) {
      const child = childItems[j];
      const newParentId = idMap.get(child.parentId) || child.parentId;
      await prisma.navigationItem.create({
        data: {
          menuId: actualMenuId,
          parentId: newParentId,
          label: child.label,
          url: child.url,
          icon: child.icon || null,
          target: child.target || "_self",
          order: child.order ?? j,
          active: child.active !== false,
          highlight: child.highlight || false
        }
      });
    }

    // Return updated menu
    const updatedMenu = await prisma.navigationMenu.findUnique({
      where: { id: actualMenuId },
      include: {
        items: {
          where: { parentId: null },
          orderBy: { order: "asc" },
          include: { children: { orderBy: { order: "asc" } } }
        }
      }
    });

    return NextResponse.json(updatedMenu);
  } catch (error) {
    console.error("[NAVIGATION] PUT error:", error);
    return NextResponse.json({ error: "Erro ao atualizar menu" }, { status: 500 });
  }
}
