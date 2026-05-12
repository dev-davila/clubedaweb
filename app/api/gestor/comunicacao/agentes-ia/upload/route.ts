export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { uploadToM3S3, getM3ImageUrl } from "@/lib/m3-s3-config";

// POST – Upload training file directly to M3Solutions S3
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo é obrigatório" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 50MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `ai-training/${timestamp}-${safeName}`;

    const url = await uploadToM3S3(buffer, key, file.type || "application/octet-stream");

    return NextResponse.json({
      url,
      cloud_storage_path: key,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("[AI Upload] Error uploading to M3 S3:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload do arquivo" },
      { status: 500 }
    );
  }
}
