export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Public menu access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuName = searchParams.get("name");

    if (menuName) {
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

    // Return all menus
    const menus = await prisma.navigationMenu.findMany({
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

    // Return as a map: { header: {...}, "footer-solucoes": {...}, ... }
    const menuMap: Record<string, any> = {};
    menus.forEach(m => { menuMap[m.name] = m; });
    return NextResponse.json(menuMap);
  } catch (error) {
    console.error("[PUBLIC-NAV] Error:", error);
    return NextResponse.json({});
  }
}
