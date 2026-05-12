export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const templates = await prisma.ctaTemplate.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();

    const template = await prisma.ctaTemplate.create({
      data: {
        name: data.name,
        text: data.text,
        buttonText: data.buttonText,
        formId: data.formId || null,
        linkUrl: data.linkUrl || null,
        whatsappText: data.whatsappText || null,
        category: data.category || 'general',
        icon: data.icon || null,
        color: data.color || '#7C3AED'
      }
    });

    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const template = await prisma.ctaTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        text: data.text,
        buttonText: data.buttonText,
        formId: data.formId || null,
        linkUrl: data.linkUrl || null,
        whatsappText: data.whatsappText || null,
        category: data.category || 'general',
        icon: data.icon || null,
        color: data.color || '#7C3AED'
      }
    });

    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.ctaTemplate.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
