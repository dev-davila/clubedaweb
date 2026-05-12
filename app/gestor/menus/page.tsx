"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Menu as MenuIcon,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface NavItem {
  id?: string;
  label: string;
  url: string;
  icon: string;
  target: string;
  order: number;
  active: boolean;
  highlight: boolean;
  parentId: string | null;
  // UI-only
  _tempId?: string;
  _expanded?: boolean;
  children?: NavItem[];
}

interface NavMenu {
  id: string;
  name: string;
  label: string;
  items: NavItem[];
}

const MENU_NAMES = [
  { name: "header", label: "Menu Principal (Header)" },
  { name: "footer-solucoes", label: "Footer - Soluções" },
  { name: "footer-portfolio", label: "Footer - Portfólio" },
  { name: "footer-institucional", label: "Footer - Institucional" },
  { name: "footer-legal", label: "Footer - Legal" },
];

let tempIdCounter = 0;
function newTempId() { return `_temp_${++tempIdCounter}`; }

export default function MenusPage() {
  const [menus, setMenus] = useState<NavMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<string>("header");
  const [items, setItems] = useState<NavItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gestor/navigation");
      if (res.ok) {
        const data = await res.json();
        setMenus(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar menus:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenus(); }, [fetchMenus]);

  useEffect(() => {
    const menu = menus.find(m => m.name === selectedMenu);
    if (menu) {
      // Flatten tree: header menu items may have children stored as parentId refs
      const flatItems = (menu.items || []).map(item => ({
        ...item,
        _tempId: item.id || newTempId(),
        _expanded: true,
        children: undefined // we use flat list with parentId
      }));
      setItems(flatItems.sort((a, b) => a.order - b.order));
    } else {
      setItems([]);
    }
  }, [selectedMenu, menus]);

  function addItem(parentId: string | null = null) {
    const maxOrder = items.filter(i => i.parentId === parentId).reduce((max, i) => Math.max(max, i.order), -1);
    setItems(prev => [...prev, {
      label: "",
      url: "/",
      icon: "",
      target: "_self",
      order: maxOrder + 1,
      active: true,
      highlight: false,
      parentId,
      _tempId: newTempId(),
    }]);
  }

  function updateItem(tempId: string | undefined, field: string, value: any) {
    setItems(prev => prev.map(item =>
      (item._tempId === tempId || item.id === tempId)
        ? { ...item, [field]: value }
        : item
    ));
  }

  function removeItem(tempId: string | undefined) {
    setItems(prev => {
      // Also remove children
      const toRemove = new Set<string>();
      toRemove.add(tempId || "");
      prev.forEach(item => {
        if (item.parentId && (toRemove.has(item.parentId) || item.parentId === tempId)) {
          toRemove.add(item._tempId || item.id || "");
        }
      });
      return prev.filter(item => !toRemove.has(item._tempId || "") && !toRemove.has(item.id || ""));
    });
  }

  function moveItem(tempId: string | undefined, direction: "up" | "down") {
    setItems(prev => {
      const item = prev.find(i => (i._tempId === tempId || i.id === tempId));
      if (!item) return prev;
      const siblings = prev.filter(i => i.parentId === item.parentId).sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex(i => (i._tempId === tempId || i.id === tempId));
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const swapItem = siblings[swapIdx];
      const tempOrder = item.order;
      return prev.map(i => {
        if ((i._tempId === tempId || i.id === tempId)) return { ...i, order: swapItem.order };
        if ((i._tempId === swapItem._tempId || i.id === swapItem.id)) return { ...i, order: tempOrder };
        return i;
      });
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      // Normalize orders
      const rootItems = items.filter(i => !i.parentId).sort((a, b) => a.order - b.order);
      const childItems = items.filter(i => i.parentId);
      const normalized = rootItems.map((item, idx) => ({
        id: item.id || undefined,
        label: item.label,
        url: item.url,
        icon: item.icon || "",
        target: item.target || "_self",
        order: idx,
        active: item.active,
        highlight: item.highlight,
        parentId: null as string | null,
      }));
      // For header menu, also send children
      childItems.forEach(child => {
        normalized.push({
          id: child.id || undefined,
          label: child.label,
          url: child.url,
          icon: child.icon || "",
          target: child.target || "_self",
          order: child.order,
          active: child.active,
          highlight: child.highlight,
          parentId: child.parentId,
        });
      });

      const menu = menus.find(m => m.name === selectedMenu);
      const res = await fetch("/api/gestor/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: menu?.id,
          menuName: selectedMenu,
          label: MENU_NAMES.find(m => m.name === selectedMenu)?.label || selectedMenu,
          items: normalized,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar menu");
        return;
      }
      setSuccess("Menu salvo com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchMenus();
    } catch (err) {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    if (!confirm("Isso vai criar/atualizar os menus com os links padrão do site. Continuar?")) return;
    try {
      setSeeding(true);
      setError("");
      const res = await fetch("/api/gestor/navigation/seed", { method: "POST" });
      if (res.ok) {
        setSuccess("Menus inicializados com sucesso!");
        setTimeout(() => setSuccess(""), 3000);
        await fetchMenus();
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao inicializar menus");
      }
    } catch (err) {
      setError("Erro ao inicializar menus");
    } finally {
      setSeeding(false);
    }
  }

  const rootItems = items.filter(i => !i.parentId).sort((a, b) => a.order - b.order);
  const isHeaderMenu = selectedMenu === "header";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Menus</h1>
          <p className="text-gray-500 mt-1">Edite os links de navegação do header e footer</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          {seeding ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Inicializar com Padrões
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Menu selector */}
      <div className="flex flex-wrap gap-2">
        {MENU_NAMES.map(m => (
          <button
            key={m.name}
            onClick={() => setSelectedMenu(m.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedMenu === m.name
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {MENU_NAMES.find(m => m.name === selectedMenu)?.label}
            </h2>
            <span className="text-sm text-gray-400">{rootItems.length} itens</span>
          </div>

          {rootItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MenuIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum item neste menu</p>
              <p className="text-sm">Clique em &quot;Inicializar com Padrões&quot; para popular automaticamente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rootItems.map((item) => {
                const children = items
                  .filter(i => i.parentId === (item.id || item._tempId))
                  .sort((a, b) => a.order - b.order);
                return (
                  <div key={item._tempId || item.id} className="border border-gray-100 rounded-lg">
                    {/* Root item */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-t-lg">
                      <GripVertical size={16} className="text-gray-300 flex-shrink-0" />
                      <button
                        onClick={() => updateItem(item._tempId || item.id, "active", !item.active)}
                        className={`p-1 rounded transition ${item.active ? "text-green-600" : "text-gray-300"}`}
                        title={item.active ? "Ativo" : "Inativo"}
                      >
                        {item.active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItem(item._tempId || item.id, "label", e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => updateItem(item._tempId || item.id, "url", e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="/url"
                      />
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveItem(item._tempId || item.id, "up")} className="p-1 text-gray-400 hover:text-gray-600" title="Mover para cima">↑</button>
                        <button onClick={() => moveItem(item._tempId || item.id, "down")} className="p-1 text-gray-400 hover:text-gray-600" title="Mover para baixo">↓</button>
                        <button
                          onClick={() => removeItem(item._tempId || item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Children (submenus) - only for header */}
                    {isHeaderMenu && (
                      <div className="pl-8 pr-3 py-2 space-y-2 bg-white rounded-b-lg">
                        {children.map(child => (
                          <div key={child._tempId || child.id} className="flex items-center gap-2">
                            <span className="text-gray-300 text-xs">└</span>
                            <button
                              onClick={() => updateItem(child._tempId || child.id, "active", !child.active)}
                              className={`p-1 rounded transition ${child.active ? "text-green-600" : "text-gray-300"}`}
                            >
                              {child.active ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <input
                              type="text"
                              value={child.label}
                              onChange={(e) => updateItem(child._tempId || child.id, "label", e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Sub-label"
                            />
                            <input
                              type="text"
                              value={child.url}
                              onChange={(e) => updateItem(child._tempId || child.id, "url", e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="/sub-url"
                            />
                            <button
                              onClick={() => removeItem(child._tempId || child.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addItem(item.id || item._tempId || null)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                        >
                          <Plus size={12} />
                          Adicionar sub-item
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => addItem(null)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <Plus size={16} />
              Adicionar item
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
