"use client";

import { useState, useEffect } from "react";
import { UserCircle, Plus, Pencil, Trash2, Loader2, Tag, FolderOpen, X, Check, Sparkles, Target, Users, FileText, AlertCircle, ChevronDown, ChevronUp, Video, Clapperboard, Play, ImagePlus, RefreshCw, ThumbsUp, ThumbsDown, Upload, ExternalLink } from "lucide-react";

interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  email: string | null;
  writingStyle: string | null;
  tone: string | null;
  targetAudience: string | null;
  contentGoals: string | null;
  promptTemplate: string | null;
  keywords: string | null;
  avoidTopics: string | null;
  wordCountMin: number | null;
  wordCountMax: number | null;
  // Campos de vídeo
  videoEnabled: boolean;
  videoAvatarName: string | null;
  videoAvatarDesc: string | null;
  videoAvatarStyle: string | null;
  videoAvatarImage: string | null;
  videoIntroScript: string | null;
  videoOutroScript: string | null;
  videoDuration: string | null;
  videoTone: string | null;
  videoBackground: string | null;
  videoCta: string | null;
  videoCompanyMention: string | null;
  active: boolean;
  _count?: { posts: number };
  categories: { category: { id: string; name: string; color: string | null } }[];
  tags: { tag: { id: string; name: string } }[];
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface TagItem {
  id: string;
  name: string;
  categories?: { category: { id: string } }[];
}

const TONE_OPTIONS = [
  { value: "profissional", label: "Profissional", desc: "Tom corporativo e formal" },
  { value: "autoritativo", label: "Autoritativo", desc: "Especialista com credibilidade" },
  { value: "consultivo", label: "Consultivo", desc: "Orientação e recomendações" },
  { value: "didatico", label: "Didático", desc: "Explicativo e educacional" },
  { value: "conversacional", label: "Conversacional", desc: "Próximo e acessível" },
  { value: "tecnico", label: "Técnico", desc: "Detalhado e preciso" },
];

const GOAL_OPTIONS = [
  { value: "autoridade", label: "Autoridade", icon: "🏆", desc: "Posicionar como referência no mercado" },
  { value: "trafego", label: "Tráfego", icon: "📈", desc: "Atrair visitantes via SEO e buscas" },
  { value: "conversao", label: "Conversão", icon: "🎯", desc: "Gerar leads e oportunidades de negócio" },
];

const STYLE_SUGGESTIONS = [
  "Técnico com exemplos práticos",
  "Jornalístico investigativo",
  "Analítico com dados e estatísticas",
  "Storytelling corporativo",
  "How-to passo a passo",
  "Comparativo e avaliativo",
];

const WORD_COUNT_PRESETS = [
  { label: "Curto (300-500)", min: 300, max: 500, desc: "Notícias rápidas" },
  { label: "Médio (800-1200)", min: 800, max: 1200, desc: "Blog posts padrão" },
  { label: "Longo (1500-2000)", min: 1500, max: 2000, desc: "Artigos completos" },
  { label: "Extenso (2500-3500)", min: 2500, max: 3500, desc: "Pillar content" },
];

const VIDEO_DURATION_OPTIONS = [
  { value: "30s", label: "30 segundos", desc: "Reels/Shorts" },
  { value: "60s", label: "1 minuto", desc: "Vídeo curto" },
  { value: "90s", label: "1:30 min", desc: "Explicativo" },
  { value: "180s", label: "3 minutos", desc: "Tutorial rápido" },
];

const VIDEO_TONE_OPTIONS = [
  { value: "informativo", label: "Informativo", desc: "Foco em dados e fatos" },
  { value: "dinamico", label: "Dinâmico", desc: "Ritmo acelerado e energético" },
  { value: "didatico", label: "Didático", desc: "Explicativo passo a passo" },
  { value: "inspiracional", label: "Inspiracional", desc: "Motivacional e empolgante" },
  { value: "casual", label: "Casual", desc: "Descontraído e próximo" },
];

const AVATAR_STYLE_OPTIONS = [
  { value: "profissional", label: "Profissional", desc: "Terno/blazer, ambiente corporativo" },
  { value: "smart-casual", label: "Smart Casual", desc: "Elegante mas descontraído" },
  { value: "casual", label: "Casual", desc: "Roupas casuais, ambiente informal" },
  { value: "tecnico", label: "Técnico", desc: "Jaleco, ambiente de datacenter/lab" },
];

const AVATAR_GENDER_OPTIONS = [
  { value: "male", label: "Masculino", emoji: "👨" },
  { value: "female", label: "Feminino", emoji: "👩" },
];

// Estilos de geração de imagem
const GENERATION_STYLE_OPTIONS = [
  { value: "realista", label: "Realista", desc: "Foto realista de alta qualidade", icon: "📷" },
  { value: "profissional", label: "Profissional", desc: "Retrato corporativo clássico", icon: "👔" },
  { value: "artistico", label: "Artístico", desc: "Estilo digital art criativo", icon: "🎨" },
  { value: "moderno", label: "Moderno", desc: "Visual contemporâneo e clean", icon: "✨" },
  { value: "executivo", label: "Executivo", desc: "Alto nível corporativo", icon: "💼" },
  { value: "tecnologia", label: "Tech", desc: "Visual futurista de TI", icon: "💻" },
  { value: "cartoon", label: "Cartoon", desc: "Estilo Pixar/3D animado", icon: "🎨" },
  { value: "anime", label: "Anime", desc: "Estilo animação japonesa", icon: "🎌" },
  { value: "ilustracao", label: "Ilustração", desc: "Arte digital vetorial", icon: "✏️" },
];

// Provedores de IA
const AI_PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI (DALL-E 3)", desc: "Alta qualidade, analisa descrição da foto" },
  { value: "leonardo", label: "Leonardo AI ⭐", desc: "Cartoon baseado na sua foto! Recomendado", supportsReference: true },
  { value: "stability", label: "Stability AI", desc: "Stable Diffusion XL" },
  { value: "d-id", label: "D-ID", desc: "Avatares de vídeo com apresentadores prontos" },
  { value: "heygen", label: "HeyGen", desc: "Avatares de vídeo profissionais" },
];

export default function AutoresPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "prompt" | "video">("info");
  const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);
  
  // Estados para geração de avatar
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<{ provider: string; message: string; action: string } | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]); // Múltiplas fotos de referência
  const [generationStyle, setGenerationStyle] = useState("profissional");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [availableProviders, setAvailableProviders] = useState<{id: string; name: string; supportsReference: boolean}[]>([]);
  const [usedProvider, setUsedProvider] = useState<string | null>(null);
  
  // Estados para geração múltipla
  const [generatedAvatars, setGeneratedAvatars] = useState<{url: string; provider: string; error?: string}[]>([]);
  const [generatingMultiple, setGeneratingMultiple] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{total: number; completed: number; current: string}>({ total: 0, completed: 0, current: '' });
  
  // Estado para upload de foto
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    bio: "",
    email: "",
    avatar: "",
    categoryIds: [] as string[],
    tagIds: [] as string[],
    // Campos de Prompt
    writingStyle: "",
    tone: "profissional",
    targetAudience: "",
    contentGoals: "autoridade,trafego,conversao",
    promptTemplate: "",
    keywords: "",
    avoidTopics: "",
    wordCountMin: "",
    wordCountMax: "",
    // Campos de Vídeo
    videoEnabled: false,
    videoAvatarName: "",
    videoAvatarDesc: "",
    videoAvatarStyle: "profissional",
    videoAvatarGender: "male",
    videoAvatarImage: "",
    videoIntroScript: "",
    videoOutroScript: "",
    videoDuration: "60s",
    videoTone: "informativo",
    videoBackground: "",
    videoCta: "",
    videoCompanyMention: "",
  });

  const fetchAuthors = async () => {
    try {
      const res = await fetch("/api/gestor/authors");
      const data = await res.json();
      setAuthors(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/gestor/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllTags = async () => {
    try {
      const res = await fetch("/api/gestor/tags");
      const data = await res.json();
      setAllTags(data);
    } catch (error) {
      console.error(error);
    }
  };

  // Filtrar tags quando categorias mudam
  useEffect(() => {
    if (form.categoryIds.length === 0) {
      setFilteredTags(allTags);
    } else {
      const filtered = allTags.filter(tag => 
        tag.categories?.some(cat => form.categoryIds.includes(cat.category.id))
      );
      setFilteredTags(filtered.length > 0 ? filtered : allTags);
    }
  }, [form.categoryIds, allTags]);

  useEffect(() => {
    fetchAuthors();
    fetchCategories();
    fetchAllTags();
    fetchAvatarProviders();
  }, []);

  // Buscar provedores de IA disponíveis
  const fetchAvatarProviders = async () => {
    try {
      const res = await fetch("/api/gestor/authors/generate-avatar");
      if (res.ok) {
        const data = await res.json();
        setAvailableProviders(data.providers || []);
        if (data.providers?.length > 0) {
          setSelectedProvider(data.providers[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching avatar providers:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const url = "/api/gestor/authors";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      fetchAuthors();
      setShowModal(false);
      setEditing(null);
      resetForm();
    } catch (error: any) {
      alert(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "", bio: "", email: "", avatar: "", categoryIds: [], tagIds: [],
      writingStyle: "", tone: "profissional", targetAudience: "",
      contentGoals: "autoridade,trafego,conversao", promptTemplate: "",
      keywords: "", avoidTopics: "", wordCountMin: "", wordCountMax: "",
      videoEnabled: false, videoAvatarName: "", videoAvatarDesc: "",
      videoAvatarStyle: "profissional", videoAvatarGender: "male", videoAvatarImage: "",
      videoIntroScript: "", videoOutroScript: "",
      videoDuration: "60s", videoTone: "informativo", videoBackground: "",
      videoCta: "", videoCompanyMention: ""
    });
    setActiveTab("info");
    setAvatarPreview(null);
    setAvatarError(null);
    setGeneratedAvatars([]);
    setReferenceImages([]);
    setReferenceImage(null);
    setPhotoPreview(null);
  };

  const handleEdit = (author: Author) => {
    setEditing(author);
    setForm({
      name: author.name,
      bio: author.bio || "",
      email: author.email || "",
      avatar: author.avatar || "",
      categoryIds: author.categories.map(c => c.category.id),
      tagIds: author.tags.map(t => t.tag.id),
      writingStyle: author.writingStyle || "",
      tone: author.tone || "profissional",
      targetAudience: author.targetAudience || "",
      contentGoals: author.contentGoals || "autoridade,trafego,conversao",
      promptTemplate: author.promptTemplate || "",
      keywords: author.keywords || "",
      avoidTopics: author.avoidTopics || "",
      wordCountMin: author.wordCountMin?.toString() || "",
      wordCountMax: author.wordCountMax?.toString() || "",
      // Campos de vídeo
      videoEnabled: author.videoEnabled || false,
      videoAvatarName: author.videoAvatarName || "",
      videoAvatarDesc: author.videoAvatarDesc || "",
      videoAvatarStyle: author.videoAvatarStyle || "profissional",
      videoAvatarGender: "male",
      videoAvatarImage: author.videoAvatarImage || "",
      videoIntroScript: author.videoIntroScript || "",
      videoOutroScript: author.videoOutroScript || "",
      videoDuration: author.videoDuration || "60s",
      videoTone: author.videoTone || "informativo",
      videoBackground: author.videoBackground || "",
      videoCta: author.videoCta || "",
      videoCompanyMention: author.videoCompanyMention || "",
    });
    setShowModal(true);
    setActiveTab("info");
    // Limpar estados de avatar
    setAvatarPreview(null);
    setAvatarError(null);
    setGeneratedAvatars([]);
    setReferenceImages([]);
    setReferenceImage(null);
    setPhotoPreview(author.avatar || null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este autor?")) return;

    try {
      const res = await fetch(`/api/gestor/authors?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }
      fetchAuthors();
    } catch (error: any) {
      alert(error.message || "Erro ao excluir");
    }
  };

  const toggleCategory = (id: string) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id]
    }));
  };

  const toggleTag = (id: string) => {
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter(t => t !== id)
        : [...prev.tagIds, id]
    }));
  };

  const toggleGoal = (goal: string) => {
    const goals = form.contentGoals.split(",").filter(g => g);
    const newGoals = goals.includes(goal)
      ? goals.filter(g => g !== goal)
      : [...goals, goal];
    setForm({ ...form, contentGoals: newGoals.join(",") });
  };

  const generatePromptTemplate = () => {
    const goals = form.contentGoals.split(",").filter(g => g);
    const goalsText = goals.map(g => {
      switch(g) {
        case "autoridade": return "estabelecer autoridade e credibilidade no mercado";
        case "trafego": return "otimizar para SEO e atrair tráfego orgânico";
        case "conversao": return "incluir CTAs e direcionar para conversão";
        default: return "";
      }
    }).filter(Boolean).join(", ");

    const toneDesc = TONE_OPTIONS.find(t => t.value === form.tone)?.desc || "";
    
    const wordCountText = form.wordCountMin && form.wordCountMax 
      ? `\n\n## EXTENSÃO DO TEXTO\nCada texto deve ter entre ${form.wordCountMin} e ${form.wordCountMax} palavras.`
      : form.wordCountMin 
        ? `\n\n## EXTENSÃO DO TEXTO\nCada texto deve ter no mínimo ${form.wordCountMin} palavras.`
        : form.wordCountMax 
          ? `\n\n## EXTENSÃO DO TEXTO\nCada texto deve ter no máximo ${form.wordCountMax} palavras.`
          : "";

    const prompt = `Você é ${form.name}, especialista em tecnologia da informação e soluções corporativas.

## ESTILO DE ESCRITA
- Estilo: ${form.writingStyle || "Técnico com abordagem consultiva"}
- Tom: ${form.tone} (${toneDesc})

## PÚBLICO-ALVO
${form.targetAudience || "Decisores de TI, CTOs, gerentes de infraestrutura e empresários que buscam soluções tecnológicas"}

## OBJETIVOS DO CONTEÚDO
${goalsText}${wordCountText}

## DIRETRIZES
1. Use linguagem clara e profissional
2. Inclua dados e exemplos práticos quando relevante
3. Estruture o texto com subtítulos (H2, H3) para facilitar leitura
4. Mantenha parágrafos curtos (3-4 linhas)
5. Utilize bullet points para listas
${form.keywords ? `6. Incorpore naturalmente: ${form.keywords}` : ""}
${form.avoidTopics ? `\n## EVITAR\n${form.avoidTopics}` : ""}`;

    setForm({ ...form, promptTemplate: prompt });
  };

  const generateVideoScripts = () => {
    const avatarName = form.videoAvatarName || form.name;
    const company = "M3Solutions";
    
    const intro = `Olá! Eu sou ${avatarName}, especialista em TI da ${company}. Hoje vou falar sobre um assunto muito importante para a sua empresa...`;
    
    const outro = `E aí, gostou desse conteúdo? Se você quer saber mais sobre como podemos ajudar sua empresa, entre em contato com a ${company}. Acesse nosso site ou chame no WhatsApp. Não esquece de curtir e compartilhar esse vídeo! Até a próxima!`;
    
    const cta = `Quer transformar a TI da sua empresa? Fale agora com um especialista da ${company}!`;
    
    const mention = `A ${company} é referência em soluções de TI para empresas. Com mais de 15 anos de experiência, oferecemos suporte técnico, cloud computing, segurança da informação e muito mais.`;
    
    setForm({ 
      ...form, 
      videoIntroScript: intro,
      videoOutroScript: outro,
      videoCta: cta,
      videoCompanyMention: mention
    });
  };

  // Função para gerar avatar personalizado com IA
  const handleGenerateAvatar = async () => {
    if (!editing?.id) {
      alert("Salve o autor primeiro antes de gerar o avatar.");
      return;
    }

    setGeneratingAvatar(true);
    setAvatarPreview(null);
    setAvatarError(null);
    setUsedProvider(null);

    try {
      const res = await fetch("/api/gestor/authors/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: editing.id,
          avatarName: form.videoAvatarName || form.name,
          avatarDesc: form.videoAvatarDesc,
          avatarStyle: form.videoAvatarStyle,
          gender: form.videoAvatarGender,
          generationStyle: generationStyle,
          referenceImage: referenceImage,
          preferredProvider: selectedProvider
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (data.errorDetails) {
          setAvatarError(data.errorDetails);
        } else {
          setAvatarError({
            provider: 'Desconhecido',
            message: data.error || 'Erro ao gerar avatar',
            action: 'Tente novamente ou entre em contato com o suporte.'
          });
        }
        return;
      }

      setAvatarPreview(data.imageUrl);
      setUsedProvider(data.provider || null);
    } catch (error: any) {
      setAvatarError({
        provider: 'Sistema',
        message: error.message || 'Erro de conexão',
        action: 'Verifique sua conexão com a internet e tente novamente.'
      });
    } finally {
      setGeneratingAvatar(false);
    }
  };

  // Função para upload de imagem de referência
  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setReferenceImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Função para remover imagem de referência
  const handleRemoveReference = () => {
    setReferenceImage(null);
  };

  // Função para upload de múltiplas fotos de referência e geração em paralelo
  const handleMultipleUploadAndGenerate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limitar a 6 fotos
    const fileArray = Array.from(files).slice(0, 6);
    
    // Validar arquivos
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Cada imagem deve ter no máximo 5MB');
        return;
      }
    }

    if (!editing?.id) {
      alert("Salve o autor primeiro antes de gerar o avatar.");
      return;
    }

    // Converter todas as imagens para base64
    const base64Images: string[] = [];
    for (const file of fileArray) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      base64Images.push(base64);
    }

    setReferenceImages(base64Images);
    setReferenceImage(base64Images[0]); // Usar primeira como principal
    setAvatarError(null);
    setAvatarPreview(null);
    setGeneratedAvatars([]);
    setGeneratingMultiple(true);

    // Pegar provedores disponíveis que suportam referência de imagem
    const providersToUse = availableProviders.filter(p => 
      p.supportsReference || p.id === 'openai' // OpenAI analisa descrição
    );

    if (providersToUse.length === 0) {
      setAvatarError({
        provider: 'Sistema',
        message: 'Nenhum provedor de IA disponível',
        action: 'Configure as chaves de API nas variáveis de ambiente.'
      });
      setGeneratingMultiple(false);
      return;
    }

    const totalGenerations = providersToUse.length;
    setGenerationProgress({ total: totalGenerations, completed: 0, current: '' });

    // Gerar em paralelo com todos os provedores
    const results: {url: string; provider: string; error?: string}[] = [];

    const generateWithProvider = async (provider: {id: string; name: string}) => {
      setGenerationProgress(prev => ({ ...prev, current: provider.name }));
      
      try {
        const res = await fetch("/api/gestor/authors/generate-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorId: editing.id,
            avatarName: form.videoAvatarName || form.name,
            avatarDesc: form.videoAvatarDesc,
            avatarStyle: form.videoAvatarStyle,
            gender: form.videoAvatarGender,
            generationStyle: generationStyle,
            referenceImage: base64Images[0], // Usar primeira foto como referência
            preferredProvider: provider.id
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          return {
            url: '',
            provider: provider.name,
            error: data.errorDetails?.message || data.error || 'Erro na geração'
          };
        }

        return {
          url: data.imageUrl,
          provider: data.provider || provider.name
        };
      } catch (error: any) {
        return {
          url: '',
          provider: provider.name,
          error: error.message || 'Erro de conexão'
        };
      }
    };

    // Executar em paralelo
    const promises = providersToUse.map(provider => generateWithProvider(provider));
    const generationResults = await Promise.all(promises);
    
    // Filtrar resultados válidos e erros
    const validResults = generationResults.filter(r => r.url);
    const errorResults = generationResults.filter(r => r.error);

    setGeneratedAvatars([...validResults, ...errorResults]);
    setGenerationProgress({ total: totalGenerations, completed: totalGenerations, current: '' });
    setGeneratingMultiple(false);

    // Se só tiver erros, mostrar o primeiro
    if (validResults.length === 0 && errorResults.length > 0) {
      setAvatarError({
        provider: errorResults[0].provider,
        message: errorResults[0].error || 'Erro desconhecido',
        action: 'Verifique as configurações e tente novamente.'
      });
    }
  };

  // Função para selecionar um avatar da galeria
  const handleSelectAvatar = (avatarUrl: string, providerName: string) => {
    setAvatarPreview(avatarUrl);
    setUsedProvider(providerName);
    setGeneratedAvatars([]); // Limpar galeria após seleção
  };

  // Função para upload de foto de referência e geração automática (mantida para compatibilidade)
  const handleReferenceUploadAndGenerate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Redirecionar para função múltipla
    handleMultipleUploadAndGenerate(e);
  };

  // Função para aprovar e salvar avatar
  const handleApproveAvatar = async () => {
    if (!avatarPreview || !editing?.id) return;

    setSavingAvatar(true);
    try {
      const res = await fetch("/api/gestor/authors/generate-avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: editing.id,
          imageUrl: avatarPreview
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar avatar");
      }

      // Atualizar form e limpar preview
      setForm({ ...form, videoAvatarImage: avatarPreview });
      setAvatarPreview(null);
      alert("Avatar salvo com sucesso!");
      
      // Atualizar lista de autores
      fetchAuthors();
    } catch (error: any) {
      alert(error.message || "Erro ao salvar avatar");
    } finally {
      setSavingAvatar(false);
    }
  };

  // Função para rejeitar avatar
  const handleRejectAvatar = () => {
    setAvatarPreview(null);
    setAvatarError(null);
    setGeneratedAvatars([]);
    setReferenceImages([]);
  };

  const applyWordCountPreset = (preset: typeof WORD_COUNT_PRESETS[0]) => {
    setForm({ ...form, wordCountMin: preset.min.toString(), wordCountMax: preset.max.toString() });
  };

  // Função para upload de foto do autor
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem (JPG, PNG, WebP)');
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB');
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Se estiver editando, fazer upload imediato
    if (editing?.id) {
      setUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('authorId', editing.id);

        const res = await fetch('/api/gestor/authors/upload-avatar', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao fazer upload');
        }

        setForm({ ...form, avatar: data.avatarUrl });
        setPhotoPreview(data.avatarUrl);
        fetchAuthors(); // Atualizar lista
      } catch (error: any) {
        alert(error.message || 'Erro ao fazer upload da foto');
        setPhotoPreview(editing.avatar || null);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setForm({ ...form, avatar: '' });
  };

  const hasPromptConfig = (author: Author) => {
    return author.writingStyle || author.tone || author.targetAudience || author.contentGoals || author.promptTemplate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autores</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie os autores e configure estilos de escrita para IA e vídeos
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition font-medium"
        >
          <Plus size={18} />
          Novo Autor
        </button>
      </div>

      {/* Lista de Autores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {authors.length === 0 ? (
          <div className="text-center py-16">
            <UserCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum autor cadastrado</p>
            <button
              onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Criar primeiro autor
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {authors.map((author) => (
              <div key={author.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {author.avatar ? (
                      <img 
                        src={author.avatar} 
                        alt={author.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{author.name}</h3>
                        {/* Badge de vídeo oculto temporariamente
                        {author.videoEnabled && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                            <Video size={10} />
                            Vídeo
                          </span>
                        )}
                        */}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {author.categories.map(({ category }) => (
                          <span
                            key={category.id}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: category.color ? `${category.color}20` : "#f3f4f6",
                              color: category.color || "#6b7280"
                            }}
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                      {hasPromptConfig(author) && (
                        <div className="mt-2">
                          <button
                            onClick={() => setExpandedAuthor(expandedAuthor === author.id ? null : author.id)}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            {expandedAuthor === author.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {expandedAuthor === author.id ? "Ocultar" : "Ver configuração"}
                          </button>
                          {expandedAuthor === author.id && (
                            <div className="mt-2 p-3 bg-purple-50 rounded-lg text-sm space-y-2">
                              {author.tone && (
                                <p><strong>Tom:</strong> {TONE_OPTIONS.find(t => t.value === author.tone)?.label || author.tone}</p>
                              )}
                              {author.writingStyle && (
                                <p><strong>Estilo:</strong> {author.writingStyle}</p>
                              )}
                              {author.contentGoals && (
                                <p><strong>Objetivos:</strong> {author.contentGoals.split(",").map(g => 
                                  GOAL_OPTIONS.find(go => go.value === g)?.label || g
                                ).join(", ")}</p>
                              )}
                              {author.targetAudience && (
                                <p><strong>Público:</strong> {author.targetAudience}</p>
                              )}
                              {(author.wordCountMin || author.wordCountMax) && (
                                <p><strong>Palavras:</strong> {
                                  author.wordCountMin && author.wordCountMax 
                                    ? `${author.wordCountMin} - ${author.wordCountMax}`
                                    : author.wordCountMin 
                                      ? `Mín. ${author.wordCountMin}`
                                      : `Máx. ${author.wordCountMax}`
                                }</p>
                              )}
                              {/* Configuração de vídeo oculta temporariamente
                              {author.videoEnabled && (
                                <div className="pt-2 border-t border-purple-200">
                                  <p className="text-blue-700 font-medium">🎬 Configuração de Vídeo</p>
                                  {author.videoAvatarName && <p><strong>Avatar:</strong> {author.videoAvatarName}</p>}
                                  {author.videoDuration && <p><strong>Duração:</strong> {author.videoDuration}</p>}
                                </div>
                              )}
                              */}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {author._count?.posts || 0} posts
                  </span>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleEdit(author)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(author.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? "Editar Autor" : "Novo Autor"}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditing(null); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === "info"
                    ? "border-purple-600 text-purple-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <UserCircle size={16} />
                Informações
              </button>
              <button
                onClick={() => setActiveTab("prompt")}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === "prompt"
                    ? "border-purple-600 text-purple-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Sparkles size={16} />
                Estilo de Escrita (IA)
              </button>
              {/* Tab de vídeos oculta temporariamente
              <button
                onClick={() => setActiveTab("video")}
                className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === "video"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Clapperboard size={16} />
                Vídeos
              </button>
              */}
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
              <div className="p-6">
                {/* Tab: Informações */}
                {activeTab === "info" && (
                  <div className="space-y-6">
                    {/* Upload de Foto */}
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Autor</label>
                        <div className="relative">
                          {photoPreview || form.avatar ? (
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-purple-200">
                              <img 
                                src={photoPreview || form.avatar} 
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                              {uploadingPhoto && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <Loader2 className="animate-spin text-white" size={24} />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition bg-gray-50">
                              <Upload size={20} className="text-gray-400" />
                              <span className="text-xs text-gray-400 mt-1">Upload</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoUpload}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">JPG, PNG ou WebP<br/>Máx. 2MB</p>
                      </div>

                      <div className="flex-1 space-y-4">
                        {/* Nome */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Autor *</label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: João Silva"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="autor@m3solutions.com.br"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Biografia</label>
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder="Breve descrição sobre o autor..."
                      />
                    </div>

                    {/* Categorias */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FolderOpen size={14} className="inline mr-1" />
                        Categorias (selecione para filtrar tags)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition flex items-center gap-1 ${
                              form.categoryIds.includes(category.id)
                                ? "border-transparent text-white"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                            style={{
                              backgroundColor: form.categoryIds.includes(category.id) ? (category.color || "#9333ea") : undefined,
                              color: form.categoryIds.includes(category.id) ? "white" : (category.color || "#6b7280")
                            }}
                          >
                            {form.categoryIds.includes(category.id) && <Check size={14} />}
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags filtradas por categoria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Tag size={14} className="inline mr-1" />
                        Tags {form.categoryIds.length > 0 && <span className="text-purple-600">(filtradas pela categoria)</span>}
                      </label>
                      {filteredTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                          {filteredTags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={`px-3 py-1 rounded-full text-sm font-medium border transition flex items-center gap-1 ${
                                form.tagIds.includes(tag.id)
                                  ? "bg-purple-100 border-purple-300 text-purple-700"
                                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                              }`}
                            >
                              {form.tagIds.includes(tag.id) && <Check size={12} />}
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhuma tag encontrada para as categorias selecionadas</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {form.tagIds.length} tag(s) selecionada(s)
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab: Estilo de Escrita */}
                {activeTab === "prompt" && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 mb-4">
                      <p className="text-sm text-purple-700">
                        <Sparkles size={14} className="inline mr-1" />
                        Configure o estilo de escrita para que a IA gere conteúdo com a voz deste autor
                      </p>
                    </div>

                    {/* Tom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Target size={14} className="inline mr-1" />
                        Tom de Voz
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TONE_OPTIONS.map((tone) => (
                          <button
                            key={tone.value}
                            type="button"
                            onClick={() => setForm({ ...form, tone: tone.value })}
                            className={`p-3 rounded-lg border text-left transition ${
                              form.tone === tone.value
                                ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className={`font-medium text-sm ${form.tone === tone.value ? 'text-purple-700' : 'text-gray-900'}`}>
                              {tone.label}
                            </p>
                            <p className="text-xs text-gray-500">{tone.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Objetivos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Objetivos do Conteúdo</label>
                      <div className="flex gap-2">
                        {GOAL_OPTIONS.map((goal) => {
                          const isSelected = form.contentGoals.split(",").includes(goal.value);
                          return (
                            <button
                              key={goal.value}
                              type="button"
                              onClick={() => toggleGoal(goal.value)}
                              className={`flex-1 p-3 rounded-lg border text-left transition ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-lg">{goal.icon}</span>
                              <p className={`font-medium text-sm mt-1 ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                                {goal.label}
                              </p>
                              <p className="text-xs text-gray-500">{goal.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Público-alvo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Users size={14} className="inline mr-1" />
                        Público-Alvo
                      </label>
                      <textarea
                        value={form.targetAudience}
                        onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder="Ex: CTOs, gerentes de TI, diretores de tecnologia de empresas de médio porte"
                      />
                    </div>

                    {/* Estilo de Escrita */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estilo de Escrita</label>
                      <input
                        type="text"
                        value={form.writingStyle}
                        onChange={(e) => setForm({ ...form, writingStyle: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Técnico com exemplos práticos"
                      />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {STYLE_SUGGESTIONS.map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setForm({ ...form, writingStyle: style })}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition"
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quantidade de Palavras */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText size={14} className="inline mr-1" />
                        Quantidade de Palavras
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {WORD_COUNT_PRESETS.map((preset) => {
                          const isSelected = form.wordCountMin === preset.min.toString() && form.wordCountMax === preset.max.toString();
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => applyWordCountPreset(preset)}
                              className={`p-2 rounded-lg border text-left transition ${
                                isSelected
                                  ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <p className={`font-medium text-xs ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                                {preset.label}
                              </p>
                              <p className="text-[10px] text-gray-500">{preset.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                          <input
                            type="number"
                            value={form.wordCountMin}
                            onChange={(e) => setForm({ ...form, wordCountMin: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="800"
                          />
                        </div>
                        <span className="text-gray-400 mt-5">—</span>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                          <input
                            type="number"
                            value={form.wordCountMax}
                            onChange={(e) => setForm({ ...form, wordCountMax: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            placeholder="1200"
                          />
                        </div>
                        <span className="text-xs text-gray-400 mt-5">palavras</span>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave Frequentes</label>
                      <input
                        type="text"
                        value={form.keywords}
                        onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: cloud computing, segurança, produtividade, ROI"
                      />
                      <p className="text-xs text-gray-400 mt-1">Separe com vírgulas</p>
                    </div>

                    {/* Tópicos a Evitar */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <AlertCircle size={14} className="inline mr-1" />
                        Tópicos/Termos a Evitar
                      </label>
                      <textarea
                        value={form.avoidTopics}
                        onChange={(e) => setForm({ ...form, avoidTopics: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                        placeholder="Ex: Não mencionar concorrentes por nome, evitar jargões muito técnicos..."
                      />
                    </div>

                    {/* Prompt Template */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          <Sparkles size={14} className="inline mr-1" />
                          Prompt Completo
                        </label>
                        <button
                          type="button"
                          onClick={generatePromptTemplate}
                          className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition flex items-center gap-1"
                        >
                          <Sparkles size={12} />
                          Gerar Automaticamente
                        </button>
                      </div>
                      <textarea
                        value={form.promptTemplate}
                        onChange={(e) => setForm({ ...form, promptTemplate: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                        placeholder="Clique em 'Gerar Automaticamente' para criar um prompt baseado nas configurações acima."
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Vídeos */}
                {activeTab === "video" && (
                  <div className="space-y-6">
                    {/* Ativar Vídeos */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clapperboard size={24} className="text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-800">Geração de Vídeos</p>
                            <p className="text-sm text-blue-600">Configure avatar e scripts para vídeos curtos</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.videoEnabled}
                            onChange={(e) => setForm({ ...form, videoEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {form.videoEnabled && (
                      <>
                        {/* Seção: Avatar */}
                        <div className="border-b pb-4 mb-4">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <UserCircle size={18} />
                            Avatar / Apresentador
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Avatar</label>
                              <input
                                type="text"
                                value={form.videoAvatarName}
                                onChange={(e) => setForm({ ...form, videoAvatarName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder={form.name || "Ex: João Silva"}
                              />
                              <p className="text-xs text-gray-400 mt-1">Deixe em branco para usar o nome do autor</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                              <div className="flex gap-2">
                                {AVATAR_GENDER_OPTIONS.map((gender) => (
                                  <button
                                    key={gender.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, videoAvatarGender: gender.value })}
                                    className={`flex-1 p-2.5 rounded-lg border text-center transition ${
                                      form.videoAvatarGender === gender.value
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <span className="text-xl mr-1">{gender.emoji}</span>
                                    <span className={`font-medium text-sm ${form.videoAvatarGender === gender.value ? 'text-blue-700' : 'text-gray-700'}`}>
                                      {gender.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Estilo Visual</label>
                              <select
                                value={form.videoAvatarStyle}
                                onChange={(e) => setForm({ ...form, videoAvatarStyle: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                {AVATAR_STYLE_OPTIONS.map((style) => (
                                  <option key={style.value} value={style.value}>
                                    {style.label} - {style.desc}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cenário/Background</label>
                              <input
                                type="text"
                                value={form.videoBackground}
                                onChange={(e) => setForm({ ...form, videoBackground: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Ex: Escritório moderno, datacenter"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Avatar</label>
                            <textarea
                              value={form.videoAvatarDesc}
                              onChange={(e) => setForm({ ...form, videoAvatarDesc: e.target.value })}
                              rows={2}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                              placeholder="Ex: 35-40 anos, cabelo curto escuro, barba aparada, expressão confiante e amigável"
                            />
                            <p className="text-xs text-gray-400 mt-1">Descreva as características físicas do avatar desejado</p>
                          </div>

                          {/* Avatar Personalizado - Geração e Preview */}
                          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                <ImagePlus size={16} className="text-purple-600" />
                                Avatar Personalizado com IA
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Gere com IA usando referência de imagem ou envie sua própria foto
                              </p>
                            </div>

                            {/* Configurações de Geração - Sempre visível quando não há preview */}
                            {!avatarPreview && (
                              <div className="space-y-4 mb-4">
                                {/* Provedor de IA - Sempre visível */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Provedor de IA para Geração
                                  </label>
                                  {availableProviders.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {availableProviders.map((provider) => (
                                        <button
                                          key={provider.id}
                                          type="button"
                                          onClick={() => setSelectedProvider(provider.id)}
                                          className={`p-3 rounded-lg border text-left transition ${
                                            selectedProvider === provider.id
                                              ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                                              : "border-gray-200 hover:border-purple-300"
                                          }`}
                                        >
                                          <p className="text-sm font-medium text-gray-800">{provider.name}</p>
                                          {provider.supportsReference && (
                                            <p className="text-[10px] text-green-600 mt-1">✓ Suporta referência</p>
                                          )}
                                          {!provider.supportsReference && (
                                            <p className="text-[10px] text-gray-500 mt-1">Geração baseada em texto</p>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                      <p className="text-sm text-yellow-700">
                                        Nenhum provedor de IA configurado. Configure as chaves de API para OpenAI ou Stability AI.
                                      </p>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-400 mt-2">
                                    {AI_PROVIDER_OPTIONS.find(p => p.value === selectedProvider)?.desc || 'Selecione um provedor'}
                                  </p>
                                </div>

                                {/* Estilo e Referência - Só aparecem se não tem avatar salvo */}
                                {!form.videoAvatarImage && (
                                  <>
                                    {/* Estilo de Geração */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estilo da Imagem
                                      </label>
                                      <div className="grid grid-cols-3 gap-2">
                                        {GENERATION_STYLE_OPTIONS.map((style) => (
                                          <button
                                            key={style.value}
                                            type="button"
                                            onClick={() => setGenerationStyle(style.value)}
                                            className={`p-2 rounded-lg border text-left transition ${
                                              generationStyle === style.value
                                                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                                                : "border-gray-200 hover:border-purple-300 hover:bg-purple-25"
                                            }`}
                                          >
                                            <span className="text-lg">{style.icon}</span>
                                            <p className="text-xs font-medium text-gray-800">{style.label}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{style.desc}</p>
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Imagem de Referência */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Imagem de Referência (opcional)
                                      </label>
                                      <p className="text-xs text-gray-500 mb-2">
                                        Envie uma foto para a IA gerar um avatar semelhante
                                      </p>
                                      
                                      {referenceImage ? (
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                                          <img 
                                            src={referenceImage} 
                                            alt="Referência" 
                                            className="w-16 h-16 rounded-lg object-cover border"
                                          />
                                          <div className="flex-1">
                                            <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                                              <Check size={14} />
                                              Imagem de referência carregada
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              A IA analisará esta imagem para gerar um avatar semelhante
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={handleRemoveReference}
                                            className="text-red-500 hover:text-red-700 p-1"
                                          >
                                            <X size={16} />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-25 transition">
                                          <Upload size={20} className="text-gray-400" />
                                          <span className="text-sm text-gray-500">Clique para enviar foto de referência</span>
                                          <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleReferenceImageUpload} 
                                            className="hidden" 
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Botões de Ação */}
                            <div className="flex flex-col gap-3 mb-4">
                              <label className={`flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium ${generatingMultiple || generatingAvatar || !editing?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {generatingMultiple ? (
                                  <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Gerando com {generationProgress.current || '...'}
                                    <span className="text-xs opacity-75">
                                      ({generationProgress.completed}/{generationProgress.total})
                                    </span>
                                  </>
                                ) : generatingAvatar ? (
                                  <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Gerando avatar...
                                  </>
                                ) : (
                                  <>
                                    <Upload size={16} />
                                    📸 Upload de fotos de referência (até 6)
                                  </>
                                )}
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  multiple
                                  onChange={handleMultipleUploadAndGenerate} 
                                  className="hidden"
                                  disabled={generatingMultiple || generatingAvatar || !editing?.id}
                                />
                              </label>
                              <p className="text-xs text-gray-500 text-center">
                                Gera automaticamente um avatar em cada API configurada. Você escolhe o melhor!
                              </p>
                              <button
                                type="button"
                                onClick={handleGenerateAvatar}
                                disabled={generatingAvatar || generatingMultiple || !editing?.id}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                              >
                                <Sparkles size={16} />
                                Gerar sem foto (apenas descrição)
                              </button>
                            </div>

                            {/* Galeria de Avatares Gerados */}
                            {generatedAvatars.length > 0 && !avatarPreview && (
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 mb-4">
                                <p className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
                                  <Sparkles size={16} />
                                  Escolha o melhor avatar ({generatedAvatars.filter(a => a.url).length} gerados)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                  {generatedAvatars.map((avatar, index) => (
                                    <div key={index} className="relative group">
                                      {avatar.url ? (
                                        <div 
                                          onClick={() => handleSelectAvatar(avatar.url, avatar.provider)}
                                          className="cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all hover:shadow-lg"
                                        >
                                          <img 
                                            src={avatar.url} 
                                            alt={`Avatar ${avatar.provider}`}
                                            className="w-full h-32 object-cover"
                                          />
                                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                            <p className="text-xs text-white font-medium truncate">
                                              {avatar.provider}
                                            </p>
                                          </div>
                                          <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 transition flex items-center justify-center">
                                            <span className="text-white opacity-0 group-hover:opacity-100 bg-purple-600 px-2 py-1 rounded text-xs font-medium">
                                              Selecionar
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 h-32 flex flex-col items-center justify-center">
                                          <AlertCircle size={20} className="text-red-400 mb-1" />
                                          <p className="text-xs text-red-600 font-medium text-center">
                                            {avatar.provider}
                                          </p>
                                          <p className="text-xs text-red-500 text-center truncate max-w-full">
                                            {avatar.error}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setGeneratedAvatars([])}
                                  className="mt-3 text-xs text-gray-500 hover:text-gray-700 w-full text-center"
                                >
                                  Cancelar e limpar galeria
                                </button>
                              </div>
                            )}

                            {/* Preview das fotos de referência carregadas */}
                            {referenceImages.length > 1 && !generatingMultiple && !generatedAvatars.length && !avatarPreview && (
                              <div className="p-3 bg-gray-50 rounded-lg border mb-4">
                                <p className="text-xs text-gray-600 mb-2">
                                  {referenceImages.length} fotos carregadas
                                </p>
                                <div className="flex gap-2 overflow-x-auto">
                                  {referenceImages.map((img, i) => (
                                    <img 
                                      key={i}
                                      src={img}
                                      alt={`Foto ${i+1}`}
                                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exibição de Erro */}
                            {avatarError && !avatarPreview && (
                              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-start gap-3">
                                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800 mb-1">
                                      Erro - {avatarError.provider}
                                    </p>
                                    <p className="text-sm text-red-700 mb-2">{avatarError.message}</p>
                                    <div className="text-sm">
                                      <span className="text-red-600 font-medium">Ação: </span>
                                      {avatarError.action.includes('http') ? (
                                        <a 
                                          href={avatarError.action.match(/https?:\/\/[^\s]+/)?.[0] || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          {avatarError.action}
                                          <ExternalLink size={12} className="inline ml-1" />
                                        </a>
                                      ) : (
                                        <span className="text-red-600">{avatarError.action}</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setAvatarError(null)}
                                      className="mt-2 text-xs text-red-500 hover:text-red-700"
                                    >
                                      Fechar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Avatar Salvo */}
                            {form.videoAvatarImage && !avatarPreview && !avatarError && (
                              <div className="p-4 bg-white rounded-lg border border-green-200">
                                <p className="text-sm font-medium text-green-700 mb-3 flex items-center gap-1">
                                  <Check size={14} />
                                  Avatar Salvo
                                </p>
                                <div className="flex items-start gap-4">
                                  <img 
                                    src={form.videoAvatarImage} 
                                    alt="Avatar salvo" 
                                    className="w-32 h-32 rounded-xl object-cover shadow-md border-2 border-green-200"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-2">
                                      Este avatar será usado para gerar vídeos deste autor.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setForm({ ...form, videoAvatarImage: "" })}
                                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                                    >
                                      <Trash2 size={12} />
                                      Remover avatar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Preview do Avatar - Aguardando Aprovação */}
                            {avatarPreview && (
                              <div className="p-4 bg-white rounded-lg border-2 border-yellow-300">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-sm font-medium text-yellow-700 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    Avatar gerado - aguardando aprovação
                                  </p>
                                  {usedProvider && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                      via {usedProvider}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-start gap-4">
                                  <img 
                                    src={avatarPreview} 
                                    alt="Preview do avatar" 
                                    className="w-40 h-40 rounded-xl object-cover shadow-lg border"
                                  />
                                  <div className="flex-1 space-y-3">
                                    <p className="text-sm text-gray-600">
                                      Revise a imagem. Se estiver satisfeito, clique em &quot;Aprovar&quot;.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={handleApproveAvatar}
                                        disabled={savingAvatar}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                                      >
                                        {savingAvatar ? <Loader2 className="animate-spin" size={14} /> : <ThumbsUp size={14} />}
                                        Aprovar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleGenerateAvatar}
                                        disabled={generatingAvatar || !editing?.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                                      >
                                        <RefreshCw size={14} className={generatingAvatar ? "animate-spin" : ""} />
                                        Regenerar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleRejectAvatar}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                                      >
                                        <ThumbsDown size={14} />
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Mensagem inicial */}
                            {!form.videoAvatarImage && !avatarPreview && !generatingAvatar && !generatingMultiple && !avatarError && generatedAvatars.length === 0 && (
                              <div className="text-center py-4 text-gray-400">
                                <UserCircle size={40} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">
                                  {editing?.id 
                                    ? "Faça upload de até 6 fotos para gerar avatares em todas as IAs disponíveis"
                                    : "Salve o autor primeiro para criar um avatar"
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Seção: Configurações de Vídeo */}
                        <div className="border-b pb-4 mb-4">
                          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Play size={18} />
                            Configurações do Vídeo
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Duração Alvo</label>
                              <div className="grid grid-cols-2 gap-2">
                                {VIDEO_DURATION_OPTIONS.map((dur) => (
                                  <button
                                    key={dur.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, videoDuration: dur.value })}
                                    className={`p-2 rounded-lg border text-left transition ${
                                      form.videoDuration === dur.value
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <p className={`font-medium text-sm ${form.videoDuration === dur.value ? 'text-blue-700' : 'text-gray-900'}`}>
                                      {dur.label}
                                    </p>
                                    <p className="text-xs text-gray-500">{dur.desc}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Tom do Vídeo</label>
                              <div className="space-y-2">
                                {VIDEO_TONE_OPTIONS.map((tone) => (
                                  <button
                                    key={tone.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, videoTone: tone.value })}
                                    className={`w-full p-2 rounded-lg border text-left transition ${
                                      form.videoTone === tone.value
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <span className={`font-medium text-sm ${form.videoTone === tone.value ? 'text-blue-700' : 'text-gray-900'}`}>
                                      {tone.label}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">{tone.desc}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Seção: Scripts */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <FileText size={18} />
                              Scripts do Vídeo
                            </h3>
                            <button
                              type="button"
                              onClick={generateVideoScripts}
                              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition flex items-center gap-1"
                            >
                              <Sparkles size={12} />
                              Gerar Scripts
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                🎬 Abertura do Vídeo
                              </label>
                              <textarea
                                value={form.videoIntroScript}
                                onChange={(e) => setForm({ ...form, videoIntroScript: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Olá! Eu sou [nome], especialista em TI da M3Solutions. Hoje vou falar sobre..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                🏢 Menção à Empresa
                              </label>
                              <textarea
                                value={form.videoCompanyMention}
                                onChange={(e) => setForm({ ...form, videoCompanyMention: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="A M3Solutions é referência em soluções de TI para empresas..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                📢 Call-to-Action Principal
                              </label>
                              <input
                                type="text"
                                value={form.videoCta}
                                onChange={(e) => setForm({ ...form, videoCta: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Quer transformar a TI da sua empresa? Fale com um especialista!"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                🎯 Encerramento (Chamada para a Empresa)
                              </label>
                              <textarea
                                value={form.videoOutroScript}
                                onChange={(e) => setForm({ ...form, videoOutroScript: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Gostou desse conteúdo? Entre em contato com a M3Solutions! Acesse nosso site ou chame no WhatsApp..."
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditing(null); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <><Loader2 className="animate-spin" size={18} /> Salvando...</>
                  ) : (
                    <><Check size={18} /> {editing ? "Atualizar" : "Criar Autor"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
