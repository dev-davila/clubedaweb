"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, Check } from "lucide-react";
import type { ThemeBrand } from "@/lib/theme-config";

const FONT_OPTIONS = [
  { label: "Inter (Padrão)", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
  { label: "Nunito", value: "Nunito, sans-serif" },
];

const PRESETS: { name: string; brand: Partial<ThemeBrand> }[] = [
  {
    name: "M3 Azul",
    brand: { primaryColor: "#3B82F6", secondaryColor: "#1E40AF", accentColor: "#10B981" },
  },
  {
    name: "Bitdefender",
    brand: { primaryColor: "#CC0000", secondaryColor: "#8B0000", accentColor: "#3B82F6" },
  },
  {
    name: "Verde Corporativo",
    brand: { primaryColor: "#059669", secondaryColor: "#047857", accentColor: "#F59E0B" },
  },
  {
    name: "Roxo Premium",
    brand: { primaryColor: "#7C3AED", secondaryColor: "#5B21B6", accentColor: "#F59E0B" },
  },
];

function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return "0 0% 0%";
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function readableForeground(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (full.length !== 6) return "0 0% 100%";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.6 ? "222 47% 11%" : "0 0% 100%";
}

function radiusToRem(value: string): string {
  const trimmed = value.trim();
  if (trimmed.endsWith("rem") || trimmed.endsWith("em")) return trimmed;
  if (trimmed.endsWith("px")) {
    const n = parseFloat(trimmed);
    if (!isNaN(n)) return `${n / 16}rem`;
  }
  const n = parseFloat(trimmed);
  return isNaN(n) ? "0.5rem" : `${n / 16}rem`;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-10 px-3 rounded border border-gray-300 font-mono text-sm"
        />
      </div>
    </div>
  );
}

function TextField({
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded border border-gray-300 text-sm"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded border border-gray-300 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function BrandEditor({ initial }: { initial: ThemeBrand }) {
  const [brand, setBrand] = useState<ThemeBrand>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const previewStyle = useMemo(() => {
    return {
      "--brand-primary-hsl": hexToHsl(brand.primaryColor),
      "--brand-primary-fg": readableForeground(brand.primaryColor),
      "--brand-secondary-hsl": hexToHsl(brand.secondaryColor),
      "--brand-accent-hsl": hexToHsl(brand.accentColor),
      "--brand-bg": brand.backgroundColor,
      "--brand-surface": brand.surfaceColor,
      "--brand-text": brand.textColor,
      "--brand-text-light": brand.textLightColor,
      "--brand-radius": radiusToRem(brand.borderRadius),
      fontFamily: brand.fontPrimary,
    } as React.CSSProperties;
  }, [brand]);

  function update<K extends keyof ThemeBrand>(key: K, value: ThemeBrand[K]) {
    setBrand((b) => ({ ...b, [key]: value }));
    setSaved(false);
  }

  function applyPreset(p: Partial<ThemeBrand>) {
    setBrand((b) => ({ ...b, ...p }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/gestor/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert("Falha ao salvar");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-6">
        {/* Presets */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Presets rápidos</h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p.brand)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-400 transition flex items-center gap-2"
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: p.brand.primaryColor }}
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Cores */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Paleta de cores</h3>
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Primária" value={brand.primaryColor} onChange={(v) => update("primaryColor", v)} />
            <ColorField label="Secundária" value={brand.secondaryColor} onChange={(v) => update("secondaryColor", v)} />
            <ColorField label="Acento" value={brand.accentColor} onChange={(v) => update("accentColor", v)} />
            <ColorField label="Texto" value={brand.textColor} onChange={(v) => update("textColor", v)} />
            <ColorField label="Texto claro" value={brand.textLightColor} onChange={(v) => update("textLightColor", v)} />
            <ColorField label="Fundo" value={brand.backgroundColor} onChange={(v) => update("backgroundColor", v)} />
            <ColorField label="Superfície" value={brand.surfaceColor} onChange={(v) => update("surfaceColor", v)} />
          </div>
        </div>

        {/* Tipografia */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Tipografia</h3>
          <div className="grid grid-cols-1 gap-4">
            <SelectField
              label="Fonte de títulos"
              value={brand.fontHeading}
              onChange={(v) => update("fontHeading", v)}
              options={FONT_OPTIONS}
            />
            <SelectField
              label="Fonte do corpo"
              value={brand.fontPrimary}
              onChange={(v) => update("fontPrimary", v)}
              options={FONT_OPTIONS}
            />
          </div>
        </div>

        {/* Logos */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Logos</h3>
          <TextField
            label="Logo principal (URL)"
            value={brand.logoUrl ?? ""}
            onChange={(v) => update("logoUrl", v || null)}
            placeholder="/images/logo.svg"
          />
          <TextField
            label="Logo claro (fundos escuros)"
            value={brand.logoLightUrl ?? ""}
            onChange={(v) => update("logoLightUrl", v || null)}
            placeholder="/images/logo-light.svg"
          />
          <TextField
            label="Ícone (favicon/menu mobile)"
            value={brand.logoIconUrl ?? ""}
            onChange={(v) => update("logoIconUrl", v || null)}
            placeholder="/favicon.svg"
          />
        </div>

        {/* Estilo */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">Estilo</h3>
          <TextField
            label="Raio de borda (px ou rem)"
            value={brand.borderRadius}
            onChange={(v) => update("borderRadius", v)}
            placeholder="8px"
          />
          <SelectField
            label="Tipo de estilo"
            value={brand.styleType}
            onChange={(v) => update("styleType", v)}
            options={[
              { label: "Corporativo", value: "corporate" },
              { label: "Moderno", value: "modern" },
              { label: "Minimalista", value: "minimal" },
              { label: "Tecnológico", value: "tech" },
            ]}
          />
          <SelectField
            label="Estilo de botões"
            value={brand.buttonStyle}
            onChange={(v) => update("buttonStyle", v)}
            options={[
              { label: "Arredondado", value: "rounded" },
              { label: "Quadrado", value: "square" },
              { label: "Pílula", value: "pill" },
            ]}
          />
        </div>

        {/* Actions */}
        <div className="sticky bottom-4 flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition"
            style={{
              backgroundColor: brand.primaryColor,
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar e aplicar"}
          </button>
          <button
            onClick={() => setBrand(initial)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-sm"
          >
            <RotateCcw size={16} />
            Reverter
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-4 self-start">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Pré-visualização</h3>
          <div
            style={previewStyle}
            className="rounded-xl overflow-hidden border border-gray-200"
          >
            {/* Header mock */}
            <div
              style={{
                backgroundColor: brand.backgroundColor,
                color: brand.textColor,
              }}
              className="flex items-center justify-between px-5 py-4 border-b border-gray-200"
            >
              <div className="flex items-center gap-2">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt="logo" className="h-7" />
                ) : (
                  <span className="font-bold" style={{ color: brand.primaryColor }}>
                    M3 <span style={{ color: brand.textColor }}>Solutions</span>
                  </span>
                )}
              </div>
              <button
                style={{
                  backgroundColor: brand.primaryColor,
                  color: "#fff",
                  borderRadius: radiusToRem(brand.borderRadius),
                }}
                className="px-4 py-2 text-sm font-medium"
              >
                Fale Conosco
              </button>
            </div>

            {/* Hero mock */}
            <div
              style={{
                backgroundImage: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`,
                color: "#fff",
              }}
              className="p-8"
            >
              <span
                className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: "rgba(255,255,255,.18)" }}
              >
                Soluções em TI
              </span>
              <h2 className="text-2xl font-bold leading-tight mb-3" style={{ fontFamily: brand.fontHeading }}>
                Transforme sua empresa com{" "}
                <span style={{ color: brand.accentColor }}>tecnologia</span>
              </h2>
              <p className="text-sm opacity-90 mb-4">
                Consultoria, NOC, Multicloud e Segurança.
              </p>
              <div className="flex gap-2">
                <button
                  style={{
                    backgroundColor: brand.accentColor,
                    color: "#fff",
                    borderRadius: radiusToRem(brand.borderRadius),
                  }}
                  className="px-4 py-2 text-sm font-medium"
                >
                  Solicitar orçamento
                </button>
                <button
                  style={{
                    backgroundColor: "rgba(255,255,255,.15)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,.3)",
                    borderRadius: radiusToRem(brand.borderRadius),
                  }}
                  className="px-4 py-2 text-sm font-medium"
                >
                  Saiba mais
                </button>
              </div>
            </div>

            {/* Cards mock */}
            <div
              style={{ backgroundColor: brand.surfaceColor }}
              className="grid grid-cols-2 gap-3 p-5"
            >
              {["Consultoria", "NOC 24x7"].map((t) => (
                <div
                  key={t}
                  className="p-4"
                  style={{
                    backgroundColor: brand.backgroundColor,
                    borderRadius: radiusToRem(brand.borderRadius),
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    className="w-9 h-9 mb-2 flex items-center justify-center"
                    style={{
                      backgroundColor: brand.primaryColor + "20",
                      borderRadius: radiusToRem(brand.borderRadius),
                    }}
                  >
                    <span style={{ color: brand.primaryColor }}>★</span>
                  </div>
                  <h4
                    className="font-semibold text-sm"
                    style={{ color: brand.textColor, fontFamily: brand.fontHeading }}
                  >
                    {t}
                  </h4>
                  <p className="text-xs mt-1" style={{ color: brand.textLightColor }}>
                    Soluções para sua empresa
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Esta é uma prévia local — clique em <strong>Salvar e aplicar</strong> para refletir no site.
          </p>
        </div>
      </div>
    </div>
  );
}
