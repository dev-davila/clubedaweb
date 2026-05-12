import { prisma } from "@/lib/db";
import Link from "next/link";
import { Newspaper, Globe, Users, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CronicasDashboard() {
  // Fetch stats
  const [sitesCount, recipientsCount, pendingArticles, pendingChronicles, publishedChronicles, recentArticles] = await Promise.all([
    prisma.monitoredSite.count({ where: { active: true } }),
    prisma.chronicleRecipient.count({ where: { active: true } }),
    prisma.collectedArticle.count({ where: { status: "pending" } }),
    prisma.chronicle.count({ where: { status: "pending_review" } }),
    prisma.chronicle.count({ where: { status: "published" } }),
    prisma.collectedArticle.findMany({
      where: { status: "pending" },
      orderBy: { collectedAt: "desc" },
      take: 5,
      include: { site: { select: { name: true } } }
    })
  ]);

  const stats = [
    { label: "Sites Monitorados", value: sitesCount, icon: Globe, color: "blue", href: "/gestor/cronicas/sites" },
    { label: "Destinatários", value: recipientsCount, icon: Users, color: "green", href: "/gestor/cronicas/destinatarios" },
    { label: "Matérias Pendentes", value: pendingArticles, icon: Clock, color: "yellow", href: "/gestor/cronicas/materias" },
    { label: "Crônicas em Revisão", value: pendingChronicles, icon: AlertCircle, color: "orange", href: "/gestor/cronicas/pendentes" },
    { label: "Crônicas Publicadas", value: publishedChronicles, icon: CheckCircle, color: "emerald", href: "/gestor/cronicas/historico" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo de Crônicas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitoramento de notícias e geração automatizada de crônicas
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/gestor/cronicas/sites/novo"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            Novo Site
          </Link>
          <Link
            href="/gestor/cronicas/destinatarios/novo"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={18} />
            Novo Destinatário
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition group`}
          >
            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center mb-3`}>
              <stat.icon className={`text-${stat.color}-600`} size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Matérias Recentes</h2>
            <Link href="/gestor/cronicas/materias" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          {recentArticles.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Nenhuma matéria coletada ainda</p>
          ) : (
            <div className="space-y-3">
              {recentArticles.map((article) => (
                <div key={article.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Newspaper className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                    <p className="text-xs text-gray-500">{article.site.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Guide */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Como Funciona</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-medium text-purple-900">Cadastre os sites</p>
                <p className="text-xs text-purple-700">Adicione os sites de notícias que deseja monitorar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-medium text-purple-900">O sistema coleta matérias</p>
                <p className="text-xs text-purple-700">A cada 3 horas, novas matérias são coletadas automaticamente</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-medium text-purple-900">Receba notificações por email</p>
                <p className="text-xs text-purple-700">Selecione as matérias direto pelo email recebido</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <p className="text-sm font-medium text-purple-900">IA gera as crônicas</p>
                <p className="text-xs text-purple-700">Textos de 100-200 palavras com referência à fonte</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">5</div>
              <div>
                <p className="text-sm font-medium text-purple-900">Revise e publique</p>
                <p className="text-xs text-purple-700">Edite se necessário e aprove para publicação</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
