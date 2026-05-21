"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Code2,
  Type as TypeIcon,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

interface Field {
  /** Texto exibido no input. */
  label: string;
  /** Regex que casa a string DENTRO do HTML (com captura do valor no grupo 1). */
  pattern: RegExp;
  /** Valor extraído inicialmente. */
  value: string;
  /** Helper humano (legível). */
  hint?: string;
}

interface Props {
  pageType: string;
  pageLabel: string;
  publicRoute: string;
  initialHtml: string;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extrai os campos mais editáveis do HTML do Stitch via regex conservadora. */
function extractFields(html: string): Field[] {
  const fields: Field[] = [];

  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  if (title) {
    fields.push({
      label: "Título do navegador",
      pattern: new RegExp(`(<title>)([^<]*)(<\\/title>)`, "i"),
      value: title,
      hint: "Mostrado na aba do navegador e no Google",
    });
  }

  // H1 principal — primeiro <h1> de fato
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]{1,400}?)<\/h1>/i);
  if (h1Match) {
    fields.push({
      label: "Headline (H1)",
      pattern: new RegExp(`(<h1\\b[^>]*>)([\\s\\S]{0,800}?)(<\\/h1>)`, "i"),
      value: stripTags(h1Match[1]),
      hint: "O título principal da página",
    });
  }

  // Primeiro parágrafo do hero
  const heroPMatch = html.match(/<section\b[^>]*hero[\s\S]*?<p\b[^>]*>([\s\S]{1,500}?)<\/p>/i);
  if (heroPMatch) {
    const value = stripTags(heroPMatch[1]);
    fields.push({
      label: "Subtítulo do hero",
      pattern: new RegExp(`(<section\\b[^>]*hero[\\s\\S]*?<p\\b[^>]*>)([\\s\\S]{0,800}?)(<\\/p>)`, "i"),
      value,
      hint: "Parágrafo abaixo do título principal",
    });
  }

  return fields;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function applyFieldEdit(html: string, field: Field, newValue: string): string {
  return html.replace(field.pattern, (_match, open: string, _inner: string, close: string) => {
    return `${open}${newValue}${close}`;
  });
}

export function StitchPageEditor({ pageType, pageLabel, publicRoute, initialHtml }: Props) {
  const [html, setHtml] = useState(initialHtml);
  const [tab, setTab] = useState<"fields" | "html">("fields");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const fields = useMemo(() => extractFields(html), [html]);
  const [fieldValues, setFieldValues] = useState<string[]>(fields.map((f) => f.value));

  // Sincroniza valores dos campos quando o HTML muda externamente
  useEffect(() => {
    setFieldValues(fields.map((f) => f.value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml]);

  const previewRef = useRef<HTMLIFrameElement | null>(null);

  // Atualiza preview ao mudar o HTML (com debounce simples)
  useEffect(() => {
    const id = setTimeout(() => {
      const iframe = previewRef.current;
      if (!iframe) return;
      iframe.srcdoc = html;
    }, 400);
    return () => clearTimeout(id);
  }, [html]);

  const dirty = html !== initialHtml;

  const applyFieldEdits = () => {
    let next = html;
    fields.forEach((f, idx) => {
      const newVal = fieldValues[idx];
      if (newVal !== f.value) {
        next = applyFieldEdit(next, f, newVal);
      }
    });
    if (next !== html) setHtml(next);
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      // Aplica edits dos campos no HTML antes de salvar
      let finalHtml = html;
      fields.forEach((f, idx) => {
        const newVal = fieldValues[idx];
        if (newVal !== f.value) finalHtml = applyFieldEdit(finalHtml, f, newVal);
      });

      const res = await fetch(`/api/gestor/stitch-page/${pageType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: finalHtml }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha");
      setHtml(finalHtml);
      setStatus({ ok: true, msg: `Salvo · ${Math.round(data.bytes / 1024)} KB · publicado em ${publicRoute}` });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  };

  const revert = () => {
    setHtml(initialHtml);
    setFieldValues(fields.map((f) => f.value));
    setStatus(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <header className="border-b border-gray-200 bg-white px-5 py-3 flex items-center gap-3 shrink-0">
        <Link
          href="/gestor/editor"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={14} />
          Páginas
        </Link>
        <div className="text-gray-300">·</div>
        <h1 className="font-semibold text-gray-900 text-sm">{pageLabel}</h1>
        <span className="text-xs text-gray-400 font-mono">{publicRoute}</span>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={publicRoute}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 text-sm transition"
          >
            <ExternalLink size={13} />
            Abrir
          </Link>
          <button
            onClick={revert}
            disabled={!dirty}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <RotateCcw size={13} />
            Reverter
          </button>
          <button
            onClick={save}
            disabled={busy || !dirty}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Salvar
          </button>
        </div>
      </header>

      {status && (
        <div
          className={`px-5 py-2 text-xs font-medium ${
            status.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {status.msg}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <aside className="w-[380px] border-r border-gray-200 bg-gray-50/40 flex flex-col">
          <div className="px-4 pt-3 pb-2 flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setTab("fields")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                tab === "fields" ? "bg-white border border-gray-300 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <TypeIcon size={12} />
              Texto rápido
            </button>
            <button
              onClick={() => setTab("html")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                tab === "html" ? "bg-white border border-gray-300 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Code2 size={12} />
              HTML
            </button>
          </div>

          {tab === "fields" ? (
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {fields.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Não consegui extrair campos editáveis dessa página. Use a aba HTML pra editar diretamente.
                </p>
              ) : (
                <>
                  {fields.map((f, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {f.label}
                      </label>
                      <textarea
                        value={fieldValues[idx] ?? ""}
                        onChange={(e) =>
                          setFieldValues((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                        }
                        rows={f.label.toLowerCase().includes("sub") ? 4 : 2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      {f.hint && <p className="text-[11px] text-gray-500 mt-0.5">{f.hint}</p>}
                    </div>
                  ))}
                  <button
                    onClick={applyFieldEdits}
                    className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition"
                  >
                    Aplicar mudanças no preview
                  </button>
                  <p className="text-[11px] text-gray-500">
                    O preview à direita atualiza com os campos editados. Use &quot;Salvar&quot; no topo pra publicar.
                  </p>
                </>
              )}
            </div>
          ) : (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="flex-1 w-full p-3 text-xs font-mono text-gray-800 bg-white focus:outline-none border-0 resize-none"
              spellCheck={false}
            />
          )}
        </aside>

        <main className="flex-1 bg-zinc-950 flex items-stretch">
          <iframe
            ref={previewRef}
            title="Preview ao vivo"
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 bg-white"
          />
        </main>
      </div>
    </div>
  );
}
