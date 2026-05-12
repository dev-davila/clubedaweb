export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// M3 S3 Client
function createM3S3Client() {
  return new S3Client({
    region: process.env.M3_AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.M3_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.M3_AWS_SECRET_ACCESS_KEY || ""
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const authorId = formData.get("authorId") as string;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (!authorId) {
      return NextResponse.json({ error: "ID do autor é obrigatório" }, { status: 400 });
    }

    // Verificar se o autor existe
    const author = await prisma.blogAuthor.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return NextResponse.json({ error: "Autor não encontrado" }, { status: 404 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato de arquivo não permitido. Use JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 2MB" },
        { status: 400 }
      );
    }

    // Gerar nome único
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `authors/${authorId}/avatar-${Date.now()}.${ext}`;

    // Upload para S3
    const s3Client = createM3S3Client();
    const buffer = Buffer.from(await file.arrayBuffer());

    const bucketName = process.env.M3_AWS_BUCKET_NAME || "img.m3solutions.com.br";

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ContentDisposition: "inline"
      })
    );

    // URL pública via S3 path-style (bucket policy permite leitura pública)
    const publicUrl = `https://s3.amazonaws.com/${bucketName}/${fileName}`;

    // Atualizar autor no banco
    await prisma.blogAuthor.update({
      where: { id: authorId },
      data: { avatar: publicUrl }
    });

    return NextResponse.json({
      success: true,
      avatarUrl: publicUrl,
      message: "Avatar atualizado com sucesso"
    });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload do avatar" },
      { status: 500 }
    );
  }
}
