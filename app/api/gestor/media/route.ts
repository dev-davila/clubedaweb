export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    
    if (search) {
      where.OR = [
        { alt: { contains: search, mode: "insensitive" } },
        { filename: { contains: search, mode: "insensitive" } }
      ];
    }
    
    if (category) {
      where.category = category;
    }

    // Execução sequencial para evitar "Too many database connections"
    const items = await prisma.mediaLibrary.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        url: true,
        alt: true,
        filename: true,
        mimeType: true,
        width: true,
        height: true,
        generatedByAI: true,
        category: true,
        createdAt: true
      }
    });
    const total = await prisma.mediaLibrary.count({ where });

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Erro ao buscar mídia" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { url, alt, filename, mimeType, width, height, generatedByAI, aiPrompt, aiProvider, category } = body;

    if (!url) {
      return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 });
    }

    const media = await prisma.mediaLibrary.create({
      data: {
        url,
        alt: alt || "",
        filename: filename || url.split("/").pop() || "image",
        mimeType: mimeType || "image/jpeg",
        width: width || null,
        height: height || null,
        generatedByAI: generatedByAI || false,
        aiPrompt: aiPrompt || null,
        aiProvider: aiProvider || null,
        category: category || "general"
      }
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error creating media:", error);
    return NextResponse.json(
      { error: "Erro ao salvar mídia" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.mediaLibrary.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Erro ao excluir mídia" },
      { status: 500 }
    );
  }
}
