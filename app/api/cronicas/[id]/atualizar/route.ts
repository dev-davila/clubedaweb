import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH: Atualizar campos da crônica (categoria, publishToSocial, etc)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { categoryId, publishToSocial } = body;

    // Verificar se a crônica existe
    const chronicle = await prisma.chronicle.findUnique({
      where: { id }
    });

    if (!chronicle) {
      return NextResponse.json({ error: "Crônica não encontrada" }, { status: 404 });
    }

    // Montar objeto de atualização
    const updateData: any = {};
    
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId || null;
    }
    
    if (publishToSocial !== undefined) {
      updateData.publishToSocial = publishToSocial;
    }

    // Atualizar crônica
    const updatedChronicle = await prisma.chronicle.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: true,
        article: { include: { site: true } }
      }
    });

    return NextResponse.json(updatedChronicle);
  } catch (error: any) {
    console.error("Error updating chronicle:", error);
    return NextResponse.json({ 
      error: "Erro ao atualizar crônica", 
      details: error.message 
    }, { status: 500 });
  }
}
