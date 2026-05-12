export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// POST: Assign/remove tag from conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { conversationId, tagId, action } = body;
    if (!conversationId || !tagId || !action) {
      return NextResponse.json({ error: "conversationId, tagId e action obrigat\u00f3rios" }, { status: 400 });
    }

    if (action === "add") {
      await prisma.waConversationTag.upsert({
        where: { conversationId_tagId: { conversationId, tagId } },
        update: {},
        create: { conversationId, tagId },
      });
    } else if (action === "remove") {
      await prisma.waConversationTag.deleteMany({
        where: { conversationId, tagId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
