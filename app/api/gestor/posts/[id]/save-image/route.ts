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
    const { imageUrl, imageType } = body;
    const isSecondary = imageType === "secondary";

    if (!imageUrl) {
      return NextResponse.json({ error: "URL da imagem não fornecida" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, featuredImage: true, secondaryImage: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }

    // Se a URL é relativa (local), significa que já é uma imagem local
    if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
      console.log("Local image detected, updating database:", imageUrl);
      const updateData = isSecondary 
        ? { secondaryImage: imageUrl }
        : { featuredImage: imageUrl };
      
      await prisma.blogPost.update({
        where: { id },
        data: updateData
      });
      
      return NextResponse.json({
        success: true,
        localPath: imageUrl,
        ...(isSecondary ? { secondaryImage: imageUrl } : { featuredImage: imageUrl }),
        message: isSecondary ? "Segunda imagem local confirmada" : "Imagem local confirmada"
      });
    }

    let imageBuffer: Buffer;
    let contentType = "image/png";

    if (imageUrl.startsWith("data:")) {
      // Imagem base64 (data URI) - decodificar diretamente
      console.log("Decoding base64 image data URI");
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "Formato de data URI inválido" }, { status: 400 });
      }
      contentType = matches[1];
      imageBuffer = Buffer.from(matches[2], "base64");
    } else {
      // Construir URL absoluta se necessário
      let fetchUrl = imageUrl;
      if (imageUrl.startsWith('//')) {
        fetchUrl = "https:" + imageUrl;
      }

      // Fazer download da imagem
      console.log("Downloading image from:", fetchUrl.substring(0, 100));
      const imageResponse = await fetch(fetchUrl);
      
      if (!imageResponse.ok) {
        throw new Error("Erro ao baixar imagem: " + imageResponse.status);
      }

      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      contentType = imageResponse.headers.get("content-type") || "image/png";
    }
    
    // Determinar extensão e content-type
    let extension = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      extension = "jpg";
    } else if (contentType.includes("webp")) {
      extension = "webp";
    }

    // Upload para S3 da M3
    const s3Client = createM3S3Client();
    const bucketName = process.env.M3_AWS_BUCKET_NAME || "img.m3solutions.com.br";
    
    const prefix = isSecondary ? "secondary" : "featured";
    const filename = prefix + "-" + Date.now() + "." + extension;
    const s3Key = "posts/" + id + "/" + filename;
    
    console.log("Uploading to M3 S3 bucket:", bucketName, "Key:", s3Key);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: contentType
    }));

    // URL pública via S3 path-style (bucket policy permite leitura pública)
    const publicUrl = "https://s3.amazonaws.com/" + bucketName + "/" + s3Key;
    console.log("Image uploaded to M3 CDN:", publicUrl);

    // Atualizar post com URL da imagem no cloud
    const updateData = isSecondary 
      ? { secondaryImage: publicUrl }
      : { featuredImage: publicUrl };
    
    await prisma.blogPost.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      localPath: publicUrl,
      ...(isSecondary ? { secondaryImage: publicUrl } : { featuredImage: publicUrl }),
      message: isSecondary ? "Segunda imagem salva com sucesso" : "Imagem salva com sucesso no CDN M3"
    });
  } catch (error: any) {
    console.error("Error saving image:", error);
    return NextResponse.json({ error: "Erro ao salvar imagem" }, { status: 500 });
  }
}
