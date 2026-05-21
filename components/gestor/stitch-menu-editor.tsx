"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff, Save, Loader2, Check } from "lucide-react";
import type { StitchMenuItem } from "@/lib/stitch/menu-items";

interface Props {
  initialItems: StitchMenuItem[];
}

export function StitchMenuEditor({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const dirty = JSON.stringify(items) !== JSON.stringify(initialItems);

  const updateLabel = (idx: number, label: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, label } : it)));
  };
  const toggleVisible = (idx: number) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, visible: !it.visible } : it)));
  };
  const move = (idx: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((it, i) => ({ ...it, order: i }));
    });
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gestor/stitch-menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ type: i.type, label: i.label, visible: i.visible })),
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
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Itens do menu</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Editar labels reflete imediatamente no header de todas as páginas publicadas.
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
        {items.map((item, idx) => (
          <div key={item.type} className="px-5 py-3 flex items-center gap-3">
            <div className="flex flex-col text-gray-300">
              <button
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="text-xs leading-none hover:text-gray-700 disabled:opacity-30"
                title="Mover pra cima"
              >
                ▲
              </button>
              <button
                onClick={() => move(idx, +1)}
                disabled={idx === items.length - 1}
                className="text-xs leading-none hover:text-gray-700 disabled:opacity-30 mt-0.5"
                title="Mover pra baixo"
              >
                ▼
              </button>
            </div>

            <GripVertical size={14} className="text-gray-300 shrink-0" />

            <div className="flex-1 grid sm:grid-cols-[1fr_auto] gap-3 items-center">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateLabel(idx, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                disabled={busy}
              />
              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span className="font-mono">{item.route}</span>
                <button
                  onClick={() => toggleVisible(idx)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs ${
                    item.visible ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
                  }`}
                  title={item.visible ? "Visível" : "Oculto"}
                >
                  {item.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                  {item.visible ? "Visível" : "Oculto"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {status && (
        <div
          className={`mx-5 my-4 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
            status.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.ok ? <Check size={12} /> : null}
          {status.msg}
        </div>
      )}
    </div>
  );
}
