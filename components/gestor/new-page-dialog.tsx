"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, X } from "lucide-react";

export function NewPageDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [prompt, setPrompt] = useState("");
  const [menuLabel, setMenuLabel] = useState("");
  const [addToMenu, setAddToMenu] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStatus(null);
  };

  const submit = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gestor/stitch-custom-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          prompt: prompt.trim(),
          addToMenu,
          menuLabel: menuLabel.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Falha");
      }
      setStatus({
        ok: true,
        msg: `Página /${data.slug} criada${addToMenu ? " e adicionada ao menu" : ""}.`,
      });
      // Reset + close após 1.5s + refresh listing
      setTimeout(() => {
        setOpen(false);
        setSlug("");
        setPrompt("");
        setMenuLabel("");
        router.refresh();
      }, 1800);
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
      >
        <Sparkles size={14} />
        Nova página com IA
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center p-4" onClick={close}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nova página com IA</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  A IA gera no mesmo estilo das outras páginas do site, reaproveitando o projeto Stitch atual.
                </p>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL da página (slug)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-mono">/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="cardapio"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono"
                    disabled={busy}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Aparece na URL pública. Letras minúsculas, números e traços só.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  O que essa página deve cobrir?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Ex: Apresentar nossos cafés especiais filtrados e espresso, com preços e descrição dos métodos."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  disabled={busy}
                />
              </div>

              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToMenu}
                    onChange={(e) => setAddToMenu(e.target.checked)}
                    className="mt-0.5"
                    disabled={busy}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Adicionar ao menu principal</div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      O link aparece no header de todas as páginas do site, antes de &quot;Contato&quot;.
                    </p>
                  </div>
                </label>
                {addToMenu && (
                  <div className="mt-3 pl-7">
                    <input
                      type="text"
                      value={menuLabel}
                      onChange={(e) => setMenuLabel(e.target.value)}
                      placeholder={slug ? `Default: ${slug.replace(/-/g, " ")}` : "Texto que aparece no menu (opcional)"}
                      className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      disabled={busy}
                    />
                  </div>
                )}
              </div>
            </div>

            {status && (
              <div
                className={`mt-4 px-3 py-2 rounded-lg text-xs font-medium ${
                  status.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {status.msg}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={close}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={busy || slug.trim().length < 2 || prompt.trim().length < 8}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {busy ? "Gerando (~90s)…" : "Criar página"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              A geração leva cerca de 1-2 minutos. Não feche essa janela.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
