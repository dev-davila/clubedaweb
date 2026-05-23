"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff, Save, Loader2, Check, Plus, Trash2, ExternalLink } from "lucide-react";
import type { StitchMenuItem } from "@/lib/stitch/menu-items";

interface AvailablePage {
  slug: string;
  label: string;
}

interface Props {
  initialItems: StitchMenuItem[];
  availablePages: AvailablePage[];
}

export function StitchMenuEditor({ initialItems, availablePages }: Props) {
  const [items, setItems] = useState(initialItems);
  const [outOfMenu, setOutOfMenu] = useState(availablePages);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dirty =
    JSON.stringify(items) !== JSON.stringify(initialItems) ||
    JSON.stringify(outOfMenu) !== JSON.stringify(availablePages);

  const updateLabel = (idx: number, label: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, label } : it)));
  };
  const toggleVisible = (idx: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, visible: !it.visible } : it)));
  };

  const addToMenu = (slug: string, label: string) => {
    const route = `/${slug}`;
    if (items.some((i) => i.route === route)) return;
    setItems((prev) => {
      const contactIdx = prev.findIndex((p) => p.type === "contact");
      const newItem: StitchMenuItem = {
        type: "custom",
        label,
        route,
        order: 0,
        visible: true,
      };
      const inserted = contactIdx >= 0
        ? [...prev.slice(0, contactIdx), newItem, ...prev.slice(contactIdx)]
        : [...prev, newItem];
      return inserted.map((it, i) => ({ ...it, order: i }));
    });
    setOutOfMenu((prev) => prev.filter((p) => p.slug !== slug));
  };

  const removeFromMenu = (idx: number) => {
    const item = items[idx];
    if (!item || item.type !== "custom") return;
    const slug = item.route.replace(/^\//, "");
    setItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i })));
    setOutOfMenu((prev) => [...prev, { slug, label: item.label }]);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next.map((it, i) => ({ ...it, order: i }));
    });
    setDragIdx(null);
    setOverIdx(null);
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gestor/stitch-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            type: i.type,
            label: i.label,
            route: i.route,
            visible: i.visible,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha");
      setStatus({ ok: true, msg: "Menu salvo. As mudanças aparecem em todo o site publicado." });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL — Itens do menu */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Itens do menu</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Arraste pra reordenar. Edite o texto exibido no header. Mudanças refletem no site após salvar.
            </p>
          </div>
          <button
            onClick={save}
            disabled={busy || !dirty}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar menu
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item, idx) => {
            const isCustom = item.type === "custom";
            const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
            const isDragging = dragIdx === idx;
            return (
              <div
                key={item.route || item.type}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={() => setOverIdx(null)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                className={`px-5 py-3 flex items-center gap-3 transition ${
                  isOver ? "bg-emerald-50 ring-2 ring-emerald-300 ring-inset" : ""
                } ${isDragging ? "opacity-40" : ""}`}
              >
                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0" title="Arraste pra reordenar">
                  <GripVertical size={18} />
                </div>

                <span className="text-[10px] uppercase font-bold tracking-wide text-gray-400 w-6 shrink-0">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateLabel(idx, e.target.value)}
                    placeholder="Texto exibido no menu"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                    disabled={busy}
                  />
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <a
                      href={item.route}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      title="Abrir no site"
                    >
                      {item.route}
                      <ExternalLink size={10} />
                    </a>
                    <button
                      onClick={() => toggleVisible(idx)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition ${
                        item.visible
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      title={item.visible ? "Visível no menu" : "Oculto"}
                    >
                      {item.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                      {item.visible ? "Visível" : "Oculto"}
                    </button>
                    {isCustom && (
                      <button
                        onClick={() => removeFromMenu(idx)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-600 hover:bg-red-50"
                        title="Remover do menu (página continua publicada)"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {status && (
          <div
            className={`mx-5 my-4 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
              status.ok
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {status.ok ? <Check size={12} /> : null}
            {status.msg}
          </div>
        )}
      </div>

      {/* SEÇÃO — Páginas disponíveis fora do menu */}
      {outOfMenu.length > 0 && (
        <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/30 p-5">
          <h3 className="font-semibold text-emerald-900 text-sm mb-1">
            Páginas publicadas mas fora do menu ({outOfMenu.length})
          </h3>
          <p className="text-xs text-emerald-800/70 mb-3">
            Páginas customizadas criadas em <span className="font-mono">/gestor/paginas</span> que ainda não aparecem no header. Clique em <strong>+</strong> pra adicionar.
          </p>
          <div className="flex flex-wrap gap-2">
            {outOfMenu.map((p) => (
              <button
                key={p.slug}
                onClick={() => addToMenu(p.slug, p.label)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-900 text-sm font-medium hover:bg-emerald-100 hover:border-emerald-400 transition"
              >
                <Plus size={13} />
                {p.label}
                <span className="font-mono text-[11px] text-emerald-700/60">/{p.slug}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
