"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Sparkles, Star } from "lucide-react";
import type { WizardData } from "../types";

interface Props {
  data: WizardData["home"];
  onChange: <K extends keyof WizardData["home"]>(key: K, value: WizardData["home"][K]) => void;
}

const TABS = [
  { key: "hero", label: "Hero" },
  { key: "services", label: "Edições / Serviços" },
  { key: "features", label: "Diferenciais" },
  { key: "testimonials", label: "Depoimentos" },
] as const;

export function Step3Home({ data, onChange }: Props) {
  const [tab, setTab] = useState<typeof TABS[number]["key"]>("hero");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
          Conteúdo da home
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          As 4 áreas que mais importam na primeira impressão. Cada uma vem pré-preenchida do tema.
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-full p-1 inline-flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                tab === t.key ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
        {tab === "hero" && <HeroPanel data={data} onChange={onChange} />}
        {tab === "services" && (
          <ArrayPanel
            label="Edições / Serviços"
            items={data.services}
            onChange={(items) => onChange("services", items)}
            fields={[
              { key: "icon", label: "Ícone (lucide)", placeholder: "Shield" },
              { key: "title", label: "Título" },
              { key: "description", label: "Descrição", type: "textarea" },
            ]}
            empty={{ icon: "Shield", title: "", description: "" }}
            max={6}
          />
        )}
        {tab === "features" && (
          <ArrayPanel
            label="Diferenciais"
            items={data.features}
            onChange={(items) => onChange("features", items)}
            fields={[
              { key: "icon", label: "Ícone (lucide)", placeholder: "Award" },
              { key: "title", label: "Título" },
              { key: "description", label: "Descrição", type: "textarea" },
            ]}
            empty={{ icon: "Award", title: "", description: "" }}
            max={9}
          />
        )}
        {tab === "testimonials" && (
          <ArrayPanel
            label="Depoimentos"
            items={data.testimonials}
            onChange={(items) => onChange("testimonials", items)}
            fields={[
              { key: "name", label: "Nome" },
              { key: "role", label: "Cargo" },
              { key: "company", label: "Empresa" },
              { key: "content", label: "Depoimento", type: "textarea" },
              { key: "rating", label: "Estrelas (1-5)", type: "rating" },
            ]}
            empty={{ name: "", role: "", company: "", content: "", rating: 5 }}
            max={6}
          />
        )}
      </div>
    </div>
  );
}

function HeroPanel({
  data,
  onChange,
}: {
  data: WizardData["home"];
  onChange: <K extends keyof WizardData["home"]>(key: K, value: WizardData["home"][K]) => void;
}) {
  return (
    <div className="space-y-5">
      <Text label="Tag / Badge superior" value={data.badge} onChange={(v) => onChange("badge", v)} placeholder="PROTEÇÃO BITDEFENDER" />
      <Text
        label="Título (use {highlight} pra destacar uma palavra)"
        value={data.title}
        onChange={(v) => onChange("title", v)}
        placeholder="Segurança que {highlight} ataques"
      />
      <Text
        label="Palavra destacada"
        value={data.titleHighlight}
        onChange={(v) => onChange("titleHighlight", v)}
        placeholder="antecipa"
      />
      <Textarea
        label="Subtítulo"
        value={data.subtitle}
        onChange={(v) => onChange("subtitle", v)}
        rows={3}
      />
      <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
        <Text label="CTA primário (texto)" value={data.ctaPrimaryText} onChange={(v) => onChange("ctaPrimaryText", v)} />
        <Text label="CTA primário (link)" value={data.ctaPrimaryLink} onChange={(v) => onChange("ctaPrimaryLink", v)} />
        <Text label="CTA secundário (texto)" value={data.ctaSecondaryText} onChange={(v) => onChange("ctaSecondaryText", v)} />
        <Text label="CTA secundário (link)" value={data.ctaSecondaryLink} onChange={(v) => onChange("ctaSecondaryLink", v)} />
      </div>
      <Text
        label="Imagem de fundo (URL)"
        value={data.backgroundImage}
        onChange={(v) => onChange("backgroundImage", v)}
        placeholder="https://..."
      />
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition resize-y"
      />
    </div>
  );
}

type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "rating";
};

function ArrayPanel<T extends Record<string, any>>({
  label,
  items,
  onChange,
  fields,
  empty,
  max = 10,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  fields: FieldDef[];
  empty: T;
  max?: number;
}) {
  const [open, setOpen] = useState<number | null>(0);

  function add() {
    if (items.length >= max) return;
    onChange([...items, { ...empty }]);
    setOpen(items.length);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const t = i + dir;
    if (t < 0 || t >= items.length) return;
    const next = [...items];
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  }
  function update(i: number, key: string, value: any) {
    const next = [...items];
    next[i] = { ...next[i], [key]: value };
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-gray-900">
          {label} <span className="text-gray-400 text-sm">({items.length})</span>
        </h3>
        <button
          onClick={add}
          disabled={items.length >= max}
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
        >
          <Plus size={12} />
          Adicionar
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl">
          Nenhum item. Clique em "Adicionar".
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical size={14} className="text-gray-300 shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  #{i + 1}
                </span>
                <span className="font-semibold text-sm text-gray-900 truncate">
                  {item.title || item.name || item.content?.slice(0, 30) || `Item ${i + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <span
                  className="p-1 rounded hover:bg-gray-200 text-gray-500"
                  onClick={(e) => { e.stopPropagation(); move(i, -1); }}
                >
                  <ChevronUp size={12} />
                </span>
                <span
                  className="p-1 rounded hover:bg-gray-200 text-gray-500"
                  onClick={(e) => { e.stopPropagation(); move(i, 1); }}
                >
                  <ChevronDown size={12} />
                </span>
                <span
                  className="p-1 rounded hover:bg-red-100 text-red-500"
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                >
                  <Trash2 size={12} />
                </span>
              </div>
            </button>
            {open === i && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50/50">
                {fields.map((f) => (
                  <FieldRow key={f.key} field={f} value={item[f.key]} onChange={(v) => update(i, f.key, v)} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  const label = (
    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">
      {field.label}
    </label>
  );
  if (field.type === "textarea") {
    return (
      <div>
        {label}
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900"
        />
      </div>
    );
  }
  if (field.type === "rating") {
    return (
      <div>
        {label}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="p-1"
            >
              <Star
                size={18}
                className={n <= (value || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-gray-900"
      />
    </div>
  );
}
