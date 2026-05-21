import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { logger } from "@/lib/logger";
import {
  getStitchMenuItems,
  saveStitchMenuItems,
  type StitchMenuItem,
} from "@/lib/stitch/menu-items";
import { REQUIRED_PAGE_TYPES } from "@/lib/themes/required-pages";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  type: z.enum(REQUIRED_PAGE_TYPES as unknown as [string, ...string[]]),
  label: z.string().min(1).max(80),
  visible: z.boolean().optional(),
});

const putSchema = z.object({
  items: z.array(itemSchema).min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await getStitchMenuItems();
  return NextResponse.json({ items });
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = putSchema.parse(await request.json());
    const items: StitchMenuItem[] = body.items.map((i, idx) => ({
      type: i.type as StitchMenuItem["type"],
      label: i.label,
      route: "",
      order: idx,
      visible: i.visible !== false,
    }));
    await saveStitchMenuItems(items);
    const fresh = await getStitchMenuItems();
    return NextResponse.json({ ok: true, items: fresh });
  } catch (err) {
    logger.error("[stitch-menu] PUT", err instanceof Error ? err.stack : String(err));
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
