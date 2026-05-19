"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Menu as MenuIcon,
  Plus,
  Trash2,
  Save,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Link2,
  FileText,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildMenuTree,
  flattenMenuTree,
  itemKey,
  MENU_LOCATIONS,
  newMenuItemId,
  type MenuNavItem,
} from "@/lib/cms/menu-types";

interface NavMenuDto {
  id: string;
  name: string;
  label: string;
  items: Array<MenuNavItem & { children?: MenuNavItem[] }>;
}

interface LinkableResponse {
  systemPages: { type: string; title: string; url: string; navLabel: string }[];
  dynamicPages: {
    id: string;
    title: string;
    slug: string;
    status: string;
    url: string;
  }[];
}

function apiItemsToFlat(menu: NavMenuDto): MenuNavItem[] {
  const flat: MenuNavItem[] = [];
  for (const root of menu.items || []) {
    const rootKey = root.id || newMenuItemId();
    flat.push({
      id: root.id,
      label: root.label,
      url: root.url,
      icon: root.icon || "",
      target: root.target || "_self",
      order: root.order ?? 0,
      active: root.active !== false,
      highlight: root.highlight || false,
      parentId: null,
      _tempId: rootKey,
    });
    for (const child of root.children || []) {
      flat.push({
        id: child.id,
        label: child.label,
        url: child.url,
        icon: child.icon || "",
        target: child.target || "_self",
        order: child.order ?? 0,
        active: child.active !== false,
        highlight: child.highlight || false,
        parentId: root.id || rootKey,
        _tempId: child.id || newMenuItemId(),
      });
    }
  }
  return flat;
}

export function MenuBuilder() {
  const [menus, setMenus] = useState<NavMenuDto[]>([]);
  const [linkable, setLinkable] = useState<LinkableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<string>("header");
  const [items, setItems] = useState<MenuNavItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [selectedSystem, setSelectedSystem] = useState<Set<string>>(new Set());
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [customLabel, setCustomLabel] = useState("");
  const [customUrl, setCustomUrl] = useState("https://");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const fetchMenus = useCallback(async () => {
    const res = await fetch("/api/gestor/navigation");
    if (res.ok) setMenus(await res.json());
  }, []);

  const fetchLinkable = useCallback(async () => {
    const res = await fetch("/api/gestor/cms/linkable");
    if (res.ok) setLinkable(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchMenus(), fetchLinkable()]);
      setLoading(false);
    })();
  }, [fetchMenus, fetchLinkable]);

  useEffect(() => {
    const menu = menus.find((m) => m.name === selectedMenu);
    setItems(menu ? apiItemsToFlat(menu) : []);
    setExpandedKeys(new Set());
  }, [selectedMenu, menus]);

  const tree = buildMenuTree(items);
  const isHeaderMenu = selectedMenu === "header";

  function addItems(newOnes: MenuNavItem[]) {
    const maxOrder = items.filter((i) => !i.parentId).reduce((m, i) => Math.max(m, i.order), -1);
    setItems((prev) => [
      ...prev,
      ...newOnes.map((it, idx) => ({
        ...it,
        order: maxOrder + 1 + idx,
        parentId: null,
        _tempId: it._tempId || newMenuItemId(),
      })),
    ]);
  }

  function addFromSystem() {
    if (!linkable) return;
    const toAdd = linkable.systemPages
      .filter((p) => selectedSystem.has(p.type))
      .map((p) => ({
        label: p.navLabel,
        url: p.url,
        icon: "",
        target: "_self",
        order: 0,
        active: true,
        highlight: false,
        parentId: null,
        _tempId: newMenuItemId(),
        source: "system" as const,
        sourceId: p.type,
      }));
    addItems(toAdd);
    setSelectedSystem(new Set());
  }

  function addFromPages() {
    if (!linkable) return;
    const toAdd = linkable.dynamicPages
      .filter((p) => selectedPages.has(p.id))
      .map((p) => ({
        label: p.title,
        url: p.url,
        icon: "",
        target: "_self",
        order: 0,
        active: true,
        highlight: false,
        parentId: null,
        _tempId: newMenuItemId(),
        source: "page" as const,
        sourceId: p.id,
      }));
    addItems(toAdd);
    setSelectedPages(new Set());
  }

  function addCustomLink() {
    if (!customLabel.trim() || !customUrl.trim()) return;
    addItems([
      {
        label: customLabel.trim(),
        url: customUrl.trim(),
        icon: "",
        target: "_self",
        order: 0,
        active: true,
        highlight: false,
        parentId: null,
        _tempId: newMenuItemId(),
        source: "custom",
      },
    ]);
    setCustomLabel("");
    setCustomUrl("https://");
  }

  function updateItem(key: string, patch: Partial<MenuNavItem>) {
    setItems((prev) => prev.map((i) => (itemKey(i) === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const removed = new Set<string>([key]);
      prev.forEach((i) => {
        if (i.parentId && removed.has(i.parentId)) removed.add(itemKey(i));
      });
      return prev.filter((i) => !removed.has(itemKey(i)));
    });
  }

  function moveRoot(key: string, dir: "up" | "down") {
    const roots = items.filter((i) => !i.parentId).sort((a, b) => a.order - b.order);
    const idx = roots.findIndex((r) => itemKey(r) === key);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= roots.length) return;
    const a = roots[idx];
    const b = roots[swap];
    setItems((prev) =>
      prev.map((i) => {
        if (itemKey(i) === itemKey(a)) return { ...i, order: b.order };
        if (itemKey(i) === itemKey(b)) return { ...i, order: a.order };
        return i;
      }),
    );
  }

  function nestUnderPrevious(key: string) {
    if (!isHeaderMenu) return;
    const roots = items.filter((i) => !i.parentId).sort((a, b) => a.order - b.order);
    const idx = roots.findIndex((r) => itemKey(r) === key);
    if (idx <= 0) return;
    const parent = roots[idx - 1];
    const parentKey = parent.id || parent._tempId;
    const childCount = items.filter((i) => i.parentId === parentKey).length;
    updateItem(key, { parentId: parentKey, order: childCount });
  }

  function unnest(key: string) {
    const maxOrder = items.filter((i) => !i.parentId).reduce((m, i) => Math.max(m, i.order), -1);
    updateItem(key, { parentId: null, order: maxOrder + 1 });
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const flat = flattenMenuTree(tree);
      const menu = menus.find((m) => m.name === selectedMenu);
      const res = await fetch("/api/gestor/navigation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: menu?.id,
          menuName: selectedMenu,
          label: MENU_LOCATIONS.find((m) => m.name === selectedMenu)?.label || selectedMenu,
          items: flat.map((item) => ({
            id: item.id,
            label: item.label,
            url: item.url,
            icon: item.icon || "",
            target: item.target || "_self",
            order: item.order,
            active: item.active,
            highlight: item.highlight,
            parentId: item.parentId,
          })),
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
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSeed() {
    if (!confirm("Carregar menus padrão do site? Salve depois para persistir cada local.")) return;
    try {
      setSeeding(true);
      const res = await fetch("/api/gestor/navigation/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (res.ok) {
        setSuccess("Menus padrão carregados.");
        await fetchMenus();
      } else {
        const data = await res.json();
        setError(data.message || data.error || "Erro ao inicializar");
      }
    } finally {
      setSeeding(false);
    }
  }

  function toggleExpanded(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderMenuItemRow(item: MenuNavItem, isChild = false) {
    const key = itemKey(item);
    const isExp = expandedKeys.has(key);
    const parentKey = item.id || item._tempId;
    const children = items.filter((i) => i.parentId === parentKey);

    return (
      <div key={key}>
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
          <button type="button" onClick={() => toggleExpanded(key)} className="p-1 text-gray-400">
            {children.length > 0 || isHeaderMenu ? (
              isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <span className="w-4 inline-block" />
            )}
          </button>
          <button
            type="button"
            onClick={() => updateItem(key, { active: !item.active })}
            className={item.active ? "text-green-600" : "text-gray-300"}
          >
            {item.active ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <Input
            value={item.label}
            onChange={(e) => updateItem(key, { label: e.target.value })}
            className="h-8 flex-1 min-w-[120px]"
            placeholder="Rótulo"
          />
          <Input
            value={item.url}
            onChange={(e) => updateItem(key, { url: e.target.value })}
            className="h-8 flex-1 min-w-[140px] font-mono text-xs"
            placeholder="/url"
          />
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600">
            <ExternalLink size={14} />
          </a>
          {!isChild && isHeaderMenu && (
            <>
              <button type="button" onClick={() => moveRoot(key, "up")} className="p-1 text-gray-400 hover:text-gray-700">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => moveRoot(key, "down")} className="p-1 text-gray-400 hover:text-gray-700">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => nestUnderPrevious(key)} className="p-1 text-gray-400 hover:text-blue-600" title="Submenu">
                <CornerDownRight size={14} />
              </button>
            </>
          )}
          {isChild && (
            <button type="button" onClick={() => unnest(key)} className="text-xs text-blue-600 px-1">
              Nível acima
            </button>
          )}
          <button type="button" onClick={() => removeItem(key)} className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
        {isExp && isHeaderMenu && (
          <div className="mt-2 space-y-2 pl-6 border-l-2 border-blue-100 ml-2">
            {children.map((child) => renderMenuItemRow(child, true))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-blue-600 h-7"
              onClick={() => {
                const childCount = items.filter((i) => i.parentId === parentKey).length;
                setItems((prev) => [
                  ...prev,
                  {
                    label: "Novo subitem",
                    url: "/",
                    icon: "",
                    target: "_self",
                    order: childCount,
                    active: true,
                    highlight: false,
                    parentId: parentKey,
                    _tempId: newMenuItemId(),
                  },
                ]);
                setExpandedKeys((e) => new Set(e).add(key));
              }}
            >
              <Plus size={14} className="mr-1" />
              Subitem
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
          <p className="text-gray-500 mt-1">Estilo WordPress: adicione páginas à esquerda e organize à direita.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw className="mr-2" size={16} />}
            Carregar padrão
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
            Salvar menu
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div>
        <Label className="text-sm font-medium text-gray-700">Local do menu</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {MENU_LOCATIONS.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => setSelectedMenu(m.name)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                selectedMenu === m.name ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Adicionar itens</CardTitle>
            <CardDescription>Marque páginas ou crie um link personalizado</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="system">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="system" className="text-xs sm:text-sm">
                  <LayoutGrid className="mr-1 h-3.5 w-3.5" />
                  Site
                </TabsTrigger>
                <TabsTrigger value="pages" className="text-xs sm:text-sm">
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  Páginas
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs sm:text-sm">
                  <Link2 className="mr-1 h-3.5 w-3.5" />
                  Link
                </TabsTrigger>
              </TabsList>

              <TabsContent value="system" className="mt-4 space-y-3 max-h-[420px] overflow-y-auto">
                {linkable?.systemPages.map((p) => (
                  <label key={p.type} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <Checkbox
                      checked={selectedSystem.has(p.type)}
                      onCheckedChange={(c) => {
                        setSelectedSystem((prev) => {
                          const n = new Set(prev);
                          if (c) n.add(p.type);
                          else n.delete(p.type);
                          return n;
                        });
                      }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 block">{p.navLabel}</span>
                      <span className="text-xs text-gray-500 font-mono">{p.url}</span>
                    </span>
                  </label>
                ))}
                <Button type="button" className="w-full" size="sm" onClick={addFromSystem} disabled={selectedSystem.size === 0}>
                  Adicionar ao menu
                </Button>
              </TabsContent>

              <TabsContent value="pages" className="mt-4 space-y-3 max-h-[420px] overflow-y-auto">
                {!linkable?.dynamicPages.length ? (
                  <p className="text-sm text-gray-500 py-4 text-center">Nenhuma página no CMS.</p>
                ) : (
                  linkable.dynamicPages.map((p) => (
                    <label key={p.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedPages.has(p.id)}
                        onCheckedChange={(c) => {
                          setSelectedPages((prev) => {
                            const n = new Set(prev);
                            if (c) n.add(p.id);
                            else n.delete(p.id);
                            return n;
                          });
                        }}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 block">{p.title}</span>
                        <span className="text-xs text-gray-500 font-mono">{p.url}</span>
                        {p.status === "DRAFT" && <span className="text-xs text-amber-600"> (rascunho)</span>}
                      </span>
                    </label>
                  ))
                )}
                <Button type="button" className="w-full" size="sm" onClick={addFromPages} disabled={selectedPages.size === 0}>
                  Adicionar ao menu
                </Button>
              </TabsContent>

              <TabsContent value="custom" className="mt-4 space-y-3">
                <div>
                  <Label htmlFor="custom-label">Texto do link</Label>
                  <Input id="custom-label" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="custom-url">URL</Label>
                  <Input id="custom-url" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="mt-1 font-mono text-sm" />
                </div>
                <Button type="button" className="w-full" size="sm" onClick={addCustomLink}>
                  Adicionar link personalizado
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MenuIcon size={20} />
              Estrutura do menu
            </CardTitle>
            <CardDescription>
              {tree.length} {tree.length === 1 ? "item" : "itens"} no nível principal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[320px]">
            {tree.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MenuIcon size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Menu vazio</p>
              </div>
            ) : (
              tree.map(({ item }) => renderMenuItemRow(item))
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() =>
                addItems([
                  {
                    label: "Novo item",
                    url: "/",
                    icon: "",
                    target: "_self",
                    order: 0,
                    active: true,
                    highlight: false,
                    parentId: null,
                    _tempId: newMenuItemId(),
                  },
                ])
              }
            >
              <Plus size={14} className="mr-1" />
              Item em branco
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

