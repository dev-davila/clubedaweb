import { prisma } from "@/lib/db";
import { PostsListClient } from "@/components/gestor/posts-list-client";

// Tipos de status (para evitar import issues com Prisma)
type PostStatus = "BRIEFING" | "GENERATING" | "DRAFT" | "REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
const POST_STATUS_VALUES: PostStatus[] = ["BRIEFING", "GENERATING", "DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

export const dynamic = "force-dynamic";

// Tipo para posts agrupados
interface GroupedPosts {
  [serviceType: string]: {
    global: any[];
    totalCost: number;
    byState: {
      [state: string]: {
        stateLevel: any[];
        byCity: { [city: string]: any[] };
      };
    };
  };
}

function groupPostsByService(posts: any[], costByPostId: Record<string, number>): GroupedPosts {
  const grouped: GroupedPosts = {};
  
  posts.forEach(post => {
    const service = post.serviceType || "Outros";
    
    if (!grouped[service]) {
      grouped[service] = { global: [], byState: {}, totalCost: 0 };
    }
    
    // Somar custo do post
    grouped[service].totalCost += costByPostId[post.id] || 0;
    
    // Posts globais (sem localização)
    if (!post.geoState && !post.geoCity) {
      grouped[service].global.push(post);
    } else if (post.geoState) {
      const state = post.geoState;
      
      if (!grouped[service].byState[state]) {
        grouped[service].byState[state] = { stateLevel: [], byCity: {} };
      }
      
      if (post.geoCity) {
        const city = post.geoCity;
        if (!grouped[service].byState[state].byCity[city]) {
          grouped[service].byState[state].byCity[city] = [];
        }
        grouped[service].byState[state].byCity[city].push(post);
      } else {
        grouped[service].byState[state].stateLevel.push(post);
      }
    }
  });
  
  return grouped;
}

export default async function PostsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string; view?: string; hideRegional?: string; expand?: string }>
}) {
  const params = await searchParams;
  const statusFilter = params.status as PostStatus | undefined;
  const categoryFilter = params.category;
  const searchQuery = params.search;
  const viewMode = params.view || "grouped"; // "grouped" ou "list"
  const hideRegional = params.hideRegional === "true"; // ocultar posts regionais
  const expandedStates = (params.expand || "").split(",").filter(Boolean); // estados expandidos

  const where: any = {};
  if (statusFilter && POST_STATUS_VALUES.includes(statusFilter as PostStatus)) {
    where.status = statusFilter;
  }
  if (categoryFilter) {
    where.categoryId = categoryFilter;
  }
  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { briefTitle: { contains: searchQuery, mode: "insensitive" } },
      { serviceType: { contains: searchQuery, mode: "insensitive" } }
    ];
  }

  // Execute queries sequentially to avoid too many connections
  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { category: true, author: true }
  });
  
  const categories = await prisma.blogCategory.findMany({ 
    where: { active: true }, 
    orderBy: { name: "asc" } 
  });
  
  const statusCounts = await prisma.blogPost.groupBy({
    by: ["status"],
    _count: true
  });
  
  const aiCosts = await prisma.aIUsageLog.groupBy({
    by: ["postId"],
    _sum: { cost: true }
  });
  
  const tagCount = await prisma.blogTag.count();

  const countByStatus = statusCounts.reduce((acc, s) => {
    acc[s.status] = s._count;
    return acc;
  }, {} as Record<string, number>);

  // Mapear custos por postId
  const costByPostId: Record<string, number> = {};
  aiCosts.forEach(item => {
    if (item.postId) {
      costByPostId[item.postId] = item._sum.cost || 0;
    }
  });

  const groupedPosts = groupPostsByService(posts, costByPostId);
  
  // Serializar posts para passar ao componente client
  const serializedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    briefTitle: post.briefTitle,
    status: post.status,
    serviceType: post.serviceType,
    geoState: post.geoState,
    geoCity: post.geoCity,
    aiGenerated: post.aiGenerated,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    category: post.category ? { name: post.category.name } : null,
    featuredImage: post.featuredImage
  }));

  // Serializar groupedPosts
  const serializedGroupedPosts: any = {};
  for (const [serviceType, serviceData] of Object.entries(groupedPosts)) {
    serializedGroupedPosts[serviceType] = {
      global: serviceData.global.map(p => ({
        id: p.id,
        title: p.title,
        briefTitle: p.briefTitle,
        status: p.status,
        serviceType: p.serviceType,
        geoState: p.geoState,
        geoCity: p.geoCity,
        aiGenerated: p.aiGenerated,
        scheduledAt: p.scheduledAt,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        category: p.category ? { name: p.category.name } : null,
        featuredImage: p.featuredImage
      })),
      totalCost: serviceData.totalCost,
      byState: {} as any
    };
    
    for (const [state, stateData] of Object.entries(serviceData.byState)) {
      serializedGroupedPosts[serviceType].byState[state] = {
        stateLevel: stateData.stateLevel.map(p => ({
          id: p.id,
          title: p.title,
          briefTitle: p.briefTitle,
          status: p.status,
          serviceType: p.serviceType,
          geoState: p.geoState,
          geoCity: p.geoCity,
          aiGenerated: p.aiGenerated,
          scheduledAt: p.scheduledAt,
          publishedAt: p.publishedAt,
          createdAt: p.createdAt,
          category: p.category ? { name: p.category.name } : null,
          featuredImage: p.featuredImage
        })),
        byCity: {} as any
      };
      
      for (const [city, cityPosts] of Object.entries(stateData.byCity)) {
        serializedGroupedPosts[serviceType].byState[state].byCity[city] = cityPosts.map(p => ({
          id: p.id,
          title: p.title,
          briefTitle: p.briefTitle,
          status: p.status,
          serviceType: p.serviceType,
          geoState: p.geoState,
          geoCity: p.geoCity,
          aiGenerated: p.aiGenerated,
          scheduledAt: p.scheduledAt,
          publishedAt: p.publishedAt,
          createdAt: p.createdAt,
          category: p.category ? { name: p.category.name } : null,
          featuredImage: p.featuredImage
        }));
      }
    }
  }

  return (
    <PostsListClient
      posts={serializedPosts}
      groupedPosts={serializedGroupedPosts}
      costByPostId={costByPostId}
      viewMode={viewMode}
      statusFilter={statusFilter}
      hideRegional={hideRegional}
      expandedStates={expandedStates}
      tagCount={tagCount}
      countByStatus={countByStatus}
    />
  );
}