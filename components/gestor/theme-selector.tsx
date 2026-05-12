"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, Eye, AlertCircle } from "lucide-react";

interface ThemeItem {
  key: string;
  name: string;
  tagline: string;
  description: string;
  preview: { primary: string; secondary: string; accent: string; bg: string };
}

export function ThemeSelector() {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/gestor/themes");
    const data = await res.json();
    setThemes(data.themes ?? []);
    setActive(data.active ?? null);
  }
  useEffect(() => { load(); }, []);

  async function apply(key: string) {
    setApplying(key);
    setSuccess(null);
    try {
      const res = await fetch("/api/gestor/themes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeKey: key }),
      });
      if (res.ok) {
        setSuccess(key);
        setActive(key);
        setConfirmKey(null);
        setTimeout(() => setSuccess(null), 3500);
      } else {
        alert("Falha ao aplicar tema");
      }
    } finally {
      setApplying(null);
    }
  }

  return (
    <>
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center text-white">
            <Check size={18} />
          </div>
          <div>
            <div className="font-semibold text-green-900">Tema aplicado!</div>
            <div className="text-sm text-green-700">
              Abra o site em outra aba pra ver as mudanças. Atualize com Cmd/Ctrl+Shift+R.
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {themes.map((t) => {
          const isActive = active === t.key;
          const isApplying = applying === t.key;
          return (
            <div
              key={t.key}
              className={`relative bg-white rounded-3xl border-2 transition-all overflow-hidden ${
                isActive ? "border-gray-900 shadow-2xl" : "border-gray-200 hover:border-gray-300 hover:shadow-xl"
              }`}
            >
              {isActive && (
                <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                  <Check size={12} />
                  Ativo
                </span>
              )}

              {/* Visual preview block */}
              <div
                className="relative h-44 p-6 flex flex-col justify-end overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${t.preview.primary}, ${t.preview.secondary})`,
                }}
              >
                <div
                  className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-30 blur-2xl"
                  style={{ backgroundColor: t.preview.accent }}
                />
                <div
                  className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20 blur-2xl"
                  style={{ backgroundColor: "#FFFFFF" }}
                />
                <div className="relative">
                  <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
                    {t.name}
                  </div>
                  <div className="text-xl font-heading font-bold text-white tracking-tight leading-tight max-w-xs">
                    {t.tagline}
                  </div>
                </div>

                {/* Color swatches */}
                <div className="absolute top-4 left-6 flex gap-1.5">
                  {[t.preview.primary, t.preview.secondary, t.preview.accent].map((c) => (
                    <div
                      key={c}
                      className="w-6 h-6 rounded-full border-2 border-white/40"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  {t.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6 text-xs">
                  <Tag label="Cores" />
                  <Tag label="Tipografia" />
                  <Tag label="Logos" />
                  <Tag label="Conteúdo da home" />
                  <Tag label="Nome do site" />
                </div>

                <div className="flex gap-2">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Eye size={14} />
                    Ver site
                  </a>
                  <button
                    onClick={() => isActive ? null : setConfirmKey(t.key)}
                    disabled={isActive || !!isApplying}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "bg-gray-100 text-gray-400 cursor-default"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    } disabled:opacity-60`}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Aplicando...
                      </>
                    ) : isActive ? (
                      "Tema ativo"
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Aplicar tema
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm dialog */}
              {confirmKey === t.key && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 z-20">
                  <div className="text-center max-w-xs">
                    <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center mb-4">
                      <AlertCircle className="text-amber-600" size={22} />
                    </div>
                    <h4 className="font-heading font-bold text-gray-900 mb-2">
                      Aplicar tema {t.name}?
                    </h4>
                    <p className="text-sm text-gray-600 mb-5">
                      Vai sobrescrever cores, fontes, logos, nome do site e conteúdo da home.
                      Edições manuais que você fez serão substituídas.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmKey(null)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => apply(t.key)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-6 max-w-3xl">
        Após aplicar, abra o site numa aba e atualize com <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-mono">Cmd/Ctrl+Shift+R</kbd> pra forçar o recarregamento das fontes e cache.
      </p>
    </>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
      {label}
    </span>
  );
}
