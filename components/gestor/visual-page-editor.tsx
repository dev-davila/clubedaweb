"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Eye, Smartphone, Tablet, Monitor, Plus, Trash2,
  ChevronUp, ChevronDown, GripVertical, Loader2, Check, AlertCircle,
  PanelLeftClose, PanelLeftOpen, ExternalLink, Sparkles
} from "lucide-react";

interface Section {
  key: string;
  data: Record<string, any>;
  // Stable client id for React keys (since user may add same key twice)
  _id?: string;
}

interface SectionFieldSchema {
  key: string;
  type: string;
  label: string;
  placeholder?: string;
  options?: string[];
  itemSchema?: SectionFieldSchema[];
}

interface SectionDef {
  key: string;
  label: string;
  description?: string;
  fields: SectionFieldSchema[];
}

interface TemplateInfo {
  key: string;
  name: string;
  sections: Record<string, SectionDef>;
}

interface VisualPageEditorProps {
  pageId: string;
  slug: string;
  title: string;
  status: string;
  initialLayout: { template?: string; sections?: Section[] };
}

const VIEWPORTS = {
  desktop: { w: "100%", h: "100%", icon: Monitor, label: "Desktop" },
  tablet: { w: "768px", h: "1024px", icon: Tablet, label: "Tablet" },
  mobile: { w: "375px", h: "667px", icon: Smartphone, label: "Mobile" },
} as const;

type Viewport = keyof typeof VIEWPORTS;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function VisualPageEditor({ pageId, slug, title, status, initialLayout }: VisualPageEditorProps) {
  const [sections, setSections] = useState<Section[]>(
    () => (initialLayout.sections ?? []).map((s) => ({ ...s, _id: uid() }))
  );
  const templateKey = initialLayout.template ?? "m3-base";
  const [template, setTemplate] = useState<TemplateInfo | null>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [pageStatus, setPageStatus] = useState(status);
  const [showAdd, setShowAdd] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dirty, setDirty] = useState(false);

  // Load template manifest from server (fields)
  useEffect(() => {
    fetch(`/api/gestor/templates/${templateKey}`)
      .then((r) => r.json())
      .then((t) => {
        if (t && !t.error) setTemplate(t);
      })
      .catch(() => {});
  }, [templateKey]);

  const activeSection = sections[activeIdx];
  const activeDef = activeSection && template ? template.sections[activeSection.key] : null;

  function updateSectionData(idx: number, key: string, value: any) {
    setSections((s) => {
      const next = [...s];
      next[idx] = { ...next[idx], data: { ...next[idx].data, [key]: value } };
      return next;
    });
    setDirty(true);
  }

  function moveSection(idx: number, dir: -1 | 1) {
    setSections((s) => {
      const next = [...s];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return s;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setActiveIdx((i) => (i === idx ? idx + dir : i === idx + dir ? idx : i));
    setDirty(true);
  }

  function removeSection(idx: number) {
    if (!confirm("Remover esta seção?")) return;
    setSections((s) => s.filter((_, i) => i !== idx));
    setActiveIdx((i) => Math.max(0, i >= idx ? i - 1 : i));
    setDirty(true);
  }

  function addSection(key: string) {
    if (!template) return;
    const def = template.sections[key];
    if (!def) return;
    const blank: Record<string, any> = {};
    for (const f of def.fields) {
      blank[f.key] = f.type === "array" ? [] : f.type === "toggle" ? false : "";
    }
    setSections((s) => [...s, { key, data: blank, _id: uid() }]);
    setActiveIdx(sections.length);
    setShowAdd(false);
    setDirty(true);
  }

  async function save(publish?: boolean) {
    setSaving(true);
    setError(null);
    try {
      const layoutConfig = {
        ...initialLayout,
        template: templateKey,
        sections: sections.map(({ _id, ...rest }) => rest),
      };
      const body: any = { layoutConfig };
      if (publish) body.status = "PUBLISHED";
      const res = await fetch(`/api/gestor/dynamic-pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Falha ao salvar");
      }
      setSavedAt(new Date());
      setDirty(false);
      if (publish) setPageStatus("PUBLISHED");
      setIframeKey((k) => k + 1);
      setTimeout(() => setSavedAt(null), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Keyboard: Cmd/Ctrl+S = save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Listen for inline edits from the iframe (postMessage)
  // Paths supported: "0.title", "0.items.2.title", "0.items.2.benefits.0"
  useEffect(() => {
    function setDeep(obj: any, parts: string[], value: any): any {
      const [head, ...rest] = parts;
      if (rest.length === 0) {
        if (Array.isArray(obj)) {
          const idx = parseInt(head, 10);
          const next = [...obj];
          next[idx] = value;
          return next;
        }
        return { ...obj, [head]: value };
      }
      if (Array.isArray(obj)) {
        const idx = parseInt(head, 10);
        const next = [...obj];
        next[idx] = setDeep(next[idx] ?? {}, rest, value);
        return next;
      }
      return { ...obj, [head]: setDeep(obj?.[head] ?? (isNumeric(rest[0]) ? [] : {}), rest, value) };
    }
    function isNumeric(s: string) { return /^\d+$/.test(s); }

    function onMessage(e: MessageEvent) {
      const msg = e.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "EDIT_FIELD" && typeof msg.path === "string") {
        const parts = msg.path.split(".");
        const idx = parseInt(parts[0], 10);
        if (isNaN(idx) || parts.length < 2) return;
        setSections((s) => {
          const next = [...s];
          if (next[idx]) {
            next[idx] = {
              ...next[idx],
              data: setDeep(next[idx].data, parts.slice(1), msg.value),
            };
          }
          return next;
        });
        setActiveIdx(idx);
        setDirty(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const previewUrl = `/p/${slug}?_edit=1&_preview=${iframeKey}`;
  const vp = VIEWPORTS[viewport];

  return (
    <div className="fixed inset-0 z-[60] bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/gestor/editor"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition shrink-0"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition shrink-0"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900 truncate">{title}</h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  pageStatus === "PUBLISHED"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {pageStatus}
              </span>
              {dirty && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                  Não salvo
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 font-mono">/p/{slug}</div>
          </div>
        </div>

        {/* Viewport switch */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => {
            const V = VIEWPORTS[v];
            const Icon = V.icon;
            return (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className={`p-2 rounded-md transition ${
                  viewport === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
                title={V.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
              <Check size={12} />
              Salvo {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {error && (
            <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium">
              <AlertCircle size={12} />
              {error}
            </span>
          )}
          <a
            href={`/p/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            <ExternalLink size={14} />
            Abrir
          </a>
          <button
            onClick={() => save()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60"
          >
            {pageStatus === "PUBLISHED" ? "Atualizar" : "Publicar"}
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Seções ({sections.length})
              </h2>
              <button
                onClick={() => setShowAdd(true)}
                disabled={!template}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition disabled:opacity-40"
                title="Adicionar seção"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {sections.length === 0 && (
                <p className="px-4 py-6 text-xs text-gray-500 text-center">
                  Nenhuma seção. Clique no <Plus size={12} className="inline" /> pra adicionar.
                </p>
              )}
              {sections.map((s, idx) => {
                const def = template?.sections[s.key];
                const label = def?.label ?? s.key;
                const isActive = activeIdx === idx;
                return (
                  <div
                    key={s._id}
                    onClick={() => setActiveIdx(idx)}
                    className={`mx-2 mb-1 px-3 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 group transition ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <GripVertical
                      size={14}
                      className={`shrink-0 ${isActive ? "text-white/40" : "text-gray-300"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{label}</div>
                      <div className={`text-[10px] font-mono truncate ${isActive ? "text-white/60" : "text-gray-400"}`}>
                        {s.key}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }}
                        disabled={idx === 0}
                        className={`p-1 rounded hover:bg-white/10 disabled:opacity-30 ${isActive ? "text-white" : "text-gray-500"}`}
                        title="Subir"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }}
                        disabled={idx === sections.length - 1}
                        className={`p-1 rounded hover:bg-white/10 disabled:opacity-30 ${isActive ? "text-white" : "text-gray-500"}`}
                        title="Descer"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                        className={`p-1 rounded hover:bg-red-500/20 ${isActive ? "text-white" : "text-red-500"}`}
                        title="Remover"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add section drawer */}
            {showAdd && template && (
              <div className="border-t border-gray-200 max-h-72 overflow-y-auto">
                <div className="px-4 py-3 flex items-center justify-between bg-gray-50 sticky top-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Adicionar seção
                  </span>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Fechar
                  </button>
                </div>
                {Object.values(template.sections).map((def) => (
                  <button
                    key={def.key}
                    onClick={() => addSection(def.key)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition border-t border-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles size={12} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{def.label}</span>
                    </div>
                    {def.description && (
                      <div className="text-xs text-gray-500 mt-0.5 ml-5">{def.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-gray-200 p-4 flex items-start justify-center">
          <div
            className="bg-white shadow-2xl mx-auto transition-all duration-300"
            style={{
              width: vp.w,
              maxWidth: "100%",
              height: vp.w === "100%" ? "calc(100vh - 110px)" : vp.h,
              minHeight: "calc(100vh - 110px)",
            }}
          >
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        </main>

        {/* Right panel — fields */}
        <aside className="w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
          {!activeSection || !activeDef ? (
            <div className="flex-1 flex items-center justify-center text-center px-6 text-gray-500 text-sm">
              {sections.length === 0 ? (
                <span>Adicione uma seção pra começar.</span>
              ) : !template ? (
                <span>Carregando template…</span>
              ) : (
                <span>Selecione uma seção à esquerda pra editar.</span>
              )}
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-heading font-bold text-gray-900">{activeDef.label}</h2>
                {activeDef.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{activeDef.description}</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {activeDef.fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    field={f}
                    value={activeSection.data[f.key]}
                    onChange={(v) => updateSectionData(activeIdx, f.key, v)}
                  />
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// --- Field Inputs ---

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: SectionFieldSchema;
  value: any;
  onChange: (v: any) => void;
}) {
  const label = (
    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
      {field.label}
    </label>
  );

  switch (field.type) {
    case "text":
      return (
        <div>
          {label}
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
          />
        </div>
      );
    case "textarea":
    case "richtext":
      return (
        <div>
          {label}
          <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={field.type === "richtext" ? 8 : 4}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition resize-y"
          />
        </div>
      );
    case "image":
      return (
        <div>
          {label}
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "URL da imagem"}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition font-mono"
          />
          {value && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={value} alt="preview" className="max-h-32 mx-auto" />
            </div>
          )}
        </div>
      );
    case "color":
      return (
        <div>
          {label}
          <div className="flex gap-2">
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
            />
          </div>
        </div>
      );
    case "select":
      return (
        <div>
          {label}
          <select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-900"
          >
            {(field.options ?? []).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      );
    case "toggle":
      return (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-700">{field.label}</span>
          <button
            onClick={() => onChange(!value)}
            className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-gray-900" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : ""}`} />
          </button>
        </div>
      );
    case "array":
      return (
        <ArrayField
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );
    default:
      return (
        <div>
          {label}
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
      );
  }
}

function ArrayField({
  field,
  value,
  onChange,
}: {
  field: SectionFieldSchema;
  value: any[];
  onChange: (v: any[]) => void;
}) {
  const itemSchema = field.itemSchema ?? [{ key: "value", type: "text", label: "Valor" }];
  const isPrimitive = itemSchema.length === 1 && (itemSchema[0].type === "text" || itemSchema[0].type === "toggle");

  function emptyItem() {
    if (isPrimitive) return itemSchema[0].type === "toggle" ? false : "";
    const obj: Record<string, any> = {};
    for (const f of itemSchema) {
      obj[f.key] = f.type === "array" ? [] : f.type === "toggle" ? false : "";
    }
    return obj;
  }

  function update(i: number, v: any) {
    const next = [...value];
    next[i] = v;
    onChange(next);
  }
  function remove(i: number) {
    onChange(value.filter((_, x) => x !== i));
  }
  function add() {
    onChange([...value, emptyItem()]);
  }
  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= value.length) return;
    const next = [...value];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
        {field.label}
      </label>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                #{i + 1}
              </span>
              <div className="flex items-center gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                  <ChevronUp size={12} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === value.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30">
                  <ChevronDown size={12} />
                </button>
                <button onClick={() => remove(i)} className="p-1 rounded hover:bg-red-100 text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            {isPrimitive ? (
              <FieldInput
                field={itemSchema[0]}
                value={item}
                onChange={(v) => update(i, v)}
              />
            ) : (
              <div className="space-y-2">
                {itemSchema.map((sf) => (
                  <FieldInput
                    key={sf.key}
                    field={sf}
                    value={(item as Record<string, any>)?.[sf.key]}
                    onChange={(v) => update(i, { ...(item as object), [sf.key]: v })}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition"
      >
        <Plus size={14} />
        Adicionar item
      </button>
    </div>
  );
}
