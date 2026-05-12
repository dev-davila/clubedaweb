"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Palette,
  Layout,
  FileText,
  Wand2,
  Loader2,
  Download,
  Copy,
  Sparkles,
  Globe,
  Target,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Type,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BriefingData {
  // Etapa 1: Informações da Empresa
  companyName: string;
  industry: string;
  companyDescription: string;
  targetAudience: string;
  competitors: string;
  differentials: string;
  
  // Etapa 2: Identidade Visual
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  brandTone: string;
  visualStyle: string;
  
  // Etapa 3: Estrutura do Site
  siteType: string;
  mainPages: string[];
  features: string[];
  hasEcommerce: boolean;
  hasBlog: boolean;
  hasPortfolio: boolean;
  
  // Etapa 4: Conteúdo
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  aboutContent: string;
  servicesDescription: string;
  contactInfo: string;
}

const INITIAL_DATA: BriefingData = {
  companyName: "",
  industry: "",
  companyDescription: "",
  targetAudience: "",
  competitors: "",
  differentials: "",
  primaryColor: "#7c3aed",
  secondaryColor: "#1f2937",
  accentColor: "#10b981",
  logoUrl: "",
  brandTone: "profissional",
  visualStyle: "moderno",
  siteType: "institucional",
  mainPages: ["home", "sobre", "servicos", "contato"],
  features: [],
  hasEcommerce: false,
  hasBlog: true,
  hasPortfolio: false,
  heroTitle: "",
  heroSubtitle: "",
  ctaText: "",
  aboutContent: "",
  servicesDescription: "",
  contactInfo: ""
};

const STEPS = [
  { id: 1, title: "Empresa", icon: Building2, description: "Informações básicas" },
  { id: 2, title: "Identidade", icon: Palette, description: "Visual e marca" },
  { id: 3, title: "Estrutura", icon: Layout, description: "Páginas e recursos" },
  { id: 4, title: "Conteúdo", icon: FileText, description: "Textos principais" },
  { id: 5, title: "Gerar", icon: Wand2, description: "IA criar briefing" }
];

const INDUSTRIES = [
  "Tecnologia", "Saúde", "Educação", "Varejo", "Serviços", "Indústria",
  "Finanças", "Imobiliário", "Alimentação", "Moda", "Automotivo", "Outro"
];

const BRAND_TONES = [
  { value: "profissional", label: "Profissional", desc: "Sério e confiável" },
  { value: "amigavel", label: "Amigável", desc: "Acessível e acolhedor" },
  { value: "inovador", label: "Inovador", desc: "Moderno e ousado" },
  { value: "sofisticado", label: "Sofisticado", desc: "Elegante e premium" },
  { value: "divertido", label: "Divertido", desc: "Descontraído e criativo" }
];

const VISUAL_STYLES = [
  { value: "moderno", label: "Moderno", desc: "Clean e minimalista" },
  { value: "corporativo", label: "Corporativo", desc: "Tradicional e sólido" },
  { value: "criativo", label: "Criativo", desc: "Artístico e único" },
  { value: "tecnologico", label: "Tecnológico", desc: "Futurista e digital" },
  { value: "organico", label: "Orgânico", desc: "Natural e sustentável" }
];

const SITE_TYPES = [
  { value: "institucional", label: "Institucional", desc: "Apresentação da empresa" },
  { value: "landing", label: "Landing Page", desc: "Página de conversão" },
  { value: "ecommerce", label: "E-commerce", desc: "Loja virtual" },
  { value: "portfolio", label: "Portfólio", desc: "Showcase de trabalhos" },
  { value: "blog", label: "Blog/Notícias", desc: "Conteúdo editorial" },
  { value: "saas", label: "SaaS", desc: "Produto digital" }
];

const FEATURES = [
  { value: "chat", label: "Chat ao vivo" },
  { value: "newsletter", label: "Newsletter" },
  { value: "formularios", label: "Formulários avançados" },
  { value: "integracao-crm", label: "Integração CRM" },
  { value: "analytics", label: "Analytics" },
  { value: "seo", label: "SEO avançado" },
  { value: "multilingual", label: "Multi-idiomas" },
  { value: "area-cliente", label: "Área do cliente" },
  { value: "agendamento", label: "Agendamento online" },
  { value: "pagamentos", label: "Pagamentos online" }
];

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<BriefingData>(INITIAL_DATA);
  const [generating, setGenerating] = useState(false);
  const [generatedBriefing, setGeneratedBriefing] = useState<string | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState<string | null>(null);

  const updateData = (field: keyof BriefingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (feature: string) => {
    setData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const togglePage = (page: string) => {
    setData(prev => ({
      ...prev,
      mainPages: prev.mainPages.includes(page)
        ? prev.mainPages.filter(p => p !== page)
        : [...prev.mainPages, page]
    }));
  };

  const suggestWithAI = async (field: keyof BriefingData, prompt: string) => {
    setAiSuggesting(field);
    try {
      const res = await fetch("/api/gestor/ai/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Com base nas informações da empresa "${data.companyName}" do setor "${data.industry}", ${prompt}. Retorne apenas o texto sugerido, sem explicações.`,
          context: JSON.stringify(data)
        })
      });
      const result = await res.json();
      if (result.suggestions?.[0]) {
        updateData(field, result.suggestions[0]);
        toast.success("Sugestão gerada!");
      }
    } catch (error) {
      toast.error("Erro ao gerar sugestão");
    } finally {
      setAiSuggesting(null);
    }
  };

  const generateBriefing = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/gestor/wizard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.briefing) {
        setGeneratedBriefing(result.briefing);
        toast.success("Briefing gerado com sucesso!");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error("Erro ao gerar briefing");
    } finally {
      setGenerating(false);
    }
  };

  const copyBriefing = () => {
    if (generatedBriefing) {
      navigator.clipboard.writeText(generatedBriefing);
      toast.success("Briefing copiado!");
    }
  };

  const downloadBriefing = () => {
    if (generatedBriefing) {
      const blob = new Blob([generatedBriefing], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `briefing-${data.companyName.toLowerCase().replace(/\s+/g, "-")}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={data.companyName}
                  onChange={(e) => updateData("companyName", e.target.value)}
                  placeholder="Ex: M3Solutions"
                />
              </div>
              <div className="space-y-2">
                <Label>Setor/Indústria *</Label>
                <select
                  value={data.industry}
                  onChange={(e) => updateData("industry", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione...</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descrição da Empresa *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => suggestWithAI("companyDescription", "gere uma descrição profissional de 2-3 parágrafos")}
                  disabled={aiSuggesting === "companyDescription" || !data.companyName}
                >
                  {aiSuggesting === "companyDescription" ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={14} className="mr-1" />
                  )}
                  Sugerir com IA
                </Button>
              </div>
              <Textarea
                value={data.companyDescription}
                onChange={(e) => updateData("companyDescription", e.target.value)}
                placeholder="Descreva a empresa, história, missão..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Público-Alvo</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => suggestWithAI("targetAudience", "descreva o público-alvo ideal")}
                  disabled={aiSuggesting === "targetAudience" || !data.companyName}
                >
                  {aiSuggesting === "targetAudience" ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={14} className="mr-1" />
                  )}
                  Sugerir
                </Button>
              </div>
              <Textarea
                value={data.targetAudience}
                onChange={(e) => updateData("targetAudience", e.target.value)}
                placeholder="Quem são os clientes ideais?"
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Principais Concorrentes</Label>
                <Textarea
                  value={data.competitors}
                  onChange={(e) => updateData("competitors", e.target.value)}
                  placeholder="Liste os principais concorrentes..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Diferenciais</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => suggestWithAI("differentials", "liste 4-5 diferenciais competitivos")}
                    disabled={aiSuggesting === "differentials" || !data.companyName}
                  >
                    {aiSuggesting === "differentials" ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Sugerir
                  </Button>
                </div>
                <Textarea
                  value={data.differentials}
                  onChange={(e) => updateData("differentials", e.target.value)}
                  placeholder="O que diferencia a empresa?"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={data.primaryColor}
                    onChange={(e) => updateData("primaryColor", e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={data.primaryColor}
                    onChange={(e) => updateData("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor Secundária</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={data.secondaryColor}
                    onChange={(e) => updateData("secondaryColor", e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={data.secondaryColor}
                    onChange={(e) => updateData("secondaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cor de Destaque</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={data.accentColor}
                    onChange={(e) => updateData("accentColor", e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={data.accentColor}
                    onChange={(e) => updateData("accentColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Preview de cores */}
            <div className="p-6 rounded-xl border">
              <p className="text-sm text-gray-500 mb-3">Preview das cores:</p>
              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: data.primaryColor }}
                >
                  Primária
                </div>
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: data.secondaryColor }}
                >
                  Secundária
                </div>
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: data.accentColor }}
                >
                  Destaque
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL do Logo</Label>
              <Input
                value={data.logoUrl}
                onChange={(e) => updateData("logoUrl", e.target.value)}
                placeholder="https://i.pinimg.com/736x/19/63/c8/1963c80b8983da5f3be640ca7473b098.jpg"
              />
            </div>

            <div className="space-y-3">
              <Label>Tom da Marca</Label>
              <div className="grid md:grid-cols-5 gap-3">
                {BRAND_TONES.map(tone => (
                  <button
                    key={tone.value}
                    onClick={() => updateData("brandTone", tone.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      data.brandTone === tone.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">{tone.label}</p>
                    <p className="text-xs text-gray-500">{tone.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Estilo Visual</Label>
              <div className="grid md:grid-cols-5 gap-3">
                {VISUAL_STYLES.map(style => (
                  <button
                    key={style.value}
                    onClick={() => updateData("visualStyle", style.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      data.visualStyle === style.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">{style.label}</p>
                    <p className="text-xs text-gray-500">{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label>Tipo de Site</Label>
              <div className="grid md:grid-cols-3 gap-3">
                {SITE_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => updateData("siteType", type.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      data.siteType === type.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Páginas Principais</Label>
              <div className="flex flex-wrap gap-2">
                {["home", "sobre", "servicos", "produtos", "portfolio", "blog", "contato", "faq", "precos", "depoimentos"].map(page => (
                  <button
                    key={page}
                    onClick={() => togglePage(page)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      data.mainPages.includes(page)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {page.charAt(0).toUpperCase() + page.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={data.hasBlog}
                  onChange={(e) => updateData("hasBlog", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-medium">Blog</p>
                  <p className="text-xs text-gray-500">Publicação de artigos</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={data.hasEcommerce}
                  onChange={(e) => updateData("hasEcommerce", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-medium">E-commerce</p>
                  <p className="text-xs text-gray-500">Venda de produtos</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={data.hasPortfolio}
                  onChange={(e) => updateData("hasPortfolio", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-medium">Portfólio</p>
                  <p className="text-xs text-gray-500">Showcase de trabalhos</p>
                </div>
              </label>
            </div>

            <div className="space-y-3">
              <Label>Recursos Adicionais</Label>
              <div className="grid md:grid-cols-5 gap-2">
                {FEATURES.map(feature => (
                  <button
                    key={feature.value}
                    onClick={() => toggleFeature(feature.value)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      data.features.includes(feature.value)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {feature.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Título do Hero</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => suggestWithAI("heroTitle", "crie um título impactante para o banner principal (max 10 palavras)")}
                    disabled={aiSuggesting === "heroTitle" || !data.companyName}
                  >
                    {aiSuggesting === "heroTitle" ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Sugerir
                  </Button>
                </div>
                <Input
                  value={data.heroTitle}
                  onChange={(e) => updateData("heroTitle", e.target.value)}
                  placeholder="Transformamos ideias em resultados"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Subtítulo do Hero</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => suggestWithAI("heroSubtitle", "crie um subtítulo complementar para o banner (max 20 palavras)")}
                    disabled={aiSuggesting === "heroSubtitle" || !data.companyName}
                  >
                    {aiSuggesting === "heroSubtitle" ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Sugerir
                  </Button>
                </div>
                <Input
                  value={data.heroSubtitle}
                  onChange={(e) => updateData("heroSubtitle", e.target.value)}
                  placeholder="Soluções completas para sua empresa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Texto do CTA Principal</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => suggestWithAI("ctaText", "sugira 3 opções de texto para botão CTA (separados por |)")}
                  disabled={aiSuggesting === "ctaText" || !data.companyName}
                >
                  {aiSuggesting === "ctaText" ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={14} className="mr-1" />
                  )}
                  Sugerir
                </Button>
              </div>
              <Input
                value={data.ctaText}
                onChange={(e) => updateData("ctaText", e.target.value)}
                placeholder="Fale Conosco | Solicite um Orçamento"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo da Página Sobre</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => suggestWithAI("aboutContent", "escreva o conteúdo da página sobre com 3 parágrafos")}
                  disabled={aiSuggesting === "aboutContent" || !data.companyName}
                >
                  {aiSuggesting === "aboutContent" ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={14} className="mr-1" />
                  )}
                  Sugerir
                </Button>
              </div>
              <Textarea
                value={data.aboutContent}
                onChange={(e) => updateData("aboutContent", e.target.value)}
                placeholder="Conte a história da empresa..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descrição dos Serviços</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => suggestWithAI("servicesDescription", "descreva os principais serviços oferecidos")}
                  disabled={aiSuggesting === "servicesDescription" || !data.companyName}
                >
                  {aiSuggesting === "servicesDescription" ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : (
                    <Sparkles size={14} className="mr-1" />
                  )}
                  Sugerir
                </Button>
              </div>
              <Textarea
                value={data.servicesDescription}
                onChange={(e) => updateData("servicesDescription", e.target.value)}
                placeholder="Liste e descreva os serviços..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Informações de Contato</Label>
              <Textarea
                value={data.contactInfo}
                onChange={(e) => updateData("contactInfo", e.target.value)}
                placeholder="Telefone, email, endereço, horário de funcionamento..."
                rows={3}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {!generatedBriefing ? (
              <>
                {/* Resumo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumo do Briefing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="text-purple-600" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Empresa</p>
                          <p className="font-medium">{data.companyName || "Não informado"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Target className="text-purple-600" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Setor</p>
                          <p className="font-medium">{data.industry || "Não informado"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="text-purple-600" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Tipo de Site</p>
                          <p className="font-medium">{SITE_TYPES.find(t => t.value === data.siteType)?.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Layout className="text-purple-600" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Páginas</p>
                          <p className="font-medium">{data.mainPages.length} páginas</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-2">Cores da Marca</p>
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: data.primaryColor }}
                          title="Primária"
                        />
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: data.secondaryColor }}
                          title="Secundária"
                        />
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: data.accentColor }}
                          title="Destaque"
                        />
                      </div>
                    </div>

                    {data.features.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-2">Recursos Selecionados</p>
                        <div className="flex flex-wrap gap-2">
                          {data.features.map(f => (
                            <Badge key={f} variant="outline">
                              {FEATURES.find(feat => feat.value === f)?.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={generateBriefing}
                    disabled={generating || !data.companyName}
                    className="px-8"
                  >
                    {generating ? (
                      <>
                        <Loader2 size={20} className="animate-spin mr-2" />
                        Gerando Briefing...
                      </>
                    ) : (
                      <>
                        <Wand2 size={20} className="mr-2" />
                        Gerar Briefing com IA
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    A IA irá criar um briefing completo baseado nas informações fornecidas
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Briefing Gerado */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Briefing Gerado</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyBriefing}>
                      <Copy size={16} className="mr-1" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadBriefing}>
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                    {generatedBriefing}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setGeneratedBriefing(null)}>
                    Editar e Regenerar
                  </Button>
                  <Button onClick={() => toast.success("Briefing salvo!")}>
                    <Check size={16} className="mr-1" />
                    Salvar Briefing
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/gestor"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Wizard de Criação</h1>
        </div>
        <p className="text-gray-600">
          Crie um briefing completo para desenvolvimento de sites e templates
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center ${
                    isActive || isCompleted ? "" : "opacity-50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isActive
                        ? "bg-purple-600 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                  <span className="text-xs text-gray-500">{step.description}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-16 md:w-24 h-1 mx-2 rounded ${
                      currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 1}
        >
          <ArrowLeft size={16} className="mr-1" />
          Anterior
        </Button>
        {currentStep < 5 && (
          <Button onClick={() => setCurrentStep(prev => prev + 1)}>
            Próximo
            <ArrowRight size={16} className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
