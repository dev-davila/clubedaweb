"use client";

import { useState, useEffect } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";
import Link from "next/link";
import {
  Mail,
  FileText,
  Check,
  Loader2,
  Eye,
  Palette,
  Layout,
  Sparkles,
  ArrowRight,
  Building2,
  User,
  Briefcase,
  Smartphone,
  X
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  defaultStyles: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    fontFamily: string;
  };
  supportedFields: string[];
}

const categoryLabels: Record<string, string> = {
  corporate: "Corporativo",
  modern: "Moderno",
  minimal: "Minimalista",
  promotional: "Promocional",
  custom: "Personalizado"
};

const categoryIcons: Record<string, any> = {
  corporate: Building2,
  modern: Sparkles,
  minimal: Layout,
  promotional: FileText,
  custom: Palette
};

// Dados de exemplo com nome completo M3Solutions
const getSampleData = (template: Template) => ({
  fullName: "João da Silva",
  jobTitle: "Diretor de Tecnologia",
  company: "M3Solutions",
  department: "TI",
  phone: "(11) 3000-7777",
  mobile: "(11) 98765-4321",
  whatsapp: "(11) 98765-4321",
  email: "joao.silva@m3solutions.com.br",
  website: "https://m3solutions.com.br",
  address: "São Paulo, SP - Brasil",
  // Logo M3Solutions oficial do site
  logoUrl: "https://cdn.abacus.ai/images/b0af7a0d-1b30-484a-b1b1-c6069aa6ec80.png",
  primaryColor: template.defaultStyles.primaryColor,
  secondaryColor: template.defaultStyles.secondaryColor,
  textColor: template.defaultStyles.textColor,
  fontFamily: template.defaultStyles.fontFamily,
  showLogo: true,
  showPhoto: false,
  showSocial: true,
  showAddress: true,
  showBanner: template.slug === 'with-banner' || template.slug === 'banner-cta' || template.slug === 'promotional-full',
  bannerUrl: 'https://cdn.abacus.ai/images/521ecf94-695b-4c40-9d93-31140298a310.png',
  socialLinks: {
    linkedin: "https://linkedin.com/company/m3solutions",
    instagram: "https://instagram.com/m3solutionsbr",
    facebook: "https://facebook.com/m3solutionsbr"
  },
  disclaimer: "Esta mensagem é confidencial e pode conter informações privilegiadas."
});

export default function TemplatesAssinaturasPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [templatePreviews, setTemplatePreviews] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Carregar previews automaticamente quando templates são carregados
  useEffect(() => {
    if (templates.length > 0) {
      templates.forEach((template) => {
        if (!templatePreviews[template.slug]) {
          loadTemplatePreview(template);
        }
      });
    }
  }, [templates]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/gestor/signatures/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatePreview = async (template: Template) => {
    if (loadingPreviews[template.slug]) return;
    
    setLoadingPreviews(prev => ({ ...prev, [template.slug]: true }));
    
    try {
      const res = await fetch("/api/gestor/signatures/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          templateSlug: template.slug, 
          data: getSampleData(template) 
        })
      });
      if (res.ok) {
        const result = await res.json();
        setTemplatePreviews(prev => ({ ...prev, [template.slug]: result.html }));
      }
    } catch (error) {
      console.error("Erro ao carregar preview:", error);
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [template.slug]: false }));
    }
  };

  const previewTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    
    // Usar preview já carregado ou buscar novo
    if (templatePreviews[template.slug]) {
      setPreviewHtml(templatePreviews[template.slug]);
      return;
    }

    // Buscar preview da API
    try {
      const res = await fetch("/api/gestor/signatures/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          templateSlug: template.slug, 
          data: getSampleData(template) 
        })
      });
      if (res.ok) {
        const result = await res.json();
        setPreviewHtml(result.html);
        setTemplatePreviews(prev => ({ ...prev, [template.slug]: result.html }));
      }
    } catch (error) {
      console.error("Erro ao gerar preview:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  // Agrupar por categoria
  const templatesByCategory = templates.reduce((acc, template) => {
    const cat = template.category || 'custom';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="text-purple-600" size={28} />
            Templates de Assinatura
          </h1>
          <p className="text-gray-500 mt-1">
            Biblioteca de templates de assinatura de email baseados na identidade visual do site
          </p>
        </div>
        <Link
          href="/gestor/assinatura"
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
        >
          <Sparkles size={18} />
          Criar Minha Assinatura
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              <p className="text-sm text-gray-500">Templates disponíveis</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.category === 'corporate').length}
              </p>
              <p className="text-sm text-gray-500">Corporativos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Sparkles className="text-pink-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.category === 'modern').length}
              </p>
              <p className="text-sm text-gray-500">Modernos</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">100%</p>
              <p className="text-sm text-gray-500">Responsivos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates por categoria */}
      {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => {
        const CategoryIcon = categoryIcons[category] || FileText;
        
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <CategoryIcon className="text-gray-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-800">
                {categoryLabels[category] || category}
              </h2>
              <span className="text-sm text-gray-400">({categoryTemplates.length})</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categoryTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden group"
                >
                  {/* Preview Area - Mostra HTML real do template */}
                  <div 
                    className="min-h-[280px] bg-gradient-to-br from-gray-50 to-gray-100 p-4 relative overflow-hidden"
                    style={{ borderBottom: `4px solid ${template.defaultStyles.primaryColor}` }}
                  >
                    {/* Preview real da assinatura */}
                    <div className="bg-white rounded-lg shadow-sm p-4 overflow-auto max-h-[260px]">
                      {loadingPreviews[template.slug] ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="animate-spin text-purple-500" size={24} />
                          <span className="ml-2 text-gray-500 text-sm">Carregando preview...</span>
                        </div>
                      ) : templatePreviews[template.slug] ? (
                        <div 
                          className="signature-preview-mini"
                          style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}
                          dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(templatePreviews[template.slug]) }} 
                        />
                      ) : (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                          <Mail size={24} className="mr-2" />
                          <span className="text-sm">Preview não disponível</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button
                        onClick={() => previewTemplate(template)}
                        className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg hover:bg-gray-50 transition"
                      >
                        <Eye size={16} />
                        Ver em Tela Cheia
                      </button>
                      <Link
                        href={`/gestor/assinatura?template=${template.slug}`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg hover:bg-purple-700 transition"
                      >
                        <Check size={16} />
                        Usar Template
                      </Link>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                    </div>
                    
                    {/* Cores */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs text-gray-400">Cores:</span>
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: template.defaultStyles.primaryColor }}
                        title="Cor primária"
                      />
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: template.defaultStyles.secondaryColor }}
                        title="Cor secundária"
                      />
                      <div 
                        className="w-5 h-5 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: template.defaultStyles.textColor }}
                        title="Cor do texto"
                      />
                    </div>
                    
                    {/* Campos suportados */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.supportedFields.slice(0, 5).map((field) => (
                        <span
                          key={field}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                        >
                          {field}
                        </span>
                      ))}
                      {template.supportedFields.length > 5 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          +{template.supportedFields.length - 5}
                        </span>
                      )}
                    </div>
                    
                    {/* Ação */}
                    <Link
                      href={`/gestor/assinatura?template=${template.slug}`}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                    >
                      Criar com este template
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Modal de Preview */}
      {selectedTemplate && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTemplate(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                {previewHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(previewHtml) }} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Gerando preview...
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Fechar
              </button>
              <Link
                href={`/gestor/assinatura?template=${selectedTemplate.slug}`}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Check size={16} />
                Usar este template
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
