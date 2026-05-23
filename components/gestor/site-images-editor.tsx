"use client";

import { useState } from "react";
import { Check, Loader2, ImageIcon, Globe, Share2 } from "lucide-react";

interface Initial {
  logo_url: string;
  favicon_url: string;
  og_image_url: string;
}

interface Props {
  initial: Initial;
}

interface FieldDef {
  key: keyof Initial;
  label: string;
  hint: string;
  placeholder: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  previewSize: "sm" | "md" | "lg";
}

const FIELDS: FieldDef[] = [
  {
    key: "logo_url",
    label: "Logo",
    hint: "Imagem que aparece no header de todas as páginas. PNG ou SVG com fundo transparente.",
    placeholder: "https://exemplo.com/logo.svg",
    icon: ImageIcon,
    previewSize: "lg",
  },
  {
    key: "favicon_url",
    label: "Favicon",
    hint: "Ícone que aparece na aba do navegador. Idealmente 32×32 ou 64×64 PNG/ICO.",
    placeholder: "https://exemplo.com/favicon.png",
    icon: Globe,
    previewSize: "sm",
  },
  {
    key: "og_image_url",
    label: "Imagem de compartilhamento",
    hint: "Imagem mostrada quando o site é compartilhado no WhatsApp, Facebook, LinkedIn. Ideal 1200×630.",
    placeholder: "https://exemplo.com/og-image.png",
    icon: Share2,
    previewSize: "md",
  },
];

export function SiteImagesEditor({ initial }: Props) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gestor/site-appearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: values.logo_url.trim(),
          favicon_url: values.favicon_url.trim(),
          og_image_url: values.og_image_url.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha ao salvar");
      setStatus({
        ok: true,
        msg: data.updatedPages
          ? `Imagens salvas · ${data.updatedPages} página(s) atualizadas no site publicado`
          : "Imagens salvas",
      });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Imagens do site</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Logo, favicon e imagem de compartilhamento aplicam-se a todas as páginas.
          </p>
        </div>
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Salvar imagens
        </button>
      </div>

      <div className="p-5 space-y-5">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          const url = values[f.key];
          const previewClasses =
            f.previewSize === "sm"
              ? "h-8 w-8"
              : f.previewSize === "md"
              ? "h-16 w-auto max-w-[160px]"
              : "h-12 w-auto max-w-[220px]";
          return (
            <div key={f.key} className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Icon size={12} className="text-gray-500" />
                {f.label}
              </label>
              <p className="text-[11px] text-gray-500">{f.hint}</p>
              <div className="flex gap-2 items-start">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  disabled={busy}
                />
                {url.trim() && (
                  <div className="shrink-0 p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Preview ${f.label}`}
                      className={`${previewClasses} object-contain`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status && (
        <div
          className={`mx-5 mb-4 px-3 py-2 rounded-lg text-xs font-medium ${
            status.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.msg}
        </div>
      )}
    </div>
  );
}
