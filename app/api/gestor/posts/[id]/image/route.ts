export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// Item 13: Unified image endpoint
// Actions: preview, confirm, save, regenerate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, imageType = "featured", imageUrl } = body;

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    switch (action) {
      case "preview": {
        // Delegates to the existing generate endpoint for preview
        const generateUrl = new URL(`/api/gestor/posts/${id}/generate-image`, request.url);
        const res = await fetch(generateUrl.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") || ""
          },
          body: JSON.stringify({ previewOnly: true, imageType })
        });
        const data = await res.json();
        return NextResponse.json(data);
      }

      case "confirm":
      case "save": {
        if (!imageUrl) {
          return NextResponse.json({ error: "imageUrl obrigatório" }, { status: 400 });
        }
        const field = imageType === "secondary" ? "secondaryImage" : "featuredImage";
        await prisma.blogPost.update({
          where: { id },
          data: { [field]: imageUrl }
        });
        return NextResponse.json({ success: true, field, imageUrl });
      }

      case "regenerate": {
        // Same as preview but signals regeneration
        const generateUrl2 = new URL(`/api/gestor/posts/${id}/generate-image`, request.url);
        const res2 = await fetch(generateUrl2.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: request.headers.get("cookie") || ""
          },
          body: JSON.stringify({ previewOnly: true, useFallback: true, imageType })
        });
        const data2 = await res2.json();
        return NextResponse.json(data2);
      }

      default:
        return NextResponse.json(
          { error: "action inválida. Use: preview, confirm, save, regenerate" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[IMAGE] Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
