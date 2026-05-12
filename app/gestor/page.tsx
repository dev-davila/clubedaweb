import { prisma } from "@/lib/db";
import { FileText, Calendar, Clock, CheckCircle, AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, { label: string; color: string }> = {
  BRIEFING: { label: "Pauta", color: "yellow" },
  GENERATING: { label: "Gerando", color: "purple" },
  DRAFT: { label: "Rascunho", color: "gray" },
  REVIEW: { label: "Revisão", color: "orange" },
  APPROVED: { label: "Aprovado", color: "blue" },
  SCHEDULED: { label: "Agendado", color: "indigo" },
  PUBLISHED: { label: "Publicado", color: "green" },
  ARCHIVED: { label: "Arquivado", color: "gray" }
};

export default async function GestorDashboardPage() {
  // Fetch all blog posts with includes for stats calculation (single query)
  const allPosts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, author: true }
  });

  // Calculate stats from fetched data
  const totalPosts = allPosts.length;
  const published = allPosts.filter(p => p.status === "PUBLISHED").length;
  const scheduled = allPosts.filter(p => p.status === "SCHEDULED").length;
  const inReview = allPosts.filter(p => p.status === "REVIEW").length;
  const drafts = allPosts.filter(p => p.status === "DRAFT").length;
  const aiGenerated = allPosts.filter(p => p.aiGenerated).length;

  // Get subsets from already fetched data
  const recentPosts = allPosts.slice(0, 5);
  const scheduledPosts = allPosts
    .filter(p => p.status === "SCHEDULED" && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5);
  const pendingReview = allPosts
    .filter(p => p.status === "REVIEW")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Fetch remaining data sequentially to avoid connection issues
  const aiUsage = await prisma.aIUsageLog.aggregate({
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { totalTokens: true },
    _count: true
  });
  
  const newMessages = await prisma.contactMessage.count({ where: { read: false } });

  const statCards = [
    { label: "Total de Posts", value: totalPosts, icon: FileText, color: "blue", href: "/gestor/posts" },
    { label: "Publicados", value: published, icon: CheckCircle, color: "green", href: "/gestor/posts?status=PUBLISHED" },
    { label: "Agendados", value: scheduled, icon: Calendar, color: "indigo", href: "/gestor/posts?status=SCHEDULED" },
    { label: "Em Revisão", value: inReview, icon: AlertCircle, color: "orange", href: "/gestor/posts?status=REVIEW" }
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do seu conteúdo</p>
        </div>
        <Link
          href="/gestor/posts/nova-pauta"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
        >
          <Sparkles size={18} />
          Nova Pauta com IA
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.color === "blue" ? "bg-blue-100" :
                    stat.color === "green" ? "bg-green-100" :
                    stat.color === "indigo" ? "bg-indigo-100" : "bg-orange-100"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      stat.color === "blue" ? "text-blue-600" :
                      stat.color === "green" ? "text-green-600" :
                      stat.color === "indigo" ? "text-indigo-600" : "text-orange-600"
                    }`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* AI Stats */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6" />
            <span className="font-medium">Posts com IA</span>
          </div>
          <div className="text-3xl font-bold">{aiGenerated}</div>
          <div className="text-purple-100 text-sm">gerados este mês</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6" />
            <span className="font-medium">Tokens Usados</span>
          </div>
          <div className="text-3xl font-bold">{(aiUsage._sum.totalTokens || 0).toLocaleString("pt-BR")}</div>
          <div className="text-indigo-100 text-sm">em {aiUsage._count || 0} gerações</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6" />
            <span className="font-medium">Rascunhos</span>
          </div>
          <div className="text-3xl font-bold">{drafts}</div>
          <div className="text-blue-100 text-sm">aguardando edição</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Últimos Posts</h2>
            <Link href="/gestor/posts" className="text-blue-600 text-sm font-medium hover:underline">
              Ver todos
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum post ainda</p>
              <Link href="/gestor/posts/nova-pauta" className="text-blue-600 text-sm mt-2 inline-block">
                Criar primeira pauta
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentPosts.map((post) => {
                const status = statusLabels[post.status] || { label: post.status, color: "gray" };
                return (
                  <Link key={post.id} href={`/gestor/posts/${post.id}/editar`}>
                    <div className="px-5 py-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{post.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {post.category && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {post.category.name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status.color === "green" ? "bg-green-100 text-green-700" :
                          status.color === "yellow" ? "bg-yellow-100 text-yellow-700" :
                          status.color === "orange" ? "bg-orange-100 text-orange-700" :
                          status.color === "purple" ? "bg-purple-100 text-purple-700" :
                          status.color === "blue" ? "bg-blue-100 text-blue-700" :
                          status.color === "indigo" ? "bg-indigo-100 text-indigo-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Scheduled & Pending Review */}
        <div className="space-y-6">
          {/* Scheduled Posts */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Próximas Publicações
              </h2>
              <Link href="/gestor/calendario" className="text-blue-600 text-sm font-medium hover:underline">
                Ver calendário
              </Link>
            </div>
            {scheduledPosts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Nenhum post agendado
              </div>
            ) : (
              <div className="divide-y">
                {scheduledPosts.map((post) => (
                  <Link key={post.id} href={`/gestor/posts/${post.id}/editar`}>
                    <div className="px-5 py-3 hover:bg-gray-50 transition flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">{post.title}</span>
                      <span className="text-xs text-indigo-600 font-medium">
                        {post.scheduledAt && new Date(post.scheduledAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Review */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Aguardando Revisão
              </h2>
            </div>
            {pendingReview.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Nenhum post em revisão
              </div>
            ) : (
              <div className="divide-y">
                {pendingReview.map((post) => (
                  <Link key={post.id} href={`/gestor/posts/${post.id}/editar`}>
                    <div className="px-5 py-3 hover:bg-gray-50 transition flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">{post.title}</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Revisar
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* New Messages Alert */}
          {newMessages > 0 && (
            <Link href="/gestor/mensagens">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 hover:bg-orange-100 transition">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">{newMessages}</span>
                </div>
                <div>
                  <div className="font-medium text-orange-800">Novas mensagens</div>
                  <div className="text-sm text-orange-600">Clique para visualizar</div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
