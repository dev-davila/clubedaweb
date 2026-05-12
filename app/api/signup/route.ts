import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Senha deve ter mínimo 8 caracteres, pelo menos 1 letra e 1 número
function validatePassword(password: string): string | null {
  if (password.length < 8) return "Senha deve ter no mínimo 8 caracteres";
  if (!/[a-zA-Z]/.test(password)) return "Senha deve conter pelo menos 1 letra";
  if (!/[0-9]/.test(password)) return "Senha deve conter pelo menos 1 número";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Exigir autenticação de admin para criar novas contas
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Apenas administradores podem criar contas" },
        { status: 403 }
      );
    }

    const { email, password, name, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar força da senha
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { success: false, message: passwordError },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Role é limitado a valores válidos, default "editor" (não admin)
    const validRoles = ["admin", "editor", "viewer"];
    const userRole = validRoles.includes(role) ? role : "editor";

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name ?? email?.split("@")?.[0],
        role: userRole
      }
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error("[SIGNUP] Error:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno ao criar usuário" },
      { status: 500 }
    );
  }
}
