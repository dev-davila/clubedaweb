"use client";

import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import type { WizardData } from "../types";

interface Props {
  items: WizardData["partners"];
  onChange: (items: WizardData["partners"]) => void;
}

export function Step4Partners({ items, onChange }: Props) {
  function add() {
    onChange([...items, { name: "", logoUrl: "" }]);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function update(i: number, key: keyof WizardData["partners"][number], value: string) {
    const next = [...items];
    next[i] = { ...next[i], [key]: value };
    onChange(next);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
          Parceiros
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Logos que aparecem no carrossel da home. Cole a URL da imagem ou um nome de placeholder.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-gray-900">
            Lista de parceiros <span className="text-gray-400 text-sm">({items.length})</span>
          </h3>
          <button
            onClick={add}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <Plus size={13} />
            Adicionar parceiro
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
            <ImageIcon className="mx-auto mb-3 text-gray-300" size={32} />
            <p className="text-sm text-gray-500">Nenhum parceiro. Clique em "Adicionar".</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((p, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center gap-3"
              >
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt={p.name} className="max-w-[80%] max-h-[80%] object-contain" />
                  ) : (
                    <ImageIcon size={20} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    placeholder="Nome do parceiro"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900"
                  />
                  <input
                    type="text"
                    value={p.logoUrl}
                    onChange={(e) => update(i, "logoUrl", e.target.value)}
                    placeholder="URL do logo"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-mono bg-white focus:outline-none focus:border-gray-900"
                  />
                </div>
                <button
                  onClick={() => remove(i)}
                  className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition shrink-0"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
