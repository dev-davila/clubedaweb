import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Estimated pricing per model (USD)
const MODEL_PRICING: Record<string, { inputPer1K: number; outputPer1K: number; perImage?: number; label: string }> = {
  "claude-sonnet-4-20250514": { inputPer1K: 0.003, outputPer1K: 0.015, label: "Claude Sonnet 4" },
  "claude-3-5-sonnet-20241022": { inputPer1K: 0.003, outputPer1K: 0.015, label: "Claude 3.5 Sonnet" },
  "claude-3-haiku-20240307": { inputPer1K: 0.00025, outputPer1K: 0.00125, label: "Claude 3 Haiku" },
  "dall-e-3": { inputPer1K: 0, outputPer1K: 0, perImage: 0.04, label: "DALL-E 3" },
  "route-llm": { inputPer1K: 0.003, outputPer1K: 0.015, label: "RouteLLM" },
};

function getModelPricing(model: string) {
  return MODEL_PRICING[model] || { inputPer1K: 0.003, outputPer1K: 0.015, label: model };
}

function estimateCost(log: { model: string; promptTokens: number; outputTokens: number; cost: number | null; operation: string }) {
  // If cost is already recorded and > 0, use it
  if (log.cost && log.cost > 0) return log.cost;
  
  const pricing = getModelPricing(log.model);
  
  // For image generation, use per-image cost
  if (log.operation === "GENERATE_IMAGE" && pricing.perImage) {
    return pricing.perImage;
  }
  
  // For text generation, estimate based on tokens if available
  if (log.promptTokens > 0 || log.outputTokens > 0) {
    return (log.promptTokens / 1000) * pricing.inputPer1K + (log.outputTokens / 1000) * pricing.outputPer1K;
  }
  
  // If no tokens recorded, estimate based on typical usage per operation
  if (log.operation === "GENERATE_TEXT" || log.operation === "GENERATE_POST") {
    // Typical article generation: ~2000 input + ~3000 output tokens
    return (2000 / 1000) * pricing.inputPer1K + (3000 / 1000) * pricing.outputPer1K;
  }
  
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "all";
    
    const whereClause: Record<string, unknown> = {};
    if (period !== "all") {
      const periodDays = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      whereClause.createdAt = { gte: startDate };
    }

    // Fetch all usage logs
    const usageLogs = await prisma.aIUsageLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" }
    });

    // Fetch related posts
    const relatedPostIds = [...new Set(usageLogs.filter(l => l.postId).map(l => l.postId!))];
    const posts = relatedPostIds.length > 0 ? await prisma.blogPost.findMany({
      where: { id: { in: relatedPostIds } },
      select: { id: true, title: true, briefTitle: true }
    }) : [];
    const postsMap = new Map(posts.map(p => [p.id, p]));

    // Enrich logs with post data and estimated cost
    const enrichedLogs = usageLogs.map(log => {
      const estimated = estimateCost(log);
      return {
        ...log,
        post: log.postId ? postsMap.get(log.postId) || null : null,
        estimatedCost: estimated,
        hasRealCost: (log.cost ?? 0) > 0
      };
    });

    // Calculate totals
    const totals = {
      totalCost: 0,
      estimatedCost: 0,
      textCost: 0,
      imageCost: 0,
      totalTokens: 0,
      totalPosts: 0,
      totalImages: 0,
      totalOperations: usageLogs.length
    };

    const uniquePostIds = new Set<string>();

    enrichedLogs.forEach(log => {
      totals.totalCost += log.cost || 0;
      totals.estimatedCost += log.estimatedCost;
      totals.totalTokens += log.totalTokens;
      
      if (log.operation === "GENERATE_TEXT" || log.operation === "GENERATE_POST") {
        totals.textCost += log.estimatedCost;
        if (log.postId) uniquePostIds.add(log.postId);
      } else if (log.operation === "GENERATE_IMAGE") {
        totals.imageCost += log.estimatedCost;
        totals.totalImages++;
      }
    });

    totals.totalPosts = uniquePostIds.size;

    // Group by month
    const monthlyMap: Record<string, {
      month: string;
      label: string;
      cost: number;
      estimatedCost: number;
      tokens: number;
      operations: number;
      textOps: number;
      imageOps: number;
      posts: Set<string>;
    }> = {};
    
    enrichedLogs.forEach(log => {
      const monthKey = log.createdAt.toISOString().slice(0, 7);
      const date = new Date(log.createdAt);
      const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          month: monthKey,
          label,
          cost: 0,
          estimatedCost: 0,
          tokens: 0,
          operations: 0,
          textOps: 0,
          imageOps: 0,
          posts: new Set()
        };
      }
      
      monthlyMap[monthKey].cost += log.cost || 0;
      monthlyMap[monthKey].estimatedCost += log.estimatedCost;
      monthlyMap[monthKey].tokens += log.totalTokens;
      monthlyMap[monthKey].operations++;
      
      if (log.operation === "GENERATE_TEXT" || log.operation === "GENERATE_POST") {
        monthlyMap[monthKey].textOps++;
      } else if (log.operation === "GENERATE_IMAGE") {
        monthlyMap[monthKey].imageOps++;
      }
      
      if (log.postId) monthlyMap[monthKey].posts.add(log.postId);
    });

    // Fill in missing months between first and last month
    const monthKeys = Object.keys(monthlyMap).sort();
    if (monthKeys.length >= 2) {
      const [startYear, startMonth] = monthKeys[0].split("-").map(Number);
      const [endYear, endMonth] = monthKeys[monthKeys.length - 1].split("-").map(Number);
      
      let y = startYear;
      let m = startMonth;
      while (y < endYear || (y === endYear && m <= endMonth)) {
        const key = `${y}-${String(m).padStart(2, "0")}`;
        if (!monthlyMap[key]) {
          const d = new Date(y, m - 1, 1);
          const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
          monthlyMap[key] = {
            month: key,
            label,
            cost: 0,
            estimatedCost: 0,
            tokens: 0,
            operations: 0,
            textOps: 0,
            imageOps: 0,
            posts: new Set()
          };
        }
        m++;
        if (m > 12) { m = 1; y++; }
      }
    }

    const monthlyData = Object.values(monthlyMap)
      .map(m => ({ ...m, postsCount: m.posts.size, posts: undefined }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Group by day
    const dailyUsage: Record<string, { date: string; cost: number; estimatedCost: number; tokens: number; operations: number }> = {};
    
    enrichedLogs.forEach(log => {
      const date = log.createdAt.toISOString().split("T")[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = { date, cost: 0, estimatedCost: 0, tokens: 0, operations: 0 };
      }
      dailyUsage[date].cost += log.cost || 0;
      dailyUsage[date].estimatedCost += log.estimatedCost;
      dailyUsage[date].tokens += log.totalTokens;
      dailyUsage[date].operations++;
    });

    const dailyData = Object.values(dailyUsage).sort((a, b) => a.date.localeCompare(b.date));

    // Group by model
    const modelUsageMap: Record<string, { model: string; label: string; cost: number; estimatedCost: number; count: number; tokens: number }> = {};
    
    enrichedLogs.forEach(log => {
      if (!modelUsageMap[log.model]) {
        const pricing = getModelPricing(log.model);
        modelUsageMap[log.model] = { model: log.model, label: pricing.label, cost: 0, estimatedCost: 0, count: 0, tokens: 0 };
      }
      modelUsageMap[log.model].cost += log.cost || 0;
      modelUsageMap[log.model].estimatedCost += log.estimatedCost;
      modelUsageMap[log.model].count++;
      modelUsageMap[log.model].tokens += log.totalTokens;
    });

    // Group by operation
    const operationMap: Record<string, { operation: string; count: number; estimatedCost: number }> = {};
    
    enrichedLogs.forEach(log => {
      if (!operationMap[log.operation]) {
        operationMap[log.operation] = { operation: log.operation, count: 0, estimatedCost: 0 };
      }
      operationMap[log.operation].count++;
      operationMap[log.operation].estimatedCost += log.estimatedCost;
    });

    return NextResponse.json({
      logs: enrichedLogs.slice(0, 100),
      totals,
      monthlyData,
      dailyData,
      modelUsage: Object.values(modelUsageMap),
      operationUsage: Object.values(operationMap),
      period: period === "all" ? "all" : parseInt(period)
    });
  } catch (error) {
    console.error("Error fetching AI usage:", error);
    return NextResponse.json({ error: "Erro ao buscar uso de IA" }, { status: 500 });
  }
}
