"use client";

import { useState } from "react";
import { SITE_BASE_URL } from "@/lib/constants";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Loader2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
  Archive,
  RotateCcw,
  Clock,
  ExternalLink,
  Image,
  Video,
  Link as LinkIcon,
  Copy,
  DollarSign,
  FileText,
  ImageIcon,
  Play,
  Clapperboard,
  X,
  Linkedin,
  AlertCircle,
  Share2
} from "lucide-react";
import { SocialMediaPreview } from "@/components/gestor/social-media-preview";
import { DeletePostButton } from "@/components/gestor/delete-post-button";

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

interface AICosts {
  textCost: number;
  imageCost: number;
  totalCost: number;
  totalTokens: number;
  logs: any[];
}

interface PostEditorProps {
  post: any;
  categories: any[];
  authors: any[];
  aiCosts?: AICosts;
}

export function PostEditor({ post, categories, authors, aiCosts }: PostEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingSecondaryImage, setGeneratingSecondaryImage] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const [form, setForm] = useState({
    title: post.title || "",
    content: post.content || "",
    excerpt: post.excerpt || "",
    metaTitle: post.metaTitle || "",
    metaDescription: post.metaDescription || "",
    categoryId: post.categoryId || "",
    authorId: post.authorId || "",
    featuredImage: post.featuredImage || "",
    secondaryImage: post.secondaryImage || "",
    videoUrl: post.videoUrl || ""
  });

  // Estado para preview de imagem gerada por IA
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [secondaryImagePreview, setSecondaryImagePreview] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [savingSecondaryImage, setSavingSecondaryImage] = useState(false);

  // Estado para geração de vídeo
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [contentView, setContentView] = useState<"edit" | "split" | "preview">("edit");
  const [videoService, setVideoService] = useState<'heygen' | 'd-id'>('heygen');
  const [videoAvatars, setVideoAvatars] = useState<any[]>([]);
  const [videoVoices, setVideoVoices] = useState<any[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [videoScript, setVideoScript] = useState<string>('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Estado para LinkedIn
  const [linkedinPreview, setLinkedinPreview] = useState<{
    text: string;
    characterCount: number;
    maxCharacters: number;
    linkedinConnected: boolean;
    linkedinTokenValid: boolean;
  } | null>(null);
  const [loadingLinkedinPreview, setLoadingLinkedinPreview] = useState(false);
  const [publishingLinkedin, setPublishingLinkedin] = useState(false);
  const [linkedinCustomText, setLinkedinCustomText] = useState("");
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinPublished, setLinkedinPublished] = useState(false);
  const [linkedinPostUrl, setLinkedinPostUrl] = useState<string | null>(null);

  // URL do post publicado
  const postPublicUrl = `${SITE_BASE_URL}/noticias/${post.slug}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  // LinkedIn Functions
  const loadLinkedinPreview = async () => {
    setLoadingLinkedinPreview(true);
    try {
      const res = await fetch(`/api/social/linkedin/publish?blogPostId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setLinkedinPreview(data.preview);
        setLinkedinCustomText(data.preview.text);
      }
    } catch (error) {
      console.error("Erro ao carregar preview:", error);
    } finally {
      setLoadingLinkedinPreview(false);
    }
  };

  const handleOpenLinkedinModal = async () => {
    setShowLinkedinModal(true);
    await loadLinkedinPreview();
  };

  const publishToLinkedin = async () => {
    setPublishingLinkedin(true);
    try {
      const res = await fetch("/api/social/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogPostId: post.id,
          customText: linkedinCustomText !== linkedinPreview?.text ? linkedinCustomText : undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setLinkedinPublished(true);
        setLinkedinPostUrl(data.publication?.postUrl);
        setShowLinkedinModal(false);
      } else {
        alert(data.error || "Erro ao publicar no LinkedIn");
      }
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Erro ao publicar no LinkedIn");
    } finally {
      setPublishingLinkedin(false);
    }
  };

  const status = statusConfig[post.status] || { label: post.status, bgColor: "bg-gray-100", textColor: "text-gray-700" };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/gestor/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const text = await res.text();
      
      if (!res.ok) {
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao salvar");
        } catch {
          throw new Error(text || `Erro ${res.status}`);
        }
      }

      router.refresh();
    } catch (error: any) {
      console.error("Save error:", error);
      alert(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Isso irá substituir o conteúdo atual. Deseja continuar?")) return;

    setGenerating(true);
    try {
      const res = await fetch(`/api/gestor/posts/${post.id}/generate`, {
        method: "POST"
      });

      const text = await res.text();
      
      if (!res.ok) {
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao regenerar");
        } catch {
          throw new Error(text || `Erro ${res.status}`);
        }
      }

      router.refresh();
    } catch (error: any) {
      console.error("Regenerate error:", error);
      alert(error.message || "Erro ao regenerar");
    } finally {
      setGenerating(false);
    }
  };

  const handleWorkflow = async (action: string, data?: any) => {
    setWorkflowLoading(action);
    try {
      const res = await fetch(`/api/gestor/posts/${post.id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data })
      });

      // Tentar ler resposta como texto primeiro
      const text = await res.text();
      
      if (!res.ok) {
        // Tentar parsear como JSON, se falhar usar texto
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro na ação");
        } catch {
          throw new Error(text || `Erro ${res.status}: ${res.statusText}`);
        }
      }

      // Verificar se houve auto-publicação nas redes sociais
      if (action === "publish") {
        try {
          const result = JSON.parse(text);
          if (result.socialPublish?.linkedin?.success) {
            setLinkedinPublished(true);
            setLinkedinPostUrl(result.socialPublish.linkedin.postUrl || null);
          }
          if (result.socialPublish?.twitter?.success) {
            // Twitter também foi publicado automaticamente
            console.log("Twitter publicado:", result.socialPublish.twitter.postUrl);
          }
        } catch {
          // Ignorar se não conseguir parsear
        }
      }

      router.refresh();
    } catch (error: any) {
      console.error("Workflow error:", error);
      alert(error.message || "Erro na ação. Tente novamente.");
    } finally {
      setWorkflowLoading(null);
      setShowScheduleModal(false);
    }
  };

  // Gera preview da imagem (não salva ainda)
  const handleRegenerateImage = async (useFallback = false) => {
    setGeneratingImage(true);
    setImagePreview(null);
    try {
      const res = await fetch(`/api/gestor/posts/${post.id}/regenerate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewOnly: true, useFallback })
      });

      const text = await res.text();
      
      if (!res.ok) {
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao gerar imagem");
        } catch {
          throw new Error(text || `Erro ${res.status}`);
        }
      }

      const data = JSON.parse(text);
      // Mostra preview temporário para aprovação
      setImagePreview(data.previewUrl);
    } catch (error: any) {
      console.error("Image generation error:", error);
      alert(error.message || "Erro ao gerar imagem");
    } finally {
      setGeneratingImage(false);
    }
  };

  // Aprova e salva a imagem localmente no servidor
  const handleApproveImage = async () => {
    if (!imagePreview) return;
    
    setSavingImage(true);
    try {
      // Para imagens locais (do acervo), usar confirm-image
      // Para imagens externas, usar save-image
      const endpoint = imagePreview.startsWith('/') 
        ? `/api/gestor/posts/${post.id}/confirm-image`
        : `/api/gestor/posts/${post.id}/save-image`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          previewUrl: imagePreview,
          imageUrl: imagePreview 
        })
      });

      const text = await res.text();
      
      if (!res.ok) {
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao salvar imagem");
        } catch {
          throw new Error(text || `Erro ${res.status}`);
        }
      }

      const data = JSON.parse(text);
      setForm({ ...form, featuredImage: data.featuredImage || data.localPath || imagePreview });
      setImagePreview(null);
      router.refresh();
    } catch (error: any) {
      console.error("Image save error:", error);
      alert(error.message || "Erro ao salvar imagem");
    } finally {
      setSavingImage(false);
    }
  };

  // Rejeita o preview e permite gerar nova
  const handleRejectImage = () => {
    setImagePreview(null);
  };

  // Gera preview da segunda imagem
  const handleRegenerateSecondaryImage = async () => {
    setGeneratingSecondaryImage(true);
    setSecondaryImagePreview(null);
    try {
      const res = await fetch(`/api/gestor/posts/${post.id}/regenerate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewOnly: true, imageType: "secondary" })
      });

      const text = await res.text();
      
      if (!res.ok) {
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao gerar imagem");
        } catch {
          throw new Error(text || `Erro ${res.status}`);
        }
      }

      const data = JSON.parse(text);
      setSecondaryImagePreview(data.previewUrl);
    } catch (error: any) {
      console.error("Secondary image generation error:", error);
      alert(error.message || "Erro ao gerar segunda imagem");
    } finally {
      setGeneratingSecondaryImage(false);
    }
  };

  // Aprova e salva a segunda imagem
  const handleApproveSecondaryImage = async () => {
    if (!secondaryImagePreview) return;
    
    setSavingSecondaryImage(true);
    try {
      const endpoint = secondaryImagePreview.startsWith('/') 
        ? `/api/gestor/posts/${post.id}/confirm-image`
        : `/api/gestor/posts/${post.id}/save-image`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          previewUrl: secondaryImagePreview,
          imageUrl: secondaryImagePreview,
          imageType: "secondary"
        })
      });

      const text = await res.text();
      
      if (!res.ok) {
        try {
          const error = JSON.parse(text);
          throw new Error(error.error || "Erro ao salvar imagem");
        } catch {
          throw new Error(text || `Erro ${res.status}`);
        }
      }

      const data = JSON.parse(text);
      setForm({ ...form, secondaryImage: data.secondaryImage || data.localPath || secondaryImagePreview });
      setSecondaryImagePreview(null);
      router.refresh();
    } catch (error: any) {
      console.error("Secondary image save error:", error);
      alert(error.message || "Erro ao salvar segunda imagem");
    } finally {
      setSavingSecondaryImage(false);
    }
  };

  const handleRejectSecondaryImage = () => {
    setSecondaryImagePreview(null);
  };

  // Funções para geração de vídeo
  const loadVideoAvatars = async (service: 'heygen' | 'd-id') => {
    setLoadingAvatars(true);
    setVideoAvatars([]);
    setVideoVoices([]);
    setSelectedAvatar('');
    setSelectedVoice('');
    try {
      const res = await fetch(`/api/gestor/video/avatars?service=${service}`);
      if (!res.ok) throw new Error('Erro ao carregar avatares');
      const data = await res.json();
      setVideoAvatars(data.avatars || []);
      setVideoVoices(data.voices || []);
    } catch (error: any) {
      console.error('Erro ao carregar avatares:', error);
      alert(error.message || 'Erro ao carregar avatares');
    } finally {
      setLoadingAvatars(false);
    }
  };

  const openVideoModal = () => {
    setShowVideoModal(true);
    // Gerar script baseado no conteúdo do post
    const scriptBase = form.excerpt || form.title || '';
    setVideoScript(scriptBase);
    loadVideoAvatars(videoService);
  };

  const handleServiceChange = (service: 'heygen' | 'd-id') => {
    setVideoService(service);
    loadVideoAvatars(service);
  };

  const handleGenerateVideo = async () => {
    if (!selectedVoice || !videoScript) {
      alert('Selecione uma voz e insira o script');
      return;
    }

    setGeneratingVideo(true);
    setVideoStatus('Iniciando geração...');
    setGeneratedVideoUrl(null);

    try {
      const res = await fetch('/api/gestor/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: videoService,
          avatarId: selectedAvatar,
          voiceId: selectedVoice,
          script: videoScript,
          postId: post.id,
          title: form.title
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao gerar vídeo');
      }

      const data = await res.json();
      setVideoJobId(data.videoId);
      setVideoStatus('Processando vídeo...');

      // Polling para verificar status
      pollVideoStatus(data.videoId, videoService);
    } catch (error: any) {
      console.error('Erro ao gerar vídeo:', error);
      alert(error.message || 'Erro ao gerar vídeo');
      setGeneratingVideo(false);
      setVideoStatus('');
    }
  };

  const pollVideoStatus = async (videoId: string, service: string) => {
    const maxAttempts = 60; // 5 minutos (5s * 60)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/gestor/video/status?service=${service}&videoId=${videoId}`);
        if (!res.ok) throw new Error('Erro ao verificar status');
        
        const data = await res.json();
        
        if (data.isComplete) {
          setVideoStatus('Vídeo gerado com sucesso!');
          setGeneratedVideoUrl(data.videoUrl);
          setGeneratingVideo(false);
          // Atualizar o form com a URL do vídeo
          setForm({ ...form, videoUrl: data.videoUrl });
          return;
        }

        if (data.isFailed) {
          setVideoStatus(`Erro: ${data.error || 'Falha na geração'}`);
          setGeneratingVideo(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setVideoStatus(`Processando... (${Math.round(attempts * 5 / 60)} min)`);
          setTimeout(checkStatus, 5000);
        } else {
          setVideoStatus('Timeout - verifique manualmente');
          setGeneratingVideo(false);
        }
      } catch (error: any) {
        console.error('Erro no polling:', error);
        setVideoStatus('Erro ao verificar status');
        setGeneratingVideo(false);
      }
    };

    checkStatus();
  };

  const renderWorkflowActions = () => {
    switch (post.status) {
      case "BRIEFING":
        return (
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? "Gerando..." : "Gerar com IA"}
          </button>
        );

      case "DRAFT":
        return (
          <>
            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-purple-100 text-purple-700 py-2 px-4 rounded-lg font-medium hover:bg-purple-200 transition disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              Regenerar
            </button>
            <button
              onClick={() => handleWorkflow("submit_review")}
              disabled={workflowLoading === "submit_review"}
              className="flex items-center gap-2 bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
            >
              {workflowLoading === "submit_review" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Enviar para Revisão
            </button>
          </>
        );

      case "REVIEW":
        return (
          <>
            <button
              onClick={() => handleWorkflow("reject")}
              disabled={workflowLoading === "reject"}
              className="flex items-center gap-2 bg-red-100 text-red-700 py-2 px-4 rounded-lg font-medium hover:bg-red-200 transition disabled:opacity-50"
            >
              {workflowLoading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Rejeitar
            </button>
            <button
              onClick={() => handleWorkflow("approve")}
              disabled={workflowLoading === "approve"}
              className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {workflowLoading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Aprovar
            </button>
          </>
        );

      case "APPROVED":
        return (
          <>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              <Calendar size={16} />
              Agendar
            </button>
            <button
              onClick={() => handleWorkflow("publish")}
              disabled={workflowLoading === "publish"}
              className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {workflowLoading === "publish" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Publicar Agora
            </button>
          </>
        );

      case "SCHEDULED":
        return (
          <>
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg">
              <Clock size={16} />
              <span className="text-sm font-medium">
                Agendado para {post.scheduledAt && new Date(post.scheduledAt).toLocaleString("pt-BR")}
              </span>
            </div>
            <button
              onClick={() => handleWorkflow("publish")}
              disabled={workflowLoading === "publish"}
              className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              Publicar Agora
            </button>
          </>
        );

      case "PUBLISHED":
        return (
          <>
            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-purple-100 text-purple-700 py-2 px-4 rounded-lg font-medium hover:bg-purple-200 transition disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              Regerar Texto
            </button>
            <Link
              href={`/noticias/${post.slug}`}
              target="_blank"
              className="flex items-center gap-2 bg-green-100 text-green-700 py-2 px-4 rounded-lg font-medium hover:bg-green-200 transition"
            >
              <ExternalLink size={16} />
              Ver no Site
            </Link>
            <button
              onClick={() => handleWorkflow("archive")}
              disabled={workflowLoading === "archive"}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              <Archive size={16} />
              Arquivar
            </button>
          </>
        );

      case "ARCHIVED":
        return (
          <button
            onClick={() => handleWorkflow("unarchive")}
            disabled={workflowLoading === "unarchive"}
            className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RotateCcw size={16} />
            Restaurar
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/gestor/posts" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
                {form.title || "Sem título"}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                {status.label}
              </span>
              {post.aiGenerated && (
                <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  <Sparkles size={10} />
                  Gerado com IA
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Criado em {new Date(post.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {renderWorkflowActions()}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-lg font-medium"
              placeholder="Título do post"
            />
          </div>

          {/* Content with Markdown Preview */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Conteúdo (Markdown)</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {form.content.trim().split(/\s+/).filter(Boolean).length} palavras
                </span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button type="button" onClick={() => setContentView("edit")}
                    className={`px-3 py-1 text-xs rounded-md transition ${contentView === "edit" ? "bg-white shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}>
                    Editar
                  </button>
                  <button type="button" onClick={() => setContentView("split")}
                    className={`px-3 py-1 text-xs rounded-md transition ${contentView === "split" ? "bg-white shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}>
                    Split
                  </button>
                  <button type="button" onClick={() => setContentView("preview")}
                    className={`px-3 py-1 text-xs rounded-md transition ${contentView === "preview" ? "bg-white shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}>
                    Preview
                  </button>
                </div>
              </div>
            </div>
            {/* Toolbar */}
            {contentView !== "preview" && (
              <div className="flex gap-1 mb-2 p-1 bg-gray-50 rounded-lg border border-gray-200">
                {[
                  { label: "B", md: "**", title: "Negrito" },
                  { label: "I", md: "*", title: "Itálico" },
                  { label: "H2", md: "## ", title: "Título", prefix: true },
                  { label: "H3", md: "### ", title: "Subtítulo", prefix: true },
                  { label: "•", md: "- ", title: "Lista", prefix: true },
                  { label: "🔗", md: "[texto](url)", title: "Link", raw: true },
                ].map((btn) => (
                  <button key={btn.label} type="button" title={btn.title}
                    className="px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition"
                    onClick={() => {
                      const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
                      if (!textarea) return;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const selected = form.content.substring(start, end);
                      let newText: string;
                      if (btn.raw) {
                        newText = form.content.substring(0, start) + btn.md + form.content.substring(end);
                      } else if (btn.prefix) {
                        newText = form.content.substring(0, start) + btn.md + selected + form.content.substring(end);
                      } else {
                        newText = form.content.substring(0, start) + btn.md + selected + btn.md + form.content.substring(end);
                      }
                      handleChange({ target: { name: "content", value: newText } } as any);
                    }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
            <div className={`${contentView === "split" ? "grid grid-cols-2 gap-4" : ""}`}>
              {contentView !== "preview" && (
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={20}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono text-sm"
                  placeholder="Conteúdo do post em Markdown..."
                />
              )}
              {contentView !== "edit" && (
                <div className={`prose prose-sm max-w-none overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50 ${contentView === "preview" ? "min-h-[480px]" : "max-h-[480px]"}`}
                  dangerouslySetInnerHTML={{ __html: (() => {
                    try {
                      const { marked } = require("marked");
                      return marked.parse(form.content || "") as string;
                    } catch { return form.content || ""; }
                  })() }}
                />
              )}
            </div>
          </div>

          {/* SEO with Checklist */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Meta Title{" "}
                  <span className={`text-xs ${form.metaTitle.length === 0 ? "text-gray-400" : form.metaTitle.length <= 60 ? "text-green-600" : "text-red-500"}`}>
                    ({form.metaTitle.length}/60)
                  </span>
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={form.metaTitle}
                  onChange={handleChange}
                  maxLength={70}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Meta Description{" "}
                  <span className={`text-xs ${form.metaDescription.length === 0 ? "text-gray-400" : form.metaDescription.length <= 160 ? "text-green-600" : "text-red-500"}`}>
                    ({form.metaDescription.length}/160)
                  </span>
                </label>
                <textarea
                  name="metaDescription"
                  value={form.metaDescription}
                  onChange={handleChange}
                  maxLength={200}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resumo/Excerpt</label>
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Item 14: SEO Checklist & Google Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Checklist SEO</h4>
                <div className="space-y-1.5">
                  {[
                    { ok: form.metaTitle.length > 0 && form.metaTitle.length <= 60, label: "Meta Title preenchido (≤60 chars)" },
                    { ok: form.metaDescription.length > 0 && form.metaDescription.length <= 160, label: "Meta Description preenchida (≤160 chars)" },
                    { ok: (form.excerpt || "").length > 0, label: "Excerpt/Resumo preenchido" },
                    { ok: (post.keywords || "").length > 0, label: "Palavras-chave definidas" },
                    { ok: form.content.length > 500, label: "Conteúdo com mais de 500 caracteres" },
                    { ok: form.content.includes("##") || form.content.includes("###"), label: "Headings (H2/H3) no conteúdo" },
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${check.ok ? "bg-green-500" : "bg-gray-300"}`}>
                        {check.ok ? "✓" : "–"}
                      </span>
                      <span className={check.ok ? "text-green-700" : "text-gray-500"}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Snippet Preview */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Preview no Google</p>
                <div>
                  <p className="text-blue-700 text-base font-medium leading-tight truncate">
                    {form.metaTitle || form.title || "Título da página"}
                  </p>
                  <p className="text-green-700 text-xs mt-0.5">m3solutions.com.br › noticias</p>
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {form.metaDescription || form.excerpt || "Descrição da página aparecerá aqui..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mídia */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-gray-500" />
              Mídia
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    Imagem Destacada
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerateImage(false)}
                      disabled={generatingImage || savingImage}
                      className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition disabled:opacity-50"
                    >
                      {generatingImage ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          Gerar com IA
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRegenerateImage(true)}
                      disabled={generatingImage || savingImage}
                      className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      <ImageIcon size={12} />
                      Banco de Imagens
                    </button>
                  </div>
                </div>

                {/* Preview de imagem gerada por IA (aguardando aprovação) */}
                {imagePreview && (
                  <div className="mb-4 border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Preview da Imagem Gerada</span>
                    </div>
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={imagePreview} 
                        alt="Preview da imagem gerada por IA" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApproveImage}
                        disabled={savingImage}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {savingImage ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Aprovar e Salvar
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleRejectImage}
                        disabled={savingImage}
                        className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Rejeitar
                      </button>
                    </div>
                    <p className="text-xs text-purple-600 mt-2 text-center">
                      Clique em &quot;Aprovar e Salvar&quot; para baixar a imagem para o servidor
                    </p>
                  </div>
                )}

                {/* Campo de URL manual */}
                <input
                  type="url"
                  name="featuredImage"
                  value={form.featuredImage}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="https://upload.wikimedia.org/wikipedia/commons/7/74/Social_media_collection_2020s.png ou /uploads/posts/..."
                />
                <p className="text-xs text-gray-400 mt-1">Cole uma URL externa ou use &quot;Gerar com IA&quot; para criar uma imagem</p>
                
                {/* Preview da imagem atual salva */}
                {form.featuredImage && !imagePreview && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-gray-500" />
                      <span className="text-xs text-gray-500">Imagem Atual:</span>
                      {(form.featuredImage.includes('s3.') || form.featuredImage.includes('amazonaws.com')) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Salva na nuvem</span>
                      )}
                    </div>
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={form.featuredImage} 
                        alt="Imagem destacada atual" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.error-msg')) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'error-msg flex items-center justify-center h-full text-gray-400 text-sm';
                            errorDiv.textContent = 'Imagem não encontrada';
                            parent.appendChild(errorDiv);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Segunda Imagem (opcional)
                  </label>
                  <button
                    onClick={handleRegenerateSecondaryImage}
                    disabled={generatingSecondaryImage || savingSecondaryImage}
                    className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-medium hover:bg-purple-200 transition disabled:opacity-50"
                  >
                    {generatingSecondaryImage ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        Gerar com IA
                      </>
                    )}
                  </button>
                </div>

                {/* Preview de segunda imagem gerada por IA (aguardando aprovação) */}
                {secondaryImagePreview && (
                  <div className="mb-4 border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Preview da Segunda Imagem</span>
                    </div>
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={secondaryImagePreview} 
                        alt="Preview da segunda imagem gerada por IA" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApproveSecondaryImage}
                        disabled={savingSecondaryImage}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {savingSecondaryImage ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            Aprovar e Salvar
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleRejectSecondaryImage}
                        disabled={savingSecondaryImage}
                        className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Rejeitar
                      </button>
                    </div>
                    <p className="text-xs text-purple-600 mt-2 text-center">
                      Clique em &quot;Aprovar e Salvar&quot; para usar esta imagem
                    </p>
                  </div>
                )}

                <input
                  type="url"
                  name="secondaryImage"
                  value={form.secondaryImage}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="https://lh7-us.googleusercontent.com/-zy6zqdqdNp97VfuYN1TXhuo7BKvk4OLjfE1pwYgDhxsTPz-SRLHVAFv8VaqclCnLRxRrCv9UZqbcx_0wRmhEJAhHNvY64HtOwX6i7ITAlMtSGn0e3zXokC6mdtEBOjj_kZIHTlCTRIZNPvnXMnv9ks ou /images/..."
                />
                <p className="text-xs text-gray-400 mt-1">Imagem exibida no meio do conteúdo do post</p>
                
                {/* Preview da segunda imagem atual */}
                {form.secondaryImage && !secondaryImagePreview && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-gray-500" />
                      <span className="text-xs text-gray-500">Imagem Atual:</span>
                      {(form.secondaryImage.includes('s3.') || form.secondaryImage.includes('amazonaws.com')) && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Salva na nuvem</span>
                      )}
                    </div>
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={form.secondaryImage} 
                        alt="Segunda imagem" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.error-msg')) {
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'error-msg flex items-center justify-center h-full text-gray-400 text-sm';
                            errorDiv.textContent = 'Imagem não encontrada';
                            parent.appendChild(errorDiv);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Seção de vídeo oculta temporariamente */}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          {/* Save Button */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            
            {/* Delete Button */}
            <div className="pt-3 border-t border-gray-100">
              <DeletePostButton postId={post.id} postTitle={post.title} size="md" />
            </div>
          </div>

          {/* Category & Author */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Autor</label>
              <select
                name="authorId"
                value={form.authorId}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Selecione...</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>{author.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* URL do Post */}
          {(post.status === "PUBLISHED" || post.status === "SCHEDULED") && (
            <div className="bg-green-50 rounded-xl border border-green-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-800">URL do Post</h4>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={postPublicUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-lg text-green-700 text-xs"
                  />
                  <button
                    onClick={() => copyToClipboard(postPublicUrl)}
                    className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition"
                    title="Copiar URL"
                  >
                    {urlCopied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                </div>
                {urlCopied && (
                  <p className="text-xs text-green-600 mt-1">URL copiada!</p>
                )}
              </div>
            </div>
          )}

          {/* Redes Sociais - Preview e Publicação (apenas para posts globais/nacionais) */}
          {(!post.seoLevel || post.seoLevel === "GLOBAL") && !post.geoState && !post.geoCity ? (
            <SocialMediaPreview 
              postId={post.id} 
              postStatus={post.status}
              onPublish={(results) => {
                // Atualizar estados locais se necessário
                if (results.linkedin?.success) {
                  setLinkedinPublished(true);
                  setLinkedinPostUrl(results.linkedin.url || null);
                }
              }}
            />
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <svg xmlns="https://static.vecteezy.com/system/resources/thumbnails/071/792/468/small_2x/information-symbol-a-capital-i-in-circle-simple-black-and-white-info-icon-the-letter-i-inside-a-round-shape-vector.jpg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span className="text-sm">Publicação em redes sociais disponível apenas no post global/nacional.</span>
              </div>
            </div>
          )}

          {/* Briefing Info */}
          {post.briefTitle && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Briefing Original</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>Título:</strong> {post.briefTitle}</p>
                {post.briefPersona && <p><strong>Persona:</strong> {post.briefPersona}</p>}
                {post.briefCta && <p><strong>CTA:</strong> {post.briefCta}</p>}
                {post.briefKeywords?.length > 0 && (
                  <p><strong>Keywords:</strong> {post.briefKeywords.join(", ")}</p>
                )}
              </div>
            </div>
          )}

          {/* AI Info */}
          {post.aiGenerated && (
            <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h4 className="font-medium text-purple-800">Gerado com IA</h4>
              </div>
              <div className="text-sm text-purple-700 space-y-1">
                <p><strong>Modelo:</strong> {post.aiModel}</p>
                {post.aiGeneratedAt && (
                  <p><strong>Data:</strong> {new Date(post.aiGeneratedAt).toLocaleString("pt-BR")}</p>
                )}
              </div>
              
              {/* AI Costs */}
              {aiCosts && aiCosts.totalCost > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-800 text-sm">Custo da Geração</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {aiCosts.textCost > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-purple-600">
                          <FileText size={12} />
                          Texto
                        </span>
                        <span className="font-mono">${aiCosts.textCost.toFixed(4)}</span>
                      </div>
                    )}
                    {aiCosts.imageCost > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-purple-600">
                          <ImageIcon size={12} />
                          Imagem
                        </span>
                        <span className="font-mono">${aiCosts.imageCost.toFixed(4)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-purple-200 font-medium">
                      <span className="text-purple-700">Total</span>
                      <span className="font-mono text-sm text-purple-900">${aiCosts.totalCost.toFixed(4)}</span>
                    </div>
                    {aiCosts.totalTokens > 0 && (
                      <p className="text-purple-500 text-[10px]">
                        {aiCosts.totalTokens.toLocaleString()} tokens utilizados
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendar Publicação</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Data e Hora
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleWorkflow("schedule", { scheduledAt: scheduleDate })}
                disabled={!scheduleDate || workflowLoading === "schedule"}
                className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {workflowLoading === "schedule" ? "Agendando..." : "Agendar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Generation Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Clapperboard className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gerar Vídeo com IA</h3>
                  <p className="text-sm text-gray-500">Crie um vídeo com avatar virtual</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Service Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Serviço</label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleServiceChange('heygen')}
                  className={`flex-1 p-4 rounded-xl border-2 transition ${
                    videoService === 'heygen' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">HeyGen</div>
                  <div className="text-xs text-gray-500 mt-1">10 créditos/mês grátis (com watermark)</div>
                </button>
                <button
                  onClick={() => handleServiceChange('d-id')}
                  className={`flex-1 p-4 rounded-xl border-2 transition ${
                    videoService === 'd-id' 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">D-ID</div>
                  <div className="text-xs text-gray-500 mt-1">14 dias trial (sem watermark)</div>
                </button>
              </div>
            </div>

            {loadingAvatars ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-3 text-gray-600">Carregando avatares e vozes...</span>
              </div>
            ) : (
              <>
                {/* Avatar Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar {videoService === 'd-id' && '(opcional - usa padrão se não selecionado)'}
                  </label>
                  <div className="grid grid-cols-4 gap-3 max-h-40 overflow-y-auto p-1">
                    {videoAvatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`relative rounded-lg overflow-hidden border-2 transition ${
                          selectedAvatar === avatar.id 
                            ? 'border-indigo-500 ring-2 ring-indigo-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {avatar.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={avatar.thumbnail} 
                            alt={avatar.name}
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate">
                          {avatar.name}
                        </div>
                      </button>
                    ))}
                  </div>
                  {videoAvatars.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum avatar disponível</p>
                  )}
                </div>

                {/* Voice Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voz *</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    <option value="">Selecione uma voz...</option>
                    {videoVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} ({voice.language}) - {voice.gender}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Script */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Script do Vídeo * <span className="text-gray-400 text-xs">({videoScript.length} caracteres)</span>
                  </label>
                  <textarea
                    value={videoScript}
                    onChange={(e) => setVideoScript(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                    placeholder="Digite o texto que o avatar irá falar..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Recomendado: até 500 caracteres para vídeos curtos (30-60s)
                  </p>
                </div>

                {/* Status */}
                {videoStatus && (
                  <div className={`mb-6 p-4 rounded-xl ${
                    videoStatus.includes('sucesso') 
                      ? 'bg-green-50 text-green-700' 
                      : videoStatus.includes('Erro') 
                        ? 'bg-red-50 text-red-700'
                        : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      {generatingVideo && <Loader2 className="w-4 h-4 animate-spin" />}
                      {videoStatus.includes('sucesso') && <CheckCircle className="w-4 h-4" />}
                      {videoStatus.includes('Erro') && <XCircle className="w-4 h-4" />}
                      <span className="text-sm font-medium">{videoStatus}</span>
                    </div>
                  </div>
                )}

                {/* Generated Video Preview */}
                {generatedVideoUrl && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Play className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Vídeo Gerado</span>
                    </div>
                    <video 
                      src={generatedVideoUrl} 
                      controls 
                      className="w-full rounded-lg"
                      style={{ maxHeight: '300px' }}
                    >
                      <source src={generatedVideoUrl} type="video/mp4" />
                    </video>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowVideoModal(false)}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                {generatedVideoUrl ? 'Fechar' : 'Cancelar'}
              </button>
              {!generatedVideoUrl && (
                <button
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo || !selectedVoice || !videoScript}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingVideo ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Clapperboard size={18} />
                      Gerar Vídeo
                    </>
                  )}
                </button>
              )}
              {generatedVideoUrl && (
                <button
                  onClick={() => {
                    handleSave();
                    setShowVideoModal(false);
                  }}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Salvar e Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Modal */}
      {showLinkedinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0A66C2]/10 rounded-lg">
                  <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Publicar no LinkedIn</h3>
                  <p className="text-sm text-gray-500">Revise o conteúdo antes de publicar</p>
                </div>
              </div>
              <button
                onClick={() => setShowLinkedinModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {loadingLinkedinPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#0A66C2] animate-spin" />
              </div>
            ) : linkedinPreview ? (
              <>
                {/* Connection Status */}
                {!linkedinPreview.linkedinConnected && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">LinkedIn não conectado</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      Configure sua conta em{" "}
                      <Link href="/gestor/redes-sociais" className="underline">
                        Redes Sociais
                      </Link>
                    </p>
                  </div>
                )}

                {linkedinPreview.linkedinConnected && !linkedinPreview.linkedinTokenValid && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Token expirado</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Reconecte sua conta em{" "}
                      <Link href="/gestor/redes-sociais" className="underline">
                        Redes Sociais
                      </Link>
                    </p>
                  </div>
                )}

                {/* Content Editor */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Conteúdo da Publicação</label>
                    <span className={`text-xs ${linkedinCustomText.length > 3000 ? 'text-red-500' : 'text-gray-400'}`}>
                      {linkedinCustomText.length}/{linkedinPreview.maxCharacters}
                    </span>
                  </div>
                  <textarea
                    value={linkedinCustomText}
                    onChange={(e) => setLinkedinCustomText(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition resize-none font-mono text-sm"
                  />
                </div>

                {/* Post Preview Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>Post: <strong>{form.title}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <LinkIcon className="w-4 h-4" />
                    <span className="truncate">{postPublicUrl}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLinkedinModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={publishToLinkedin}
                    disabled={publishingLinkedin || !linkedinPreview.linkedinConnected || !linkedinPreview.linkedinTokenValid}
                    className="flex-1 py-3 px-4 bg-[#0A66C2] text-white rounded-xl font-medium hover:bg-[#084e96] transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {publishingLinkedin ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Publicar
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Erro ao carregar preview</p>
                <button
                  onClick={loadLinkedinPreview}
                  className="mt-2 text-[#0A66C2] hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}