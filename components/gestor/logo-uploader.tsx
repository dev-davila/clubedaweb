"use client";

import { useState } from "react";
import { Check, Loader2, ImageIcon } from "lucide-react";

interface Props {
  initialUrl: string;
}

export function LogoUploader({ initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gestor/site-logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha ao salvar");
      setStatus({
        ok: true,
        msg: data.updatedPages
          ? `Logo salvo · ${data.updatedPages} página(s) atualizadas no site publicado`
          : "Logo salvo",
      });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon size={16} className="text-gray-600" />
        <h3 className="font-semibold text-gray-900">Logo principal</h3>
      </div>
      <p className="text-xs text-gray-600 mb-3">
        URL pública de uma imagem (PNG/SVG). Quando salvar, o logo aparece no cabeçalho do site Stitch publicado em todas as páginas.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com/logo.svg"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          disabled={busy}
        />
        <button
          onClick={save}
          disabled={busy || url.trim() === initialUrl.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Salvar
        </button>
      </div>

      {url.trim() && (
        <div className="mt-3 flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
          <img
            src={url}
            alt="Preview do logo"
            className="h-10 w-auto max-w-[200px] object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-xs text-gray-500 truncate">{url}</span>
        </div>
      )}

      {status && (
        <div
          className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
            status.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.msg}
        </div>
      )}
    </div>
  );
}
