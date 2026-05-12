"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutTemplate,
  Home,
  Users,
  Briefcase,
  Package,
  Phone,
  FileText,
  Newspaper,
  Scale,
  Loader2,
  Eye,
  Plus,
  ChevronRight,
  Settings,
  Layers,
  Mail,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Check,
  X,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface PageTemplate {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  thumbnail: string | null;
  isSystem: boolean;
  active: boolean;
  _count: { pages: number };
}

const TEMPLATE_ICONS: Record<string, any> = {
  HEADER: LayoutTemplate,
  FOOTER: LayoutTemplate,
  HOME: Home,
  SERVICES: Briefcase,
  PRODUCTS: Package,
  ABOUT: Users,
  CONTACT: Phone,
  POST_LIST: Newspaper,
  POST_DETAIL: FileText,
  LEGAL: Scale,
  CUSTOM: Layers
};

const TEMPLATE_COLORS: Record<string, string> = {
  HEADER: "bg-purple-100 text-purple-700 border-purple-200",
  FOOTER: "bg-purple-100 text-purple-700 border-purple-200",
  HOME: "bg-blue-100 text-blue-700 border-blue-200",
  SERVICES: "bg-green-100 text-green-700 border-green-200",
  PRODUCTS: "bg-orange-100 text-orange-700 border-orange-200",
  ABOUT: "bg-cyan-100 text-cyan-700 border-cyan-200",
  CONTACT: "bg-pink-100 text-pink-700 border-pink-200",
  POST_LIST: "bg-yellow-100 text-yellow-700 border-yellow-200",
  POST_DETAIL: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LEGAL: "bg-gray-100 text-gray-700 border-gray-200",
  CUSTOM: "bg-indigo-100 text-indigo-700 border-indigo-200"
};

const TYPE_LABELS: Record<string, string> = {
  HEADER: "Estrutura",
  FOOTER: "Estrutura",
  HOME: "Página Principal",
  SERVICES: "Serviços",
  PRODUCTS: "Produtos",
  ABOUT: "Institucional",
  CONTACT: "Contato",
  POST_LIST: "Blog",
  POST_DETAIL: "Blog",
  LEGAL: "Legal",
  CUSTOM: "Customizado"
};

const TEMPLATE_TYPES = [
  "HEADER", "FOOTER", "HOME", "SERVICES", "PRODUCTS", "ABOUT", "CONTACT", "POST_LIST", "POST_DETAIL", "LEGAL", "CUSTOM"
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PageTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "CUSTOM",
    description: ""
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/gestor/templates");
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/gestor/templates", {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: formData.name,
          type: formData.type,
          description: formData.description,
          slug: formData.name.toLowerCase().replace(/\s+/g, "-")
        })
      });

      if (res.ok) {
        toast.success(editingTemplate ? "Template atualizado!" : "Template criado!");
        fetchTemplates();
        closeModal();
      } else {
        toast.error("Erro ao salvar template");
      }
    } catch (error) {
      toast.error("Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (template: PageTemplate) => {
    try {
      const res = await fetch("/api/gestor/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          active: !template.active
        })
      });

      if (res.ok) {
        toast.success(template.active ? "Template desativado" : "Template ativado");
        fetchTemplates();
      }
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (template: PageTemplate) => {
    if (template.isSystem) {
      toast.error("Templates de sistema não podem ser excluídos");
      return;
    }

    if (template._count.pages > 0) {
      toast.error("Este template está sendo usado por páginas");
      return;
    }

    if (!confirm("Deseja excluir este template?")) return;

    try {
      const res = await fetch(`/api/gestor/templates?id=${template.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Template excluído!");
        fetchTemplates();
      }
    } catch (error) {
      toast.error("Erro ao excluir template");
    }
  };

  const openEditModal = (template: PageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      description: template.description || ""
    });
    setShowNewModal(true);
  };

  const closeModal = () => {
    setShowNewModal(false);
    setEditingTemplate(null);
    setFormData({ name: "", type: "CUSTOM", description: "" });
  };

  // Agrupar templates por tipo
  const groupedTemplates = templates.reduce((acc, template) => {
    const group = TYPE_LABELS[template.type] || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(template);
    return acc;
  }, {} as Record<string, PageTemplate[]>);

  const filteredGroups = selectedType
    ? { [selectedType]: groupedTemplates[selectedType] || [] }
    : groupedTemplates;

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutTemplate className="text-purple-600" size={28} />
            Templates
          </h1>
          <p className="text-gray-500 mt-1">
            Modelos de página para criar novas páginas no site
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/gestor/templates/assinaturas">
            <Button variant="outline">
              <Mail size={16} className="mr-2" />
              Assinaturas de Email
            </Button>
          </Link>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus size={16} className="mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Modal de Novo/Editar Template */}
      {showNewModal && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingTemplate ? "Editar Template" : "Novo Template"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do template"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={editingTemplate?.isSystem}
                >
                  {TEMPLATE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type] || type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição breve"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Check size={16} className="mr-1" />}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedType === null
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Todos ({templates.length})
        </button>
        {Object.keys(groupedTemplates).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedType === type
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {type} ({groupedTemplates[type].length})
          </button>
        ))}
      </div>

      {/* Lista de Templates por Grupo */}
      <div className="space-y-8">
        {Object.entries(filteredGroups).map(([group, groupTemplates]) => (
          <div key={group}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              {group}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupTemplates.map((template) => {
                const Icon = TEMPLATE_ICONS[template.type] || Layers;
                const colorClass = TEMPLATE_COLORS[template.type] || TEMPLATE_COLORS.CUSTOM;

                return (
                  <div
                    key={template.id}
                    className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition p-5 ${
                      !template.active ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${colorClass}`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {template.name}
                          </h3>
                          {!template.active && (
                            <Badge variant="outline" className="text-xs bg-gray-100">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {template.description || "Sem descrição"}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          {template.isSystem && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              Sistema
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {template._count.pages} página(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Link
                        href={`/gestor/templates/${template.id}`}
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                      >
                        <Eye size={16} />
                        Ver detalhes
                      </Link>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(template)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title={template.active ? "Desativar" : "Ativar"}
                        >
                          {template.active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          onClick={() => openEditModal(template)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        {!template.isSystem && template._count.pages === 0 && (
                          <button
                            onClick={() => handleDelete(template)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
