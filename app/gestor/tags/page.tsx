"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Tag, 
  Trash2, 
  Search, 
  Sparkles, 
  Loader2, 
  Edit2, 
  Check, 
  X, 
  FileText,
  AlertCircle,
  FolderOpen,
  ChevronDown
} from "lucide-react";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface TagData {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: {
    posts: number;
  };
  posts?: {
    post: {
      id: string;
      title: string;
      status: string;
    };
  }[];
  categories?: {
    category: CategoryData;
  }[];
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newTagCategories, setNewTagCategories] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategories, setEditingCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showEditCategoryDropdown, setShowEditCategoryDropdown] = useState(false);
  
  // Sugestão IA
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{name: string; volume: string; reason: string; suggestedCategories?: string[]}[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestContext, setSuggestContext] = useState({
    serviceType: "",
    title: ""
  });

  // Carregar tags e categorias
  const fetchData = async () => {
    try {
      const [tagsRes, categoriesRes] = await Promise.all([
        fetch("/api/gestor/tags?withCount=true"),
        fetch("/api/gestor/categories")
      ]);
      
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setTags(data);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Criar tag
  const handleCreate = async () => {
    if (!newTag.trim()) {
      setError("Digite o nome da tag");
      return;
    }
    if (newTagCategories.length === 0) {
      setError("Selecione pelo menos uma categoria");
      return;
    }
    
    setCreating(true);
    setError("");
    
    try {
      const res = await fetch("/api/gestor/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag.trim(), categoryIds: newTagCategories })
      });
      
      if (res.ok) {
        setNewTag("");
        setNewTagCategories([]);
        fetchData();
      } else if (res.status === 409) {
        setError("Tag já existe");
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao criar tag");
      }
    } catch (err) {
      setError("Erro ao criar tag");
    } finally {
      setCreating(false);
    }
  };

  // Editar tag
  const handleEdit = async (id: string) => {
    if (!editingName.trim()) {
      alert("Digite o nome da tag");
      return;
    }
    if (editingCategories.length === 0) {
      alert("Selecione pelo menos uma categoria");
      return;
    }
    
    try {
      const res = await fetch(`/api/gestor/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim(), categoryIds: editingCategories })
      });
      
      if (res.ok) {
        setEditingId(null);
        setEditingName("");
        setEditingCategories([]);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar tag");
      }
    } catch (err) {
      alert("Erro ao atualizar tag");
    }
  };

  // Excluir tags selecionadas
  const handleDeleteSelected = async () => {
    if (selectedTags.size === 0) return;
    if (!confirm(`Excluir ${selectedTags.size} tag(s)? Esta ação não pode ser desfeita.`)) return;
    
    setDeleting(true);
    
    try {
      const res = await fetch("/api/gestor/tags", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedTags) })
      });
      
      if (res.ok) {
        setSelectedTags(new Set());
        fetchData();
      }
    } catch (err) {
      alert("Erro ao excluir tags");
    } finally {
      setDeleting(false);
    }
  };

  // Sugerir tags com IA
  const handleSuggestTags = async () => {
    setSuggestLoading(true);
    setSuggestions([]);
    
    try {
      const res = await fetch("/api/gestor/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "suggest",
          serviceType: suggestContext.serviceType,
          title: suggestContext.title
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        // Adicionar sugestão de categorias baseado no tipo de serviço
        const enhancedSuggestions = (data.suggestions || []).map((s: any) => ({
          ...s,
          suggestedCategories: suggestCategoriesForTag(s.name, suggestContext.serviceType)
        }));
        setSuggestions(enhancedSuggestions);
      }
    } catch (err) {
      console.error("Error suggesting tags:", err);
    } finally {
      setSuggestLoading(false);
    }
  };

  // Sugerir categorias para uma tag baseado no nome e tipo de serviço
  const suggestCategoriesForTag = (tagName: string, serviceType: string): string[] => {
    const tagLower = tagName.toLowerCase();
    const serviceLower = serviceType?.toLowerCase() || "";
    const suggested: string[] = [];
    
    // Mapear tags para categorias conhecidas
    categories.forEach(cat => {
      const catLower = cat.name.toLowerCase();
      const catSlug = cat.slug.toLowerCase();
      
      // Match direto ou parcial
      if (tagLower.includes(catSlug) || catSlug.includes(tagLower) ||
          tagLower.includes(catLower) || catLower.includes(tagLower)) {
        suggested.push(cat.id);
      }
      // Match por tipo de serviço
      if (serviceLower && (serviceLower.includes(catSlug) || catSlug.includes(serviceLower))) {
        if (!suggested.includes(cat.id)) suggested.push(cat.id);
      }
    });
    
    // Se não encontrou nenhuma, sugerir a primeira categoria
    if (suggested.length === 0 && categories.length > 0) {
      suggested.push(categories[0].id);
    }
    
    return suggested;
  };

  // Criar tag a partir de sugestão
  const handleCreateFromSuggestion = async (name: string, suggestedCategories?: string[]) => {
    const categoryIds = suggestedCategories && suggestedCategories.length > 0 
      ? suggestedCategories 
      : (categories.length > 0 ? [categories[0].id] : []);
    
    if (categoryIds.length === 0) {
      alert("Nenhuma categoria disponível. Crie uma categoria primeiro.");
      return;
    }
    
    try {
      const res = await fetch("/api/gestor/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, categoryIds })
      });
      
      if (res.ok || res.status === 409) {
        setSuggestions(prev => prev.filter(s => s.name !== name));
        fetchData();
      }
    } catch (err) {
      console.error("Error creating tag:", err);
    }
  };

  // Helper para cor do volume
  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case 'alto': return 'bg-green-100 text-green-700 border-green-200';
      case 'médio': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baixo': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getVolumeIcon = (volume: string) => {
    switch (volume) {
      case 'alto': return '🔥';
      case 'médio': return '📊';
      case 'baixo': return '🎯';
      default: return '📊';
    }
  };

  // Toggle seleção
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTags(newSelected);
  };

  // Toggle categoria na lista
  const toggleCategory = (categoryId: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(categoryId)) {
      setList(list.filter(id => id !== categoryId));
    } else {
      setList([...list, categoryId]);
    }
  };

  // Filtrar tags
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(search.toLowerCase()) ||
    tag.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Tags sem categoria
  const tagsWithoutCategory = tags.filter(tag => !tag.categories || tag.categories.length === 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link 
            href="/gestor/posts?view=grouped" 
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
            <p className="text-gray-500 mt-1">Gerencie as tags dos posts</p>
          </div>
        </div>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 px-5 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition shadow-sm"
        >
          <Sparkles size={18} />
          Sugestão IA
        </button>
      </div>

      {/* Alerta de tags sem categoria */}
      {tagsWithoutCategory.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-amber-800">Tags sem categoria</p>
              <p className="text-sm text-amber-600 mt-1">
                {tagsWithoutCategory.length} tag(s) precisam de pelo menos uma categoria vinculada. 
                Edite cada tag para adicionar categorias.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Painel de Sugestão IA */}
      {showSuggestions && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-600" />
            Gerar Sugestões de Tags com IA
          </h3>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Serviço (para sugerir categorias)
              </label>
              <input
                type="text"
                value={suggestContext.serviceType}
                onChange={(e) => setSuggestContext({ ...suggestContext, serviceType: e.target.value })}
                placeholder="Ex: Suporte em TI, Cloud Computing..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título do Conteúdo (opcional)
              </label>
              <input
                type="text"
                value={suggestContext.title}
                onChange={(e) => setSuggestContext({ ...suggestContext, title: e.target.value })}
                placeholder="Ex: Como proteger sua empresa..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleSuggestTags}
            disabled={suggestLoading}
            className="inline-flex items-center gap-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {suggestLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Gerando...</>
            ) : (
              <><Sparkles size={16} /> Gerar Sugestões</>
            )}
          </button>
          
          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-3">Clique para adicionar (categorias serão vinculadas automaticamente):</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => {
                  const suggestedCatNames = suggestion.suggestedCategories
                    ?.map(id => categories.find(c => c.id === id)?.name)
                    .filter(Boolean)
                    .join(", ") || "";
                  return (
                    <button
                      key={idx}
                      onClick={() => handleCreateFromSuggestion(suggestion.name, suggestion.suggestedCategories)}
                      className={`group inline-flex flex-col items-start bg-white border px-3 py-2 rounded-lg text-sm hover:shadow-md transition ${getVolumeColor(suggestion.volume)}`}
                      title={`${suggestion.reason}${suggestedCatNames ? ` | Categorias: ${suggestedCatNames}` : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Plus size={14} className="opacity-70 group-hover:opacity-100" />
                        <span className="font-medium">{suggestion.name}</span>
                        <span className="text-xs">{getVolumeIcon(suggestion.volume)}</span>
                      </div>
                      {suggestedCatNames && (
                        <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <FolderOpen size={10} />
                          {suggestedCatNames}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-xs text-gray-500 flex gap-4">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-200 rounded-full"></span> Alto volume de busca</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-200 rounded-full"></span> Volume médio</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded-full"></span> Nicho específico</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Criar nova tag */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Tag size={18} className="text-blue-600" />
          Criar Nova Tag
        </h3>
        <div className="grid gap-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => {
                setNewTag(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Digite o nome da tag..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Seleção de categorias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <FolderOpen size={14} />
              Categorias vinculadas *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`w-full px-4 py-2.5 border rounded-lg text-left flex items-center justify-between transition ${
                  newTagCategories.length === 0 ? 'border-gray-200' : 'border-blue-300 bg-blue-50'
                }`}
              >
                <span className={newTagCategories.length === 0 ? 'text-gray-400' : 'text-gray-700'}>
                  {newTagCategories.length === 0 
                    ? 'Selecione as categorias...' 
                    : `${newTagCategories.length} categoria(s) selecionada(s)`
                  }
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {categories.map(cat => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newTagCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id, newTagCategories, setNewTagCategories)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#0066CC' }}
                      />
                      <span className="text-gray-700">{cat.name}</span>
                    </label>
                  ))}
                  {categories.length === 0 && (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Nenhuma categoria cadastrada
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Chips das categorias selecionadas */}
            {newTagCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {newTagCategories.map(catId => {
                  const cat = categories.find(c => c.id === catId);
                  if (!cat) return null;
                  return (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: cat.color || '#0066CC' }}
                    >
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => toggleCategory(catId, newTagCategories, setNewTagCategories)}
                        className="hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          
          <button
            onClick={handleCreate}
            disabled={creating || !newTag.trim() || newTagCategories.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {creating ? (
              <><Loader2 size={16} className="animate-spin" /> Criando...</>
            ) : (
              <><Plus size={16} /> Adicionar Tag</>
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
      </div>

      {/* Busca e ações em lote */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tags..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {selectedTags.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="inline-flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 py-2.5 px-4 rounded-lg hover:bg-red-100 transition"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Excluir ({selectedTags.size})
          </button>
        )}
      </div>

      {/* Lista de Tags */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-gray-500">Carregando tags...</p>
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {search ? "Nenhuma tag encontrada" : "Nenhuma tag cadastrada"}
          </h3>
          <p className="text-gray-500">
            {search ? "Tente uma busca diferente" : "Crie sua primeira tag acima"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid gap-0 divide-y divide-gray-100">
            {filteredTags.map((tag) => {
              const isEditing = editingId === tag.id;
              const hasNoCategory = !tag.categories || tag.categories.length === 0;
              
              return (
                <div 
                  key={tag.id} 
                  className={`px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition ${
                    selectedTags.has(tag.id) ? "bg-blue-50" : hasNoCategory ? "bg-amber-50" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedTags.has(tag.id)}
                    onChange={() => toggleSelect(tag.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  {/* Tag info */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                        {/* Seleção de categorias na edição */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEditCategoryDropdown(!showEditCategoryDropdown)}
                            className={`w-full px-3 py-2 border rounded-lg text-left text-sm flex items-center justify-between ${
                              editingCategories.length === 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <FolderOpen size={14} />
                              {editingCategories.length === 0 
                                ? 'Selecione categorias *' 
                                : `${editingCategories.length} categoria(s)`
                              }
                            </span>
                            <ChevronDown size={16} className={`text-gray-400 transition ${showEditCategoryDropdown ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {showEditCategoryDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                              {categories.map(cat => (
                                <label
                                  key={cat.id}
                                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editingCategories.includes(cat.id)}
                                    onChange={() => toggleCategory(cat.id, editingCategories, setEditingCategories)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                                  />
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: cat.color || '#0066CC' }}
                                  />
                                  <span>{cat.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Botões de ação */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(tag.id)}
                            disabled={editingCategories.length === 0}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check size={14} /> Salvar
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingName("");
                              setEditingCategories([]);
                              setShowEditCategoryDropdown(false);
                            }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"
                          >
                            <X size={14} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{tag.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {tag.slug}
                          </span>
                          {hasNoCategory && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertCircle size={10} />
                              Sem categoria
                            </span>
                          )}
                        </div>
                        {/* Categorias vinculadas */}
                        {tag.categories && tag.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {tag.categories.map(({ category }) => (
                              <span
                                key={category.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white"
                                style={{ backgroundColor: category.color || '#0066CC' }}
                              >
                                <FolderOpen size={10} />
                                {category.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {tag._count && tag._count.posts > 0 && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <FileText size={12} />
                            {tag._count.posts} post{tag._count.posts !== 1 ? "s" : ""}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Ações */}
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(tag.id);
                          setEditingName(tag.name);
                          setEditingCategories(tag.categories?.map(c => c.category.id) || []);
                          setShowEditCategoryDropdown(false);
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Excluir a tag "${tag.name}"?`)) {
                            const res = await fetch(`/api/gestor/tags/${tag.id}`, { method: "DELETE" });
                            if (res.ok) fetchData();
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Resumo */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        {filteredTags.length} tag{filteredTags.length !== 1 ? "s" : ""}
        {search && ` encontrada${filteredTags.length !== 1 ? "s" : ""}`}
        {tagsWithoutCategory.length > 0 && (
          <span className="text-amber-600 ml-2">• {tagsWithoutCategory.length} sem categoria</span>
        )}
      </div>
    </div>
  );
}
