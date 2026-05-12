import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PostEditor } from "./post-editor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  // Execução sequencial para evitar "Too many database connections"
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      category: true,
      author: true,
      tags: { include: { tag: true } },
      createdBy: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } }
    }
  });
  
  const categories = await prisma.blogCategory.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const authors = await prisma.blogAuthor.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  const aiUsageLogs = await prisma.aIUsageLog.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" }
  });

  if (!post) {
    notFound();
  }

  // Calcular custos totais
  const aiCosts = {
    textCost: 0,
    imageCost: 0,
    totalCost: 0,
    totalTokens: 0,
    logs: aiUsageLogs
  };

  aiUsageLogs.forEach(log => {
    aiCosts.totalCost += log.cost || 0;
    aiCosts.totalTokens += log.totalTokens || 0;
    if (log.operation === "GENERATE_TEXT") {
      aiCosts.textCost += log.cost || 0;
    } else if (log.operation === "GENERATE_IMAGE") {
      aiCosts.imageCost += log.cost || 0;
    }
  });

  return (
    <PostEditor 
      post={JSON.parse(JSON.stringify(post))} 
      categories={categories} 
      authors={authors}
      aiCosts={JSON.parse(JSON.stringify(aiCosts))}
    />
  );
}
