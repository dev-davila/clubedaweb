"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Sparkles, Loader2, AlertTriangle, CheckCircle2, 
  MapPin, Target, Globe, Building2, Tag, FileText,
  Info, X, Search, Layers, TrendingUp, Lightbulb, Zap
} from "lucide-react";
import { BRAZILIAN_CITIES, BRAZILIAN_STATES, normalizeString, generateSeoKeywords } from "@/lib/brazilian-cities";

interface PageToCreate {
  level: 'GLOBAL' | 'STATE' | 'CITY';
  state?: string;
  city?: string;
  slug: string;
  title: string;
  estimatedVolume: 'alto' | 'medio' | 'baixo';
}

interface CtaTemplate {
  id: string;
  name: string;
  text: string;
  buttonText: string;
  linkUrl?: string;
  whatsappText?: string;
  color: string;
}

interface AiSuggestion {
  recommendation: string;
  priority: string;
  createGlobal: boolean;
  states: string[];
  cities: { state: string; city: string; volume: string; reason: string }[];
  estimatedPages: number;
  estimatedMonthlySearches: string;
}

export default function NovaPautaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [ctaTemplates, setCtaTemplates] = useState<CtaTemplate[]>([]);
  
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    currentPage: string;
    errors: string[];
    currentBatch?: number;
    totalBatches?: number;
    batchStatus?: string;
  } | null>(null);

  // Selected page suggestions
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  const [form, setForm] = useState({
    serviceType: "",
    categoryId: "",
    authorId: "",
    brand: "",
    attendanceType: "" as "" | "REMOTE" | "LOCAL" | "HYBRID",
    pageObjective: "" as "" | "AUTHORITY" | "TRAFFIC" | "CONVERSION",
    mainKeyword: "",
    secondaryKeywords: "",
    geoCountry: "Brasil",
    selectedStates: [] as string[],
    selectedCities: [] as { state: string; city: string }[],
    selectedCtaId: "",
    customCta: "",
    createGlobalPage: true
  });

  const [categories, setCategories] = useState<{ id: string; name: string; tags?: { id: string; name: string }[] }[]>([]);
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([]);
  const [categoryTags, setCategoryTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  useEffect(() => {
    // Carregar categorias, CTAs e autores
    Promise.all([
      fetch("/api/gestor/categories?includeTags=true").then(r => r.json()),
      fetch("/api/gestor/cta-templates").then(r => r.json()),
      fetch("/api/gestor/authors").then(r => r.json())
    ]).then(([cats, ctas, auths]) => {
      setCategories(cats || []);
      setCtaTemplates(ctas || []);
      setAuthors(auths || []);
    }).catch(console.error);
  }, []);

  // Atualizar tags quando categoria mudar
  useEffect(() => {
    const selectedCategory = categories.find(c => c.id === form.categoryId);
    if (selectedCategory?.tags) {
      // Tags vem no formato { tag: { id, name } }
      const tags = (selectedCategory.tags as any[]).map((t: any) => t.tag || t);
      setCategoryTags(tags);
    } else {
      setCategoryTags([]);
    }
    setSelectedTagIds([]);
  }, [form.categoryId, categories]);

  // Auto-gerar keywords quando serviceType muda
  useEffect(() => {
    if (form.serviceType && !form.mainKeyword) {
      const keywords = generateSeoKeywords(form.serviceType, form.brand);
      setForm(prev => ({
        ...prev,
        mainKeyword: keywords.main,
        secondaryKeywords: keywords.secondary.join(', ')
      }));
    }
  }, [form.serviceType, form.brand]);

  // Cidades disponíveis baseadas nos estados selecionados
  const availableCities = useMemo(() => {
    const cities: { state: string; stateUf: string; city: string }[] = [];
    for (const stateUf of form.selectedStates) {
      const stateCities = BRAZILIAN_CITIES[stateUf] || [];
      const stateName = BRAZILIAN_STATES.find(s => s.uf === stateUf)?.name || stateUf;
      for (const city of stateCities) {
        cities.push({ state: stateName, stateUf, city });
      }
    }
    return cities.sort((a, b) => a.city.localeCompare(b.city));
  }, [form.selectedStates]);

  // Filtrar cidades pela busca
  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCities;
    const search = citySearch.toLowerCase();
    return availableCities.filter(c => 
      c.city.toLowerCase().includes(search) || 
      c.state.toLowerCase().includes(search)
    );
  }, [availableCities, citySearch]);

  // Páginas que serão criadas
  const pagesToCreate = useMemo((): PageToCreate[] => {
    if (!form.serviceType) return [];
    const pages: PageToCreate[] = [];
    const serviceSlug = normalizeString(form.serviceType);

    // Página Global
    if (form.createGlobalPage) {
      pages.push({
        level: 'GLOBAL',
        slug: `/${serviceSlug}`,
        title: `${form.serviceType} | M3Solutions`,
        estimatedVolume: 'alto'
      });
    }

    // Páginas por Estado (apenas se não tiver cidades selecionadas desse estado)
    for (const stateUf of form.selectedStates) {
      const stateName = BRAZILIAN_STATES.find(s => s.uf === stateUf)?.name || stateUf;
      const hasCitiesFromState = form.selectedCities.some(c => 
        BRAZILIAN_CITIES[stateUf]?.includes(c.city)
      );
      
      if (!hasCitiesFromState) {
        pages.push({
          level: 'STATE',
          state: stateName,
          slug: `/${serviceSlug}-${normalizeString(stateName)}`,
          title: `${form.serviceType} em ${stateName} | M3Solutions`,
          estimatedVolume: ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'SC'].includes(stateUf) ? 'alto' : 'medio'
        });
      }
    }

    // Páginas por Cidade
    for (const { state, city } of form.selectedCities) {
      const isCapital = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre', 'Salvador', 'Brasília', 'Fortaleza', 'Recife', 'Goiânia'].includes(city);
      pages.push({
        level: 'CITY',
        state,
        city,
        slug: `/${serviceSlug}-${normalizeString(city)}`,
        title: `${form.serviceType} em ${city} | M3Solutions`,
        estimatedVolume: isCapital ? 'alto' : 'medio'
      });
    }

    return pages;
  }, [form.serviceType, form.createGlobalPage, form.selectedStates, form.selectedCities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleState = (stateUf: string) => {
    setForm(prev => {
      const newStates = prev.selectedStates.includes(stateUf)
        ? prev.selectedStates.filter(s => s !== stateUf)
        : [...prev.selectedStates, stateUf];
      
      const newCities = prev.selectedCities.filter(c => {
        const cityStateUf = BRAZILIAN_STATES.find(s => s.name === c.state)?.uf;
        return cityStateUf ? newStates.includes(cityStateUf) : false;
      });

      return { ...prev, selectedStates: newStates, selectedCities: newCities };
    });
  };

  const toggleCity = (stateUf: string, city: string) => {
    const stateName = BRAZILIAN_STATES.find(s => s.uf === stateUf)?.name || stateUf;
    setForm(prev => {
      const exists = prev.selectedCities.some(c => c.city === city && c.state === stateName);
      const newCities = exists
        ? prev.selectedCities.filter(c => !(c.city === city && c.state === stateName))
        : [...prev.selectedCities, { state: stateName, city }];
      return { ...prev, selectedCities: newCities };
    });
  };

  const selectAllCitiesFromState = (stateUf: string) => {
    const stateName = BRAZILIAN_STATES.find(s => s.uf === stateUf)?.name || stateUf;
    const stateCities = BRAZILIAN_CITIES[stateUf] || [];
    setForm(prev => {
      const existingOtherCities = prev.selectedCities.filter(c => c.state !== stateName);
      const newCities = stateCities.map(city => ({ state: stateName, city }));
      return { ...prev, selectedCities: [...existingOtherCities, ...newCities] };
    });
  };

  const clearAllCitiesFromState = (stateUf: string) => {
    const stateName = BRAZILIAN_STATES.find(s => s.uf === stateUf)?.name || stateUf;
    setForm(prev => ({
      ...prev,
      selectedCities: prev.selectedCities.filter(c => c.state !== stateName)
    }));
  };

  // Buscar sugestão de IA
  const fetchAiSuggestion = async () => {
    if (!form.serviceType || !form.attendanceType || !form.pageObjective) {
      alert('Preencha o serviço, tipo de atendimento e objetivo primeiro.');
      return;
    }

    setLoadingSuggestion(true);
    try {
      const res = await fetch('/api/gestor/ai-suggest-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: form.serviceType,
          attendanceType: form.attendanceType,
          pageObjective: form.pageObjective,
          brand: form.brand
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error('Error fetching AI suggestion:', error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  // Aplicar sugestão de IA
  const applySuggestion = () => {
    if (!aiSuggestion) return;

    setForm(prev => ({
      ...prev,
      createGlobalPage: aiSuggestion.createGlobal,
      selectedStates: aiSuggestion.states,
      selectedCities: aiSuggestion.cities.map(c => ({
        state: BRAZILIAN_STATES.find(s => s.uf === c.state)?.name || c.state,
        city: c.city
      }))
    }));

    setAiSuggestion(null);
  };

    // Helper function to clean empty string values
  const cleanValue = (value: string | undefined): string | null | undefined => {
    if (value === '' || value === undefined) return null;
    return value;
  };

  const handleCreatePages = async () => {
    if (!form.serviceType.trim()) {
      alert("Produto/Serviço é obrigatório");
      return;
    }
    if (!form.attendanceType) {
      alert("Tipo de atendimento é obrigatório");
      return;
    }
    if (!form.pageObjective) {
      alert("Objetivo da página é obrigatório");
      return;
    }
    if (pagesToCreate.length === 0) {
      alert("Selecione ao menos uma segmentação ou mantenha a página global");
      return;
    }

    // Determinar CTA
    const selectedCta = ctaTemplates.find(c => c.id === form.selectedCtaId);
    const ctaText = form.customCta || selectedCta?.buttonText || 'Solicitar Orçamento';

    setLoading(true);
    setGenerating(true);
    const totalPages = pagesToCreate.length + selectedSuggestions.length;
    
    // Dividir páginas em lotes de 30
    const BATCH_SIZE = 30;
    const BATCH_DELAY_MS = 2000; // Delay de 2s entre lotes
    const pageBatches: PageToCreate[][] = [];
    for (let i = 0; i < pagesToCreate.length; i += BATCH_SIZE) {
      pageBatches.push(pagesToCreate.slice(i, i + BATCH_SIZE));
    }
    const totalBatches = pageBatches.length;
    
    setGenerationProgress({ 
      current: 0, 
      total: totalPages, 
      currentPage: '', 
      errors: [],
      currentBatch: 1,
      totalBatches: totalBatches,
      batchStatus: 'Iniciando...'
    });

    const results: { success: boolean; page: string; error?: string }[] = [];
    const MAX_CREATE_PARALLEL = 4; // Criar 4 briefings em paralelo
    const MAX_GENERATE_PARALLEL = 2; // Gerar 2 conteúdos em paralelo (API de IA tem limite)
    const GENERATE_DELAY_MS = 1000; // Delay de 1s entre lotes de geração

    // Processar cada lote de páginas sequencialmente
    for (let batchIndex = 0; batchIndex < pageBatches.length; batchIndex++) {
      const batch = pageBatches[batchIndex];
      const batchNum = batchIndex + 1;
      
      setGenerationProgress(prev => prev ? { 
        ...prev, 
        currentBatch: batchNum,
        batchStatus: `Processando lote ${batchNum} de ${totalBatches} (${batch.length} páginas)...`
      } : null);

      // Fase 1: Criar todos os briefings do lote em paralelo
      const createdPosts: Array<{ page: PageToCreate; postId: string }> = [];
      
      for (let i = 0; i < batch.length; i += MAX_CREATE_PARALLEL) {
        const chunk = batch.slice(i, i + MAX_CREATE_PARALLEL);
        
        const createPromises = chunk.map(async (page, idx) => {
          try {
            const res = await fetch("/api/gestor/posts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                serviceType: form.serviceType,
                categoryId: cleanValue(form.categoryId),
                authorId: cleanValue(form.authorId),
                tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
                brand: form.brand || undefined,
                attendanceType: form.attendanceType,
                pageObjective: form.pageObjective,
                mainKeyword: form.mainKeyword || form.serviceType,
                secondaryKeywords: form.secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean),
                geoCountry: form.geoCountry,
                geoState: page.state || '',
                geoCity: page.city || '',
                briefTitle: page.title,
                briefCta: ctaText,
                seoLevel: page.level,
                seoLevelJustification: `Página ${page.level === 'GLOBAL' ? 'global' : page.level === 'STATE' ? 'estadual' : 'municipal'} para SEO local`,
                seoRecommendedUrl: page.slug
              })
            });

            if (!res.ok) {
              const error = await res.json();
              return { success: false, page: page.title, error: error.error, postId: null };
            }

            const post = await res.json();
            setGenerationProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
            return { success: true, page: page.title, postId: post.id };
          } catch (error: any) {
            setGenerationProgress(prev => prev ? { 
              ...prev, 
              current: prev.current + 1,
              errors: [...prev.errors, `${page.title} (create): ${error.message}`] 
            } : null);
            return { success: false, page: page.title, error: error.message, postId: null };
          }
        });

        const createResults = await Promise.allSettled(createPromises);
        createResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            const res = result.value;
            if (res.success && res.postId) {
              createdPosts.push({ page: chunk[idx], postId: res.postId });
            } else {
              results.push({ success: false, page: res.page, error: res.error });
            }
          } else {
            results.push({ success: false, page: 'Unknown', error: result.reason });
          }
        });
      }

      // Fase 2: Gerar conteúdo do lote com delay para respeitar rate limit da API de IA
      setGenerationProgress(prev => prev ? { 
        ...prev, 
        batchStatus: `Gerando conteúdo IA para lote ${batchNum} de ${totalBatches}...`
      } : null);

      for (let i = 0; i < createdPosts.length; i += MAX_GENERATE_PARALLEL) {
        // Aguardar antes de processar próximo lote (evita rate limit)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, GENERATE_DELAY_MS));
        }

        const chunk = createdPosts.slice(i, i + MAX_GENERATE_PARALLEL);
        
        const generatePromises = chunk.map(async ({ page, postId }) => {
          try {
            const genRes = await fetch(`/api/gestor/posts/${postId}/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ skipImage: true })
            });

            if (!genRes.ok) {
              const errorData = await genRes.json();
              setGenerationProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
              return { success: false, page: page.title, error: errorData.error || 'Erro na geração de conteúdo' };
            }

            setGenerationProgress(prev => prev ? { ...prev, current: prev.current + 1, currentPage: page.title } : null);
            return { success: true, page: page.title };
          } catch (error: any) {
            setGenerationProgress(prev => prev ? { 
              ...prev, 
              current: prev.current + 1,
              errors: [...prev.errors, `${page.title} (generate): ${error.message}`] 
            } : null);
            return { success: false, page: page.title, error: error.message };
          }
        });

        const generateResults = await Promise.allSettled(generatePromises);
        generateResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({ success: false, page: 'Unknown', error: result.reason });
          }
        });
      }

      // Aguardar entre lotes (para evitar sobrecarga)
      if (batchIndex < pageBatches.length - 1) {
        setGenerationProgress(prev => prev ? { 
          ...prev, 
          batchStatus: `Lote ${batchNum} concluído. Aguardando 2s antes do próximo lote...`
        } : null);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Criar páginas de sugestões selecionadas (Comparativo, Guia, Cases, Erros Comuns)
    if (selectedSuggestions.length > 0) {
      const suggestionConfigs: Record<string, { title: string; objective: string; keywords: string }> = {
        "comparativo": {
          title: `${form.serviceType} vs Concorrentes: Comparativo Completo`,
          objective: "TRAFFIC",
          keywords: `${form.serviceType} comparativo, melhor ${form.serviceType.toLowerCase()}, comparação ${form.serviceType.toLowerCase()}`
        },
        "guia": {
          title: `Como Escolher ${form.serviceType}: Guia Completo`,
          objective: "AUTHORITY",
          keywords: `como escolher ${form.serviceType.toLowerCase()}, guia ${form.serviceType.toLowerCase()}, o que avaliar ${form.serviceType.toLowerCase()}`
        },
        "cases": {
          title: `Casos de Sucesso: ${form.serviceType} na Prática`,
          objective: "CONVERSION",
          keywords: `cases ${form.serviceType.toLowerCase()}, casos de sucesso ${form.serviceType.toLowerCase()}, resultados ${form.serviceType.toLowerCase()}`
        },
        "erros": {
          title: `Erros ao Contratar ${form.serviceType}: O Que Evitar`,
          objective: "TRAFFIC",
          keywords: `erros ${form.serviceType.toLowerCase()}, problemas ${form.serviceType.toLowerCase()}, o que evitar ${form.serviceType.toLowerCase()}`
        }
      };

      setGenerationProgress(prev => prev ? { 
        ...prev, 
        batchStatus: `Processando ${selectedSuggestions.length} páginas de sugestão IA...`,
        currentBatch: totalBatches + 1,
        totalBatches: totalBatches + 1
      } : null);

      // Fase 1: Criar todas as sugestões em paralelo
      const createdSuggestions: Array<{ suggestionId: string; config: any; postId: string }> = [];
      
      for (let i = 0; i < selectedSuggestions.length; i += MAX_CREATE_PARALLEL) {
        const chunk = selectedSuggestions.slice(i, i + MAX_CREATE_PARALLEL);
        
        const createPromises = chunk.map(async (suggestionId) => {
          const config = suggestionConfigs[suggestionId];
          if (!config) return { success: false, suggestionId, error: 'Configuração não encontrada', postId: null };

          const slug = normalizeString(config.title);
          
          try {
            const res = await fetch("/api/gestor/posts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                serviceType: form.serviceType,
                categoryId: cleanValue(form.categoryId),
                authorId: cleanValue(form.authorId),
                tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
                brand: form.brand || undefined,
                attendanceType: form.attendanceType,
                pageObjective: config.objective,
                mainKeyword: form.serviceType,
                secondaryKeywords: config.keywords.split(',').map(k => k.trim()),
                geoCountry: form.geoCountry,
                geoState: '',
                geoCity: '',
                briefTitle: config.title,
                briefCta: ctaText,
                seoLevel: 'GLOBAL',
                seoLevelJustification: `Página de conteúdo complementar: ${suggestionId}`,
                seoRecommendedUrl: slug
              })
            });

            if (!res.ok) {
              const error = await res.json();
              return { success: false, suggestionId, error: error.error, postId: null };
            }

            const post = await res.json();
            setGenerationProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
            return { success: true, suggestionId, postId: post.id };
          } catch (error: any) {
            setGenerationProgress(prev => prev ? { 
              ...prev, 
              current: prev.current + 1,
              errors: [...prev.errors, `${config.title} (create): ${error.message}`] 
            } : null);
            return { success: false, suggestionId, error: error.message, postId: null };
          }
        });

        const createResults = await Promise.allSettled(createPromises);
        createResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            const res = result.value;
            if (res.success && res.postId) {
              createdSuggestions.push({ 
                suggestionId: res.suggestionId, 
                config: suggestionConfigs[res.suggestionId],
                postId: res.postId 
              });
            } else {
              results.push({ success: false, page: suggestionConfigs[res.suggestionId]?.title || 'Unknown', error: res.error });
            }
          } else {
            results.push({ success: false, page: 'Unknown', error: result.reason });
          }
        });
      }

      // Fase 2: Gerar conteúdo das sugestões com delay
      setGenerationProgress(prev => prev ? { 
        ...prev, 
        batchStatus: `Gerando conteúdo IA para páginas de sugestão...`
      } : null);

      for (let i = 0; i < createdSuggestions.length; i += MAX_GENERATE_PARALLEL) {
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, GENERATE_DELAY_MS));
        }

        const chunk = createdSuggestions.slice(i, i + MAX_GENERATE_PARALLEL);
        
        const generatePromises = chunk.map(async ({ config, postId }) => {
          try {
            const genRes = await fetch(`/api/gestor/posts/${postId}/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ skipImage: true })
            });

            if (!genRes.ok) {
              const errorData = await genRes.json();
              setGenerationProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
              return { success: false, page: config.title, error: errorData.error || 'Erro na geração de conteúdo' };
            }

            setGenerationProgress(prev => prev ? { ...prev, current: prev.current + 1, currentPage: config.title } : null);
            return { success: true, page: config.title };
          } catch (error: any) {
            setGenerationProgress(prev => prev ? { 
              ...prev, 
              current: prev.current + 1,
              errors: [...prev.errors, `${config.title} (generate): ${error.message}`] 
            } : null);
            return { success: false, page: config.title, error: error.message };
          }
        });

        const generateResults = await Promise.allSettled(generatePromises);
        generateResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({ success: false, page: 'Unknown', error: result.reason });
          }
        });
      }
    }

    setLoading(false);
    setGenerating(false);
    setGenerationProgress(null);

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    // Disparar geração de imagens em background automaticamente
    if (successCount > 0) {
      try {
        await fetch("/api/gestor/posts/generate-images-batch", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ useAI: false }) // Fallback rápido por padrão
        });
        console.log("[IMAGES] Geração de imagens em background disparada");
      } catch (e) {
        console.warn("[IMAGES] Erro ao disparar geração de imagens:", e);
      }
    }

    if (failedCount === 0) {
      alert(`✅ ${successCount} página(s) criada(s) com sucesso!\n\n🖼️ Geração de imagens iniciada em background.`);
      router.push('/gestor/posts');
    } else {
      alert(`⚠️ ${successCount} sucesso(s), ${failedCount} erro(s)\n\n🖼️ Geração de imagens iniciada em background.\n\nErros:\n${results.filter(r => !r.success).map(r => `- ${r.page}: ${r.error}`).join('\n')}`);
    }
  };

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case 'alto': return 'text-green-600 bg-green-50';
      case 'medio': return 'text-yellow-600 bg-yellow-50';
      case 'baixo': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/gestor/posts" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar Páginas SEO Local</h1>
          <p className="text-gray-500">Crie múltiplas páginas otimizadas com sugestão de IA</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seção 1: Produto/Serviço */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="text-purple-600" size={20} />
              Produto / Serviço
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Produto ou Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="Ex: Antivírus Corporativo, Gestão de TI, Cloud Computing"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  >
                    <option value="">Selecione...</option>
                    {authors.map((author) => (
                      <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca (opcional)</label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="Ex: Bitdefender, Microsoft"
                  />
                </div>
              </div>

              {/* Tags da Categoria */}
              {categoryTags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag size={16} className="text-purple-600" />
                    Tags da categoria selecionada
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categoryTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setSelectedTagIds(prev => 
                            prev.includes(tag.id) 
                              ? prev.filter(id => id !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${
                          selectedTagIds.includes(tag.id)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag.name}
                        {selectedTagIds.includes(tag.id) && (
                          <span className="ml-1">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedTagIds.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedTagIds.length} tag(s) selecionada(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Seção 2: Segmentação */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="text-orange-600" size={20} />
              Segmentação
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipo de Atendimento <span className="text-red-500">*</span>
                </label>
                <select
                  name="attendanceType"
                  value={form.attendanceType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <option value="">Selecione...</option>
                  <option value="REMOTE">Remoto (100% online)</option>
                  <option value="LOCAL">Presencial</option>
                  <option value="HYBRID">Híbrido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Objetivo <span className="text-red-500">*</span>
                </label>
                <select
                  name="pageObjective"
                  value={form.pageObjective}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                >
                  <option value="">Selecione...</option>
                  <option value="AUTHORITY">Autoridade</option>
                  <option value="TRAFFIC">Tráfego</option>
                  <option value="CONVERSION">Conversão</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 3: Segmentação Geográfica com IA */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="text-green-600" size={20} />
                Segmentação Geográfica
              </h2>
              <button
                onClick={fetchAiSuggestion}
                disabled={loadingSuggestion || !form.serviceType || !form.attendanceType || !form.pageObjective}
                className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSuggestion ? (
                  <><Loader2 size={16} className="animate-spin" /> Analisando...</>
                ) : (
                  <><Lightbulb size={16} /> Sugestão IA</>
                )}
              </button>
            </div>

            {/* Sugestão de IA */}
            {aiSuggestion && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-blue-900 flex items-center gap-2">
                      <Zap className="text-yellow-500" size={18} />
                      Recomendação de IA
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">{aiSuggestion.recommendation}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-blue-600">
                        {aiSuggestion.estimatedPages} páginas
                      </span>
                      <span className="text-xs bg-white px-2 py-1 rounded-full text-green-600">
                        {aiSuggestion.estimatedMonthlySearches} buscas/mês
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applySuggestion}
                      className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                {aiSuggestion.cities.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-600 mb-2">Cidades sugeridas:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiSuggestion.cities.slice(0, 8).map((c, i) => (
                        <span key={i} className="text-xs bg-white px-2 py-1 rounded text-gray-700">
                          {c.city} ({c.state})
                        </span>
                      ))}
                      {aiSuggestion.cities.length > 8 && (
                        <span className="text-xs text-blue-500">+{aiSuggestion.cities.length - 8} mais</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Checkbox página global */}
              <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition">
                <input
                  type="checkbox"
                  checked={form.createGlobalPage}
                  onChange={(e) => setForm(prev => ({ ...prev, createGlobalPage: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-blue-900">Página global (sem segmentação)</span>
                  <p className="text-xs text-blue-600">Página principal do serviço</p>
                </div>
              </label>

              {/* Seleção de Estados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estados</label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl max-h-24 overflow-y-auto">
                  {BRAZILIAN_STATES.map((state) => (
                    <button
                      key={state.uf}
                      type="button"
                      onClick={() => toggleState(state.uf)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        form.selectedStates.includes(state.uf)
                          ? 'bg-green-600 text-white'
                          : 'bg-white border border-gray-200 hover:border-green-400'
                      }`}
                    >
                      {state.uf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleção de Cidades */}
              {form.selectedStates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Cidades</label>
                    <span className="text-xs text-gray-400">{form.selectedCities.length} selecionada(s)</span>
                  </div>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                      placeholder="Buscar cidade..."
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.selectedStates.map(stateUf => (
                      <div key={stateUf} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                        <span className="text-xs font-medium">{stateUf}</span>
                        <button
                          type="button"
                          onClick={() => selectAllCitiesFromState(stateUf)}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Todas
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => clearAllCitiesFromState(stateUf)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Limpar
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl max-h-40 overflow-y-auto">
                    {filteredCities.map(({ state, stateUf, city }) => {
                      const isSelected = form.selectedCities.some(c => c.city === city && c.state === state);
                      return (
                        <button
                          key={`${stateUf}-${city}`}
                          type="button"
                          onClick={() => toggleCity(stateUf, city)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                            isSelected
                              ? 'bg-green-600 text-white'
                              : 'bg-white border border-gray-200 hover:border-green-400'
                          }`}
                        >
                          {city} <span className="opacity-60">({stateUf})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção 4: CTA */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              CTA (Call to Action)
            </h2>
            
            <div className="space-y-4">
              {ctaTemplates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modelo de CTA</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {ctaTemplates.map(cta => (
                      <button
                        key={cta.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, selectedCtaId: cta.id, customCta: cta.buttonText }))}
                        className={`p-3 rounded-lg text-left transition border ${
                          form.selectedCtaId === cta.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <span className="block text-sm font-medium">{cta.name}</span>
                        <span className="text-xs text-gray-500">{cta.buttonText}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Personalizado</label>
                <input
                  type="text"
                  name="customCta"
                  value={form.customCta}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  placeholder="Solicitar Orçamento"
                />
              </div>

              {/* Visualização do CTA */}
              {form.selectedCtaId && (() => {
                const selectedCta = ctaTemplates.find(c => c.id === form.selectedCtaId);
                if (!selectedCta) return null;
                return (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pré-visualização</label>
                    <div 
                      className="rounded-xl p-6 text-center"
                      style={{ backgroundColor: selectedCta.color + '15', borderColor: selectedCta.color, borderWidth: '1px' }}
                    >
                      <p className="text-gray-800 font-medium mb-3">{selectedCta.text}</p>
                      <button
                        type="button"
                        className="px-6 py-3 rounded-lg text-white font-medium shadow-lg hover:opacity-90 transition"
                        style={{ backgroundColor: selectedCta.color }}
                      >
                        {form.customCta || selectedCta.buttonText}
                      </button>
                      {selectedCta.whatsappText && (
                        <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.79 23.528l4.626-1.471A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.17 0-4.206-.58-5.965-1.587l-.428-.25-2.745.873.91-2.67-.277-.44A9.798 9.798 0 012.182 12c0-5.428 4.39-9.818 9.818-9.818 5.428 0 9.818 4.39 9.818 9.818 0 5.428-4.39 9.818-9.818 9.818z"/></svg>
                          WhatsApp: {selectedCta.whatsappText.substring(0, 40)}...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              <Link
                href="/gestor/configuracoes"
                className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
              >
                <Sparkles size={14} /> Gerenciar CTAs e Formulários
              </Link>
            </div>
          </div>

          {/* Botão de Ação */}
          <button
            onClick={handleCreatePages}
            disabled={loading || pagesToCreate.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {generating ? (
              <><Loader2 size={20} className="animate-spin" /> Gerando {generationProgress?.current}/{generationProgress?.total}...</>
            ) : (
              <><Sparkles size={20} /> Criar {pagesToCreate.length + selectedSuggestions.length} Página(s) com IA</>
            )}
          </button>

          {/* Seção 5: Sugestões de Novas Páginas */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="text-amber-600" size={20} />
                Sugestões de Novas Páginas
              </h2>
              {form.serviceType && selectedSuggestions.length > 0 && (
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                  {selectedSuggestions.length} selecionada(s)
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Selecione as páginas complementares que deseja criar para ampliar sua presença online:
            </p>

            <div className="space-y-3">
              {/* Sugestões dinâmicas baseadas no tipo de serviço */}
              {form.serviceType && (
                <>
                  {[
                    { id: "comparativo", icon: FileText, iconBg: "bg-blue-100", iconColor: "text-blue-600", title: "Comparativo de Mercado", desc: `"${form.serviceType} vs concorrentes" - Alto potencial de tráfego orgânico`, badge: "Recomendado", badgeBg: "bg-green-100 text-green-700" },
                    { id: "guia", icon: Target, iconBg: "bg-purple-100", iconColor: "text-purple-600", title: "Guia Completo", desc: `"Como escolher ${form.serviceType.toLowerCase()}" - Conteúdo educacional de autoridade`, badge: "SEO", badgeBg: "bg-blue-100 text-blue-700" },
                    { id: "cases", icon: TrendingUp, iconBg: "bg-green-100", iconColor: "text-green-600", title: "Casos de Sucesso", desc: `"Cases de ${form.serviceType.toLowerCase()}" - Prova social e conversão`, badge: "Conversão", badgeBg: "bg-amber-100 text-amber-700" },
                    { id: "erros", icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600", title: "Erros Comuns", desc: `"Erros ao contratar ${form.serviceType.toLowerCase()}" - Atrai pesquisas específicas`, badge: "Long-tail", badgeBg: "bg-purple-100 text-purple-700" },
                  ].map((suggestion) => {
                    const Icon = suggestion.icon;
                    const isSelected = selectedSuggestions.includes(suggestion.id);
                    return (
                      <label
                        key={suggestion.id}
                        className={`block bg-white/70 rounded-lg p-3 border cursor-pointer transition-all ${
                          isSelected 
                            ? "border-amber-400 ring-2 ring-amber-200" 
                            : "border-amber-100 hover:border-amber-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSuggestions([...selectedSuggestions, suggestion.id]);
                              } else {
                                setSelectedSuggestions(selectedSuggestions.filter(s => s !== suggestion.id));
                              }
                            }}
                            className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                          />
                          <div className={`p-1.5 ${suggestion.iconBg} rounded-lg`}>
                            <Icon size={16} className={suggestion.iconColor} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{suggestion.desc}</p>
                          </div>
                          <span className={`text-xs ${suggestion.badgeBg} px-2 py-0.5 rounded-full`}>{suggestion.badge}</span>
                        </div>
                      </label>
                    );
                  })}
                </>
              )}

              {!form.serviceType && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <Lightbulb size={24} className="mx-auto mb-2 opacity-50" />
                  Preencha o tipo de serviço para ver sugestões personalizadas
                </div>
              )}
            </div>

            {form.serviceType && (
              <div className="mt-4 pt-4 border-t border-amber-200 flex items-center justify-between">
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <Info size={12} />
                  Crie essas páginas para formar um cluster de conteúdo.
                </p>
                {selectedSuggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSuggestions([])}
                    className="text-xs text-amber-600 hover:text-amber-800 underline"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Layers size={18} className="text-purple-600" />
                Páginas ({pagesToCreate.length + selectedSuggestions.length})
              </h3>

              {pagesToCreate.length === 0 && selectedSuggestions.length === 0 ? (
                <p className="text-sm text-gray-500">Preencha o serviço e selecione a segmentação.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* Páginas geográficas */}
                  {pagesToCreate.map((page, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {page.level === 'GLOBAL' && <Globe size={14} className="text-blue-600" />}
                            {page.level === 'STATE' && <Building2 size={14} className="text-yellow-600" />}
                            {page.level === 'CITY' && <MapPin size={14} className="text-green-600" />}
                            <span className="text-xs font-medium text-gray-500">
                              {page.level === 'GLOBAL' ? 'Global' : page.level === 'STATE' ? page.state : page.city}
                            </span>
                          </div>
                          <code className="text-xs text-purple-700 font-mono block truncate">
                            {page.slug}
                          </code>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${getVolumeColor(page.estimatedVolume)}`}>
                          <TrendingUp size={12} />
                          {page.estimatedVolume === 'alto' ? 'Alto' : 'Médio'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Páginas de sugestões selecionadas */}
                  {selectedSuggestions.map((suggestionId) => {
                    const suggestionLabels: Record<string, { title: string; icon: string; color: string }> = {
                      comparativo: { title: 'Comparativo de Mercado', icon: '📊', color: 'bg-blue-50 border-blue-200' },
                      guia: { title: 'Guia Completo', icon: '📚', color: 'bg-purple-50 border-purple-200' },
                      cases: { title: 'Casos de Sucesso', icon: '🏆', color: 'bg-green-50 border-green-200' },
                      erros: { title: 'Erros Comuns', icon: '⚠️', color: 'bg-red-50 border-red-200' }
                    };
                    const config = suggestionLabels[suggestionId];
                    if (!config) return null;
                    
                    return (
                      <div key={suggestionId} className={`p-3 rounded-lg border ${config.color}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-amber-700">Complementar</span>
                            <p className="text-xs text-gray-700 truncate">{config.title}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Info size={16} />
                Dica
              </h4>
              <p className="text-xs text-blue-700">
                Use o botão "Sugestão IA" para receber recomendações inteligentes de localizações baseadas no volume de pesquisa estimado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Progresso */}
      {generationProgress && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Gerando Páginas...</h3>
              
              {/* Indicador de Lote */}
              {generationProgress.totalBatches && generationProgress.totalBatches > 1 && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-700">
                    Lote {generationProgress.currentBatch} de {generationProgress.totalBatches}
                  </p>
                  <p className="text-xs text-blue-600 truncate mt-1">
                    {generationProgress.batchStatus}
                  </p>
                </div>
              )}
              
              <p className="text-gray-500 mb-4">
                {generationProgress.current} de {generationProgress.total}
              </p>
              <div className="bg-gray-100 rounded-full h-2 mb-3">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 truncate">
                {generationProgress.currentPage}
              </p>
              {generationProgress.errors.length > 0 && (
                <div className="mt-4 text-left bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">Erros:</p>
                  {generationProgress.errors.slice(-3).map((err, i) => (
                    <p key={i} className="text-xs text-red-500 truncate">{err}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
