"use client";

import { THEME_PRESETS } from "@/lib/themes/presets";
import { Check, Sparkles } from "lucide-react";
import type { ThemeKey } from "../types";

interface Props {
  value: ThemeKey | null;
  onSelect: (k: ThemeKey) => void;
}

export function Step1Theme({ value, onSelect }: Props) {
  const themes = [
    { key: "m3" as ThemeKey, preset: THEME_PRESETS.m3 },
    { key: "bitdefender" as ThemeKey, preset: THEME_PRESETS.bitdefender },
  ];
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4">
          <Sparkles size={11} />
          Etapa 1 de 5
        </span>
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
          Comece escolhendo
          <br />
          <span className="text-gray-400">um ponto de partida</span>
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Cada tema pré-preenche cores, fontes, logo e textos da home. Você pode ajustar tudo nas próximas etapas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {themes.map((t) => {
          const isActive = value === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className={`group text-left bg-white rounded-3xl border-2 transition-all overflow-hidden ${
                isActive
                  ? "border-gray-900 shadow-2xl scale-[1.01]"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-xl"
              }`}
            >
              {isActive && (
                <span className="absolute mt-4 ml-4 z-10 inline-flex items-center gap-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  <Check size={10} />
                  Selecionado
                </span>
              )}
              <div
                className="relative h-48 p-7 flex flex-col justify-end"
                style={{
                  background: `linear-gradient(135deg, ${t.preset.preview.primary}, ${t.preset.preview.secondary})`,
                }}
              >
                <div
                  className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-30 blur-2xl"
                  style={{ backgroundColor: t.preset.preview.accent }}
                />
                <div className="absolute top-4 right-5 flex gap-1.5">
                  {[t.preset.preview.primary, t.preset.preview.secondary, t.preset.preview.accent].map((c) => (
                    <div
                      key={c}
                      className="w-5 h-5 rounded-full border-2 border-white/50"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/70 mb-1">
                    Tema
                  </div>
                  <div className="font-heading text-2xl font-bold text-white tracking-tight leading-tight">
                    {t.preset.name}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{t.preset.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Tag>Cores</Tag>
                  <Tag>Tipografia</Tag>
                  <Tag>Logo</Tag>
                  <Tag>Textos da home</Tag>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center bg-gray-100 text-gray-700 text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded">
      {children}
    </span>
  );
}
