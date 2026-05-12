"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutTemplate,
  ArrowLeft,
  Plus,
  Eye,
  Settings,
  Loader2,
  FileText,
  Palette,
  Image as ImageIcon,
  Type,
  ToggleLeft,
  List,
  Calendar,
  Hash,
  Layers
} from "lucide-react";

interface PageTemplate {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  thumbnail: string | null;
  schema: {
    fields: Array<{
      key: string;
      type: string;
      label: string;
      required?: boolean;
    }>;
  };
  defaultContent: Record<string, any>;
  sections: {
    items: Array<{
      key: string;
      label: string;
      editable: boolean;
      order?: number;
    }>;
  };
  isSystem: boolean;
  active: boolean;
  pages: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }>;
  _count: { pages: number };
}

const FIELD_ICONS: Record<string, any> = {
  text: Type,
  textarea: FileText,
  richtext: FileText,
  image: ImageIcon,
  boolean: ToggleLeft,
  array: List,
  number: Hash,
  date: Calendar
};

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<PageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fields" | "sections" | "pages">("fields");

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/gestor/templates/${params.id}`);
      if (!res.ok) throw new Error("Template não encontrado");
      const data = await res.json();
      setTemplate(data);
    } catch (error) {
      console.error("Error fetching template:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Template não encontrado</p>
        <Link
          href="/gestor/templates"
          className="text-purple-600 hover:underline mt-2 inline-block"
        >
          Voltar para templates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/gestor/templates"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <LayoutTemplate className="text-purple-600" size={28} />
              {template.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {template.description || "Sem descrição"}
            </p>
          </div>
        </div>
        <Link
          href={`/gestor/paginas/nova?template=${template.id}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
        >
          <Plus size={18} />
          Criar Página com este Template
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Tipo</p>
          <p className="text-lg font-semibold text-gray-900">{template.type}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Slug</p>
          <p className="text-lg font-semibold text-gray-900 font-mono">{template.slug}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Campos Editáveis</p>
          <p className="text-lg font-semibold text-gray-900">
            {template.schema?.fields?.length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Páginas Usando</p>
          <p className="text-lg font-semibold text-gray-900">
            {template._count.pages}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("fields")}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "fields"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings size={16} />
            Campos Editáveis ({template.schema?.fields?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("sections")}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "sections"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers size={16} />
            Seções ({template.sections?.items?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === "pages"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText size={16} />
            Páginas ({template._count.pages})
          </button>
        </div>

        <div className="p-6">
          {/* Tab: Campos */}
          {activeTab === "fields" && (
            <div className="space-y-4">
              {template.schema?.fields?.length > 0 ? (
                template.schema.fields.map((field, index) => {
                  const Icon = FIELD_ICONS[field.type] || Type;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="p-2 bg-white rounded-lg border">
                        <Icon size={20} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{field.label}</p>
                        <p className="text-sm text-gray-500">
                          Chave: <code className="bg-gray-200 px-1 rounded">{field.key}</code>
                          {" • "}
                          Tipo: <code className="bg-gray-200 px-1 rounded">{field.type}</code>
                          {field.required && (
                            <span className="text-red-500 ml-2">* Obrigatório</span>
                          )}
                        </p>
                      </div>
                      <div className="text-sm text-gray-400">
                        Valor padrão:{" "}
                        <span className="font-mono">
                          {JSON.stringify(template.defaultContent?.[field.key] || "—").slice(0, 30)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Este template não possui campos editáveis definidos
                </p>
              )}
            </div>
          )}

          {/* Tab: Seções */}
          {activeTab === "sections" && (
            <div className="space-y-3">
              {template.sections?.items?.length > 0 ? (
                template.sections.items
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((section, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                          {section.order || index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{section.label}</p>
                          <p className="text-sm text-gray-500">
                            Chave: <code className="bg-gray-200 px-1 rounded">{section.key}</code>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          section.editable
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {section.editable ? "Editável" : "Fixo"}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Este template não possui seções definidas
                </p>
              )}
            </div>
          )}

          {/* Tab: Páginas */}
          {activeTab === "pages" && (
            <div>
              {template.pages?.length > 0 ? (
                <div className="space-y-3">
                  {template.pages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/gestor/paginas/${page.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{page.title}</p>
                        <p className="text-sm text-gray-500">/{page.slug}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          page.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {page.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Nenhuma página criada com este template
                  </p>
                  <Link
                    href={`/gestor/paginas/nova?template=${template.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Plus size={16} />
                    Criar Primeira Página
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
