"use client";

import { Check, Sparkles, ArrowRight, Building2, Palette, Layout, Users, Globe } from "lucide-react";
import { THEME_PRESETS } from "@/lib/themes/presets";
import type { WizardData } from "../types";

interface Props {
  data: WizardData;
  onApply: () => void;
  applying: boolean;
  applied: boolean;
}

export function Step5Review({ data, onApply, applying, applied }: Props) {
  const preset = data.theme ? THEME_PRESETS[data.theme === "bitdefender" ? "bitdefender" : "m3"] : null;
  const primary = preset?.preview.primary ?? "#3B82F6";
  const accent = preset?.preview.accent ?? "#10B981";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
          Tudo pronto pra publicar?
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Confira o resumo abaixo. Ao aplicar, seu site fica publicado com essa configuração.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Mini preview */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-gray-400 font-mono truncate">
              {data.identity.companyName.toLowerCase().replace(/\s+/g, "")}.com.br
            </span>
          </div>
          {/* Hero mock */}
          <div
            className="p-7 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${primary}, ${preset?.preview.secondary})` }}
          >
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-25 blur-2xl" style={{ backgroundColor: accent }} />
            <div className="relative text-white">
              {data.home.badge && (
                <span className="inline-block bg-white/15 backdrop-blur text-[10px] uppercase tracking-[0.18em] font-bold px-2.5 py-1 rounded-full mb-3">
                  {data.home.badge}
                </span>
              )}
              <h3 className="font-heading text-2xl font-bold leading-tight max-w-md">
                {data.home.title.split("{highlight}").map((p, i, a) => (
                  <span key={i}>
                    {p}
                    {i < a.length - 1 && (
                      <span style={{ color: accent }}>{data.home.titleHighlight}</span>
                    )}
                  </span>
                ))}
              </h3>
              <p className="text-sm text-white/85 mt-2 max-w-md line-clamp-2">{data.home.subtitle}</p>
              <div className="flex gap-2 mt-4">
                {data.home.ctaPrimaryText && (
                  <span className="inline-flex items-center bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg">
                    {data.home.ctaPrimaryText}
                  </span>
                )}
                {data.home.ctaSecondaryText && (
                  <span className="inline-flex items-center bg-white/15 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/30">
                    {data.home.ctaSecondaryText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Services preview */}
          <div className="p-5 bg-gray-50 border-t border-gray-200">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3">
              Edições / Serviços
            </div>
            <div className="grid grid-cols-3 gap-2">
              {data.home.services.slice(0, 3).map((s, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="w-7 h-7 rounded-md mb-2" style={{ backgroundColor: primary }} />
                  <div className="text-xs font-semibold text-gray-900 truncate">{s.title}</div>
                  <div className="text-[10px] text-gray-500 line-clamp-2">{s.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Partners preview */}
          {data.partners.length > 0 && (
            <div className="p-5 border-t border-gray-200">
              <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3">
                Parceiros
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                {data.partners.slice(0, 5).map((p, i) => (
                  <div key={i} className="h-7 px-3 rounded bg-gray-100 text-[10px] font-bold text-gray-500 flex items-center">
                    {p.name || `#${i + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="lg:col-span-5 space-y-3">
          <SummaryCard
            icon={<Palette size={16} />}
            title="Tema"
            value={preset?.name ?? "—"}
            extra={
              <div className="flex gap-1 mt-2">
                {preset && [preset.preview.primary, preset.preview.secondary, preset.preview.accent].map((c) => (
                  <div key={c} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                ))}
              </div>
            }
          />
          <SummaryCard
            icon={<Building2 size={16} />}
            title="Identidade"
            value={data.identity.companyName || "—"}
            sub={data.identity.tagline}
          />
          <SummaryCard
            icon={<Layout size={16} />}
            title="Home"
            value={`${data.home.services.length} serviços · ${data.home.features.length} diferenciais · ${data.home.testimonials.length} depoimentos`}
          />
          <SummaryCard
            icon={<Users size={16} />}
            title="Parceiros"
            value={`${data.partners.length} parceiros`}
          />
          <SummaryCard
            icon={<Globe size={16} />}
            title="Google Search Console"
            value={data.google.property ? "Conectado" : "Não conectado"}
            sub={data.google.property || "Configure depois em SEO > Google"}
          />
        </div>
      </div>

      {/* Apply */}
      <div className="mt-8 text-center">
        {applied ? (
          <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3 text-green-700">
            <Check size={18} />
            <span className="font-semibold">Site configurado! Redirecionando…</span>
          </div>
        ) : (
          <>
            <button
              onClick={onApply}
              disabled={applying || !data.theme || !data.identity.companyName}
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl disabled:opacity-60 disabled:hover:scale-100"
            >
              {applying ? (
                <>
                  <Sparkles size={18} className="animate-pulse" />
                  Aplicando configuração…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Aplicar e ir pro site
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              Demo — visualiza tudo no site. Edições finas no Editor Visual e Aparência.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  sub,
  extra,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">
        <span className="text-gray-400">{icon}</span>
        {title}
      </div>
      <div className="font-heading font-bold text-gray-900 text-sm">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{sub}</div>}
      {extra}
    </div>
  );
}
