import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Aumentar limite de body para suportar imagens base64 (~10MB)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Cliente S3 para o bucket da M3
function createM3S3Client() {
  return new S3Client({
    region: process.env.M3_AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.M3_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.M3_AWS_SECRET_ACCESS_KEY || ""
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { previewUrl, imageType } = body;
    const isSecondary = imageType === "secondary";

    if (!previewUrl) {
      return NextResponse.json({ error: "URL de preview não fornecida" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Verificar se é URL local (imagem do acervo/fallback)
    if (previewUrl.startsWith('/') && !previewUrl.startsWith('//')) {
      // Para imagens locais, apenas salvar a URL no banco
      const updateData = isSecondary 
        ? { secondaryImage: previewUrl }
        : { featuredImage: previewUrl };
      
      await prisma.blogPost.update({
        where: { id },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        ...(isSecondary ? { secondaryImage: previewUrl } : { featuredImage: previewUrl }),
        isLocal: true,
        message: isSecondary ? "Segunda imagem do acervo confirmada" : "Imagem do acervo confirmada"
      });
    }

    // Para URLs externas ou data URIs, fazer download e upload para S3 da M3
    let imageBuffer: Buffer;
    let contentType = "image/png";

    if (previewUrl.startsWith("data:")) {
      // Imagem base64 (data URI) - decodificar diretamente
      console.log("Decoding base64 image data URI");
      const matches = previewUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "Formato de data URI inválido" }, { status: 400 });
      }
      contentType = matches[1];
      imageBuffer = Buffer.from(matches[2], "base64");
    } else {
      // URL externa - fazer download
      console.log("Downloading image from:", previewUrl.substring(0, 100));
      const imageResponse = await fetch(previewUrl);
      if (!imageResponse.ok) {
        return NextResponse.json({ error: "Não foi possível baixar a imagem. A URL pode ter expirado." }, { status: 400 });
      }
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      contentType = imageResponse.headers.get("content-type") || "image/png";
    }
    
    // Determinar extensão
    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      extension = "jpg";
    } else if (contentType.includes("webp")) {
      extension = "webp";
    }
    
    const prefix = isSecondary ? "secondary" : "post";
    const fileName = prefix + "-" + id + "-" + Date.now() + "." + extension;

    // Upload para S3 da M3
    const s3Client = createM3S3Client();
    const bucketName = process.env.M3_AWS_BUCKET_NAME || "img.m3solutions.com.br";
    const s3Key = "posts/" + id + "/" + fileName;
    
    console.log("Uploading to M3 S3 bucket:", bucketName, "Key:", s3Key);

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: contentType
    }));

    // URL pública via S3 path-style (bucket policy permite leitura pública)
    const permanentUrl = "https://s3.amazonaws.com/" + bucketName + "/" + s3Key;
    console.log("Image uploaded to M3 CDN:", permanentUrl);

    // Atualizar post com URL permanente
    const updateData = isSecondary 
      ? { secondaryImage: permanentUrl }
      : { featuredImage: permanentUrl };
    
    await prisma.blogPost.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      ...(isSecondary ? { secondaryImage: permanentUrl } : { featuredImage: permanentUrl }),
      cdnUrl: permanentUrl
    });
  } catch (error: any) {
    console.error("Error confirming image:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
