"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  ChevronRight,
  MapPin,
  FolderOpen,
  List,
  LayoutGrid,
  Eye,
  EyeOff,
  Globe,
  DollarSign,
  ChevronDown,
  Tag,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  Minus,
  Image as ImageIcon,
  Share2,
  Ban,
  Send,
  CheckCircle,
  Upload,
  Calendar
} from "lucide-react";
import { BatchImageGenerator } from "./batch-image-generator";

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
  BRIEFING: { label: "Pauta", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  GENERATING: { label: "Gerando...", bgColor: "bg-purple-100", textColor: "text-purple-700" },
  DRAFT: { label: "Rascunho", bgColor: "bg-gray-100", textColor: "text-gray-700" },
  REVIEW: { label: "Em Revisão", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  APPROVED: { label: "Aprovado", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  SCHEDULED: { label: "Agendado", bgColor: "bg-indigo-100", textColor: "text-indigo-700" },
  PUBLISHED: { label: "Publicado", bgColor: "bg-green-100", textColor: "text-green-700" },
  ARCHIVED: { label: "Arquivado", bgColor: "bg-gray-100", textColor: "text-gray-500" }
};

interface Post {
  id: string;
  title: string | null;
  briefTitle: string | null;
  status: string;
  serviceType: string | null;
  geoState: string | null;
  geoCity: string | null;
  aiGenerated: boolean;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  category: { name: string } | null;
  featuredImage: string | null;
}

interface GroupedPosts {
  [serviceType: string]: {
    global: Post[];
    totalCost: number;
    byState: {
      [state: string]: {
        stateLevel: Post[];
        byCity: { [city: string]: Post[] };
      };
    };
  };
}

interface PostsListClientProps {
  posts: Post[];
  groupedPosts: GroupedPosts;
  costByPostId: Record<string, number>;
  viewMode: string;
  statusFilter: string | undefined;
  hideRegional: boolean;
  expandedStates: string[];
  tagCount: number;
  countByStatus: Record<string, number>;
}

export function PostsListClient({
  posts,
  groupedPosts,
  costByPostId,
  viewMode,
  statusFilter,
  hideRegional,
  expandedStates,
  tagCount,
  countByStatus
}: PostsListClientProps) {
  const router = useRouter();
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [sendingToReview, setSendingToReview] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishSchedules, setPublishSchedules] = useState<Record<string, string>>({});

  const allPostIds = posts.map(p => p.id);
  const allSelected = allPostIds.length > 0 && allPostIds.every(id => selectedPosts.has(id));
  const someSelected = selectedPosts.size > 0;

  const togglePost = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(allPostIds));
    }
  };

  // Funções para seleção de região
  const getRegionPostIds = (stateData: { stateLevel: Post[]; byCity: { [city: string]: Post[] } }): string[] => {
    const ids: string[] = [];
    stateData.stateLevel.forEach(p => ids.push(p.id));
    Object.values(stateData.byCity).forEach(cityPosts => {
      cityPosts.forEach(p => ids.push(p.id));
    });
    return ids;
  };

  const isRegionSelected = (stateData: { stateLevel: Post[]; byCity: { [city: string]: Post[] } }): "all" | "some" | "none" => {
    const ids = getRegionPostIds(stateData);
    if (ids.length === 0) return "none";
    const selectedCount = ids.filter(id => selectedPosts.has(id)).length;
    if (selectedCount === ids.length) return "all";
    if (selectedCount > 0) return "some";
    return "none";
  };

  const toggleRegion = (stateData: { stateLevel: Post[]; byCity: { [city: string]: Post[] } }) => {
    const ids = getRegionPostIds(stateData);
    const newSelected = new Set(selectedPosts);
    const allInRegionSelected = ids.every(id => selectedPosts.has(id));
    
    if (allInRegionSelected) {
      // Desmarcar todos da região
      ids.forEach(id => newSelected.delete(id));
    } else {
      // Marcar todos da região
      ids.forEach(id => newSelected.add(id));
    }
    setSelectedPosts(newSelected);
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    let successCount = 0;
    let errorCount = 0;
    const postIds = Array.from(selectedPosts);
    
    try {
      // Processar em lotes de 5 para evitar sobrecarga
      const BATCH_SIZE = 5;
      for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
        const batch = postIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(postId =>
            fetch(`/api/gestor/posts/${postId}`, {
              method: "DELETE",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }).then(async res => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
              }
              return res;
            })
          )
        );
        
        results.forEach(r => {
          if (r.status === "fulfilled") successCount++;
          else errorCount++;
        });
        
        // Pequeno delay entre lotes
        if (i + BATCH_SIZE < postIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setSelectedPosts(new Set());
      setShowDeleteModal(false);
      router.refresh();
      
      if (errorCount > 0) {
        alert(`${successCount} posts excluídos com sucesso. ${errorCount} falharam.`);
      }
    } catch (error) {
      console.error("Erro ao excluir posts:", error);
      alert("Erro ao excluir alguns posts. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkSendToReview = async () => {
    setSendingToReview(true);
    let successCount = 0;
    let errorCount = 0;
    const postIds = Array.from(selectedPosts);
    
    try {
      const BATCH_SIZE = 5;
      for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
        const batch = postIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(postId =>
            fetch(`/api/gestor/posts/${postId}/workflow`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "submit_review" }),
            }).then(async res => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
              }
              return res;
            })
          )
        );
        
        results.forEach(r => {
          if (r.status === "fulfilled") successCount++;
          else errorCount++;
        });
        
        if (i + BATCH_SIZE < postIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setSelectedPosts(new Set());
      setShowReviewModal(false);
      router.refresh();
      
      if (errorCount > 0) {
        alert(`${successCount} posts enviados para revisão. ${errorCount} falharam (podem já estar em revisão ou status incompatível).`);
      }
    } catch (error) {
      console.error("Erro ao enviar posts para revisão:", error);
      alert("Erro ao enviar alguns posts para revisão. Tente novamente.");
    } finally {
      setSendingToReview(false);
    }
  };

  const handleBulkApprove = async () => {
    setApproving(true);
    let successCount = 0;
    let errorCount = 0;
    const postIds = Array.from(selectedPosts);
    
    try {
      const BATCH_SIZE = 5;
      for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
        const batch = postIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(postId =>
            fetch(`/api/gestor/posts/${postId}/workflow`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "approve" }),
            }).then(async res => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
              }
              return res;
            })
          )
        );
        
        results.forEach(r => {
          if (r.status === "fulfilled") successCount++;
          else errorCount++;
        });
        
        if (i + BATCH_SIZE < postIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setSelectedPosts(new Set());
      setShowApproveModal(false);
      router.refresh();
      
      if (errorCount > 0) {
        alert(`${successCount} posts aprovados com sucesso. ${errorCount} falharam (podem não estar em revisão).`);
      }
    } catch (error) {
      console.error("Erro ao aprovar posts:", error);
      alert("Erro ao aprovar alguns posts. Tente novamente.");
    } finally {
      setApproving(false);
    }
  };

  const handleBulkPublish = async () => {
    setPublishing(true);
    let publishedCount = 0;
    let scheduledCount = 0;
    let errorCount = 0;
    const postIds = Array.from(selectedPosts);
    
    try {
      const BATCH_SIZE = 3;
      for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
        const batch = postIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(postId => {
            const scheduleDate = publishSchedules[postId];
            const action = scheduleDate ? "schedule" : "publish";
            const body: any = { action };
            if (scheduleDate) body.scheduledAt = new Date(scheduleDate).toISOString();
            
            return fetch(`/api/gestor/posts/${postId}/workflow`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }).then(async res => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
              }
              return { action };
            });
          })
        );
        
        results.forEach(r => {
          if (r.status === "fulfilled") {
            if (r.value.action === "schedule") scheduledCount++;
            else publishedCount++;
          } else {
            errorCount++;
          }
        });
        
        if (i + BATCH_SIZE < postIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setSelectedPosts(new Set());
      setShowPublishModal(false);
      setPublishSchedules({});
      router.refresh();
      
      const msgs: string[] = [];
      if (publishedCount > 0) msgs.push(`${publishedCount} publicado${publishedCount !== 1 ? "s" : ""}`);
      if (scheduledCount > 0) msgs.push(`${scheduledCount} agendado${scheduledCount !== 1 ? "s" : ""}`);
      if (errorCount > 0) msgs.push(`${errorCount} falha${errorCount !== 1 ? "s" : ""}`);
      if (errorCount > 0 || (publishedCount + scheduledCount) > 0) {
        alert(msgs.join(", ") + ".");
      }
    } catch (error) {
      console.error("Erro ao publicar/agendar posts:", error);
      alert("Erro ao processar alguns posts. Tente novamente.");
    } finally {
      setPublishing(false);
    }
  };

  const toggleStateUrl = (service: string, state: string) => {
    const key = `${service}::${state}`;
    const currentExpanded = new Set(expandedStates);
    if (currentExpanded.has(key)) {
      currentExpanded.delete(key);
    } else {
      currentExpanded.add(key);
    }
    const expandParam = Array.from(currentExpanded).join(",");
    return `/gestor/posts?view=${viewMode}${statusFilter ? `&status=${statusFilter}` : ''}${hideRegional ? '&hideRegional=true' : ''}${expandParam ? `&expand=${encodeURIComponent(expandParam)}` : ''}`;
  };

  const isStateExpanded = (service: string, state: string) => {
    return expandedStates.includes(`${service}::${state}`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-500 mt-1">Gerencie seus posts e pautas</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/gestor/tags"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            <Tag size={16} />
            Tags ({tagCount})
          </Link>
          <Link
            href="/gestor/posts/nova-pauta"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
          >
            <Plus size={18} />
            Nova Pauta
          </Link>
        </div>
      </div>

      {/* View Toggle + Status Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
          <Link
            href={`/gestor/posts?view=grouped${statusFilter ? `&status=${statusFilter}` : ''}${hideRegional ? '&hideRegional=true' : ''}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === "grouped" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutGrid size={14} />
            Agrupado
          </Link>
          <Link
            href={`/gestor/posts?view=list${statusFilter ? `&status=${statusFilter}` : ''}${hideRegional ? '&hideRegional=true' : ''}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List size={14} />
            Lista
          </Link>
        </div>

        {/* Toggle Regional Posts */}
        {viewMode === "grouped" && (
          <Link
            href={`/gestor/posts?view=${viewMode}${statusFilter ? `&status=${statusFilter}` : ''}${hideRegional ? '' : '&hideRegional=true'}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition mr-2 ${
              hideRegional
                ? "bg-orange-100 text-orange-700 border border-orange-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={hideRegional ? "Mostrar páginas regionais" : "Ocultar páginas regionais"}
          >
            {hideRegional ? <EyeOff size={14} /> : <Eye size={14} />}
            <MapPin size={12} />
            {hideRegional ? "Regionais ocultas" : "Ocultar regionais"}
          </Link>
        )}

        <Link
          href={`/gestor/posts?view=${viewMode}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !statusFilter ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:bg-gray-50"
          }`}
        >
          Todos ({posts.length})
        </Link>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = countByStatus[status] || 0;
          if (count === 0) return null;
          return (
            <Link
              key={status}
              href={`/gestor/posts?view=${viewMode}&status=${status}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === status
                  ? `${config.bgColor} ${config.textColor}`
                  : "bg-white text-gray-600 border hover:bg-gray-50"
              }`}
            >
              {config.label} ({count})
            </Link>
          );
        })}
      </div>

      {/* Bulk Actions Bar */}
      {posts.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
          >
            {allSelected ? (
              <CheckSquare size={18} className="text-blue-600" />
            ) : (
              <Square size={18} className="text-gray-400" />
            )}
            {allSelected ? "Desmarcar todos" : "Selecionar todos"}
          </button>

          {someSelected && (
            <>
              <span className="text-sm text-gray-500">
                {selectedPosts.size} selecionado{selectedPosts.size !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition"
              >
                <Send size={14} />
                Enviar para revisão
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
              >
                <CheckCircle size={14} />
                Aprovar
              </button>
              <button
                onClick={() => setShowPublishModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition"
              >
                <Upload size={14} />
                Publicar
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
              >
                <Trash2 size={14} />
                Excluir selecionados
              </button>
            </>
          )}
        </div>
      )}

      {/* Geração de Imagens em Background */}
      <div className="mb-4">
        <BatchImageGenerator
          serviceTypes={Object.keys(groupedPosts)}
          posts={posts.map(p => ({ id: p.id, serviceType: p.serviceType, featuredImage: p.featuredImage }))}
          onComplete={() => router.refresh()}
        />
      </div>

      {/* Posts Content */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum post encontrado</h3>
          <p className="text-gray-500 mb-4">Comece criando sua primeira pauta com IA</p>
          <Link
            href="/gestor/posts/nova-pauta"
            className="inline-flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Criar Pauta
          </Link>
        </div>
      ) : viewMode === "grouped" ? (
        /* Grouped View */
        <div className="space-y-4">
          {Object.entries(groupedPosts).map(([serviceType, serviceData]) => {
            const regionalCount = Object.values(serviceData.byState).reduce(
              (sum, state) =>
                sum +
                state.stateLevel.length +
                Object.values(state.byCity).reduce((citySum, cityPosts) => citySum + cityPosts.length, 0),
              0
            );
            const globalCount = serviceData.global.length;
            const totalPosts = hideRegional ? globalCount : globalCount + regionalCount;
            const statesCount = Object.keys(serviceData.byState).length;

            if (totalPosts === 0) return null;

            return (
              <div key={serviceType} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Service Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderOpen size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">{serviceType}</h2>
                        <p className="text-sm text-gray-500">
                          {totalPosts} post{totalPosts !== 1 ? "s" : ""}
                          {hideRegional && regionalCount > 0 && (
                            <span className="text-orange-500 ml-1">(+{regionalCount} regionais ocultos)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {serviceData.totalCost > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                          <DollarSign size={12} />
                          R$ {serviceData.totalCost.toFixed(2)}
                        </span>
                      )}
                      {globalCount > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                          <Globe size={12} />
                          {globalCount} global
                        </span>
                      )}
                      {!hideRegional && statesCount > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                          <MapPin size={12} />
                          {statesCount} estado{statesCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {/* Global Posts */}
                  {serviceData.global.map((post) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      indent={0}
                      isGlobal
                      selected={selectedPosts.has(post.id)}
                      onToggle={() => togglePost(post.id)}
                    />
                  ))}

                  {/* Posts by State */}
                  {!hideRegional &&
                    Object.entries(serviceData.byState)
                      .sort()
                      .map(([state, stateData]) => {
                        const statePosts =
                          stateData.stateLevel.length +
                          Object.values(stateData.byCity).reduce((sum, posts) => sum + posts.length, 0);
                        const citiesCount = Object.keys(stateData.byCity).length;
                        const expanded = isStateExpanded(serviceType, state);

                        const regionSelection = isRegionSelected(stateData);
                        
                        // Coletar todos os posts da região para exibição compacta
                        const allRegionPosts: { post: Post; location: string }[] = [];
                        stateData.stateLevel.forEach(p => allRegionPosts.push({ post: p, location: state }));
                        Object.entries(stateData.byCity).sort().forEach(([city, cityPosts]) => {
                          cityPosts.forEach(p => allRegionPosts.push({ post: p, location: `${city}` }));
                        });
                        
                        return (
                          <div key={state}>
                            <div className="px-3 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition group">
                              {/* Checkbox da Região */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleRegion(stateData);
                                }}
                                className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition mr-2"
                                title={`Selecionar todos os ${statePosts} posts de ${state}`}
                              >
                                {regionSelection === "all" ? (
                                  <CheckSquare size={18} className="text-blue-600" />
                                ) : regionSelection === "some" ? (
                                  <div className="w-[18px] h-[18px] border-2 border-blue-600 rounded flex items-center justify-center bg-blue-100">
                                    <Minus size={12} className="text-blue-600" />
                                  </div>
                                ) : (
                                  <Square size={18} className="text-gray-300 group-hover:text-gray-400" />
                                )}
                              </button>
                              
                              {/* Link para expandir/recolher */}
                              <Link
                                href={toggleStateUrl(serviceType, state)}
                                className="flex-1 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  {expanded ? (
                                    <ChevronDown size={14} className="text-blue-500" />
                                  ) : (
                                    <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500" />
                                  )}
                                  <MapPin size={14} className="text-gray-400" />
                                  <span className="text-sm font-medium text-gray-600">{state}</span>
                                  <span className="text-xs text-gray-400">
                                    ({statePosts} post{statePosts !== 1 ? "s" : ""})
                                  </span>
                                  {citiesCount > 0 && (
                                    <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                      {citiesCount} cidade{citiesCount !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  {expanded ? "Clique para recolher" : "Clique para expandir"}
                                </span>
                              </Link>
                            </div>

                            {/* Lista compacta quando colapsado - permite seleção individual */}
                            {!expanded && (
                              <div className="pl-10 pr-5 py-2 bg-gray-50/50 border-t border-gray-100">
                                <div className="flex flex-wrap gap-2">
                                  {allRegionPosts.map(({ post, location }) => (
                                    <button
                                      key={post.id}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        togglePost(post.id);
                                      }}
                                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition ${
                                        selectedPosts.has(post.id)
                                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                      }`}
                                      title={`${post.title || post.briefTitle || "Sem título"} - ${location}`}
                                    >
                                      {selectedPosts.has(post.id) ? (
                                        <CheckSquare size={12} className="text-blue-600" />
                                      ) : (
                                        <Square size={12} className="text-gray-400" />
                                      )}
                                      <span className="max-w-[150px] truncate">
                                        {location}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Detalhes expandidos */}
                            {expanded && (
                              <>
                                {stateData.stateLevel.map((post) => (
                                  <PostRow
                                    key={post.id}
                                    post={post}
                                    indent={1}
                                    location={state}
                                    selected={selectedPosts.has(post.id)}
                                    onToggle={() => togglePost(post.id)}
                                  />
                                ))}
                                {Object.entries(stateData.byCity)
                                  .sort()
                                  .map(([city, cityPosts]) => (
                                    <div key={city}>
                                      {cityPosts.map((post) => (
                                        <PostRow
                                          key={post.id}
                                          post={post}
                                          indent={2}
                                          location={`${city} - ${state}`}
                                          selected={selectedPosts.has(post.id)}
                                          onToggle={() => togglePost(post.id)}
                                        />
                                      ))}
                                    </div>
                                  ))}
                              </>
                            )}
                          </div>
                        );
                      })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y">
          {posts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              indent={0}
              showService
              selected={selectedPosts.has(post.id)}
              onToggle={() => togglePost(post.id)}
            />
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão em Lote */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Excluir {selectedPosts.size} Posts</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Tem certeza que deseja excluir {selectedPosts.size} post{selectedPosts.size !== 1 ? "s" : ""}?
                </p>
                <p className="text-red-600 text-xs">⚠️ Esta ação não pode ser desfeita.</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReviewModal(false)}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Send className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enviar {selectedPosts.size} Posts para Revisão</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Tem certeza que deseja enviar {selectedPosts.size} post{selectedPosts.size !== 1 ? "s" : ""} para revisão?
                </p>
                <p className="text-orange-600 text-xs">📝 Posts que não estejam em Rascunho ou Pauta podem falhar.</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={sendingToReview}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkSendToReview}
                disabled={sendingToReview}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingToReview ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar para revisão
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowApproveModal(false)}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aprovar {selectedPosts.size} Posts</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Tem certeza que deseja aprovar {selectedPosts.size} post{selectedPosts.size !== 1 ? "s" : ""}?
                </p>
                <p className="text-green-600 text-xs">✅ Apenas posts em Revisão ou Rascunho serão aprovados.</p>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={approving}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkApprove}
                disabled={approving}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {approving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Aprovando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Aprovar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPublishModal && (() => {
        const selectedPostsList = posts.filter(p => selectedPosts.has(p.id));
        const scheduledTotal = selectedPostsList.filter(p => publishSchedules[p.id]).length;
        const immediateTotal = selectedPostsList.length - scheduledTotal;
        
        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => { if (!publishing) { setShowPublishModal(false); setPublishSchedules({}); } }}
          >
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Publicar / Agendar {selectedPosts.size} Posts</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Defina uma data para agendar ou deixe em branco para publicar imediatamente.
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowPublishModal(false); setPublishSchedules({}); }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Post List */}
              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3">
                {selectedPostsList.map(post => (
                  <div key={post.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {post.title || post.briefTitle || "Sem título"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {post.geoState && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin size={10} />
                            {post.geoCity ? `${post.geoCity}, ${post.geoState}` : post.geoState}
                          </span>
                        )}
                        {!post.geoState && !post.geoCity && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Globe size={10} />
                            Nacional
                          </span>
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded ${statusConfig[post.status]?.bgColor || "bg-gray-100"} ${statusConfig[post.status]?.textColor || "text-gray-600"}`}>
                          {statusConfig[post.status]?.label || post.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="relative">
                        <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="datetime-local"
                          value={publishSchedules[post.id] || ""}
                          onChange={(e) => {
                            setPublishSchedules(prev => {
                              const next = { ...prev };
                              if (e.target.value) {
                                next[post.id] = e.target.value;
                              } else {
                                delete next[post.id];
                              }
                              return next;
                            });
                          }}
                          className="pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-[200px]"
                          min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                        />
                      </div>
                      {publishSchedules[post.id] ? (
                        <span className="text-xs text-indigo-600 font-medium whitespace-nowrap flex items-center gap-1">
                          <Calendar size={12} />
                          Agendar
                        </span>
                      ) : (
                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap flex items-center gap-1">
                          <Upload size={12} />
                          Imediato
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {immediateTotal > 0 && (
                      <span className="flex items-center gap-1">
                        <Upload size={12} className="text-blue-500" />
                        {immediateTotal} publicação imediata{immediateTotal !== 1 ? "s" : ""}
                      </span>
                    )}
                    {scheduledTotal > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-indigo-500" />
                        {scheduledTotal} agendamento{scheduledTotal !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowPublishModal(false); setPublishSchedules({}); }}
                    disabled={publishing}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleBulkPublish}
                    disabled={publishing}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {publishing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function PostRow({
  post,
  indent = 0,
  location,
  showService,
  isGlobal,
  selected,
  onToggle
}: {
  post: Post;
  indent?: number;
  location?: string;
  showService?: boolean;
  isGlobal?: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const status = statusConfig[post.status] || { label: post.status, bgColor: "bg-gray-100", textColor: "text-gray-700" };
  const paddingLeft = indent === 0 ? "pl-3" : indent === 1 ? "pl-8" : "pl-12";

  return (
    <div className={`${paddingLeft} pr-5 py-3.5 hover:bg-blue-50/50 transition group flex items-center gap-3`}>
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition"
      >
        {selected ? (
          <CheckSquare size={18} className="text-blue-600" />
        ) : (
          <Square size={18} className="text-gray-300 group-hover:text-gray-400" />
        )}
      </button>

      {/* Post Link */}
      <Link href={`/gestor/posts/${post.id}/editar`} className="flex-1 min-w-0 flex items-center gap-3">
        {indent > 0 && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
        
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative hidden sm:block">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title || "Imagem do post"}
              fill
              className="object-cover"
              sizes="48px"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={18} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition">
              {post.title || post.briefTitle || "Sem título"}
            </h3>
            {post.aiGenerated && (
              <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                <Sparkles size={10} />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {showService && post.serviceType && (
              <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{post.serviceType}</span>
            )}
            {isGlobal && (
              <span className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium">
                <Globe size={10} />
                Nacional
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1 text-gray-400">
                <MapPin size={10} />
                {location}
              </span>
            )}
            {post.category && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{post.category.name}</span>}
            <span className="text-gray-400">{new Date(post.publishedAt || post.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </Link>

      {/* Social Media Indicator */}
      <div className="flex items-center gap-1.5 flex-shrink-0 hidden sm:flex">
        {!post.geoState && !post.geoCity ? (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full" title="Publicação em redes sociais ativa">
            <Share2 size={11} />
            <span className="hidden lg:inline">Redes</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full" title="Sem publicação em redes sociais">
            <Ban size={11} />
            <span className="hidden lg:inline">Sem redes</span>
          </span>
        )}
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {post.status === "SCHEDULED" && post.scheduledAt && (
          <span className="text-xs text-indigo-600 hidden sm:inline">
            {new Date(post.scheduledAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short"
            })}
          </span>
        )}
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
          {status.label}
        </span>
      </div>
    </div>
  );
}
