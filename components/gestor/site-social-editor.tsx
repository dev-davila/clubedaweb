"use client";

import { useState } from "react";
import { Check, Loader2, Instagram, Facebook, Linkedin, Youtube, Music } from "lucide-react";

interface Initial {
  social_instagram: string;
  social_facebook: string;
  social_linkedin: string;
  social_youtube: string;
  social_tiktok: string;
}

interface Props {
  initial: Initial;
}

interface FieldDef {
  key: keyof Initial;
  label: string;
  placeholder: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
}

const FIELDS: FieldDef[] = [
  { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/sua-conta", icon: Instagram },
  { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/sua-pagina", icon: Facebook },
  { key: "social_linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/sua-empresa", icon: Linkedin },
  { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/@seu-canal", icon: Youtube },
  { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/@seu-perfil", icon: Music },
];

export function SiteSocialEditor({ initial }: Props) {
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
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha ao salvar");
      setStatus({
        ok: true,
        msg: "Redes sociais salvas · ícones aparecem no footer de todas as páginas.",
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
          <h3 className="font-semibold text-gray-900">Redes sociais</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Deixe em branco as redes que você não usa. Os ícones aparecem no footer do site.
          </p>
        </div>
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Salvar redes
        </button>
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Icon size={12} className="text-gray-500" />
                {f.label}
              </label>
              <input
                type="url"
                value={values[f.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                disabled={busy}
              />
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
