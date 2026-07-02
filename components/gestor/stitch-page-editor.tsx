"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Code2,
  MousePointerClick,
  RotateCcw,
  ExternalLink,
  Link as LinkIcon,
  Image as ImageIcon,
  Type as TypeIcon,
  Sparkles,
} from "lucide-react";
import { instrumentHtmlForEditor, deinstrumentHtml } from "@/lib/editor/instrument-html";

interface Props {
  pageType: string;
  pageLabel: string;
  publicRoute: string;
  initialHtml: string;
}

interface SelectedInfo {
  editId: string;
  tag: string;
  isImage: boolean;
  isLink: boolean;
  isButton: boolean;
  text: string;
  href: string;
  src: string;
  alt: string;
}

export function StitchPageEditor({ pageType, pageLabel, publicRoute, initialHtml }: Props) {
  const [html, setHtml] = useState(initialHtml);
  const [tab, setTab] = useState<"visual" | "html" | "ai">("visual");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selected, setSelected] = useState<SelectedInfo | null>(null);
  const [instrumentedCount, setInstrumentedCount] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Aplica instrumentação só pro iframe — o html salvo continua limpo
  const instrumentedHtml = useMemo(() => instrumentHtmlForEditor(html), [html]);
  const dirty = html !== initialHtml;

  // Recebe eventos do iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "cdw-edit-ready") setInstrumentedCount(data.count ?? 0);
      if (data.type === "cdw-edit-select") setSelected(data.info ?? null);
      if (data.type === "cdw-edit-update") {
        applyPatch(data.editId, data.kind, data.value);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Aplica um patch no HTML armazenado (que NÃO tem instrumentação). */
  const applyPatch = useCallback((editId: string, kind: string, value: string) => {
    setHtml((current) => patchHtml(current, editId, kind, value));
  }, []);

  /** Atualiza o iframe sem recarregar (postMessage). */
  const pushPatchToIframe = (editId: string, kind: string, value: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "cdw-edit-patch", editId, kind, value },
      "*",
    );
  };

  const updateSelectedField = (kind: "text" | "href" | "src" | "alt", value: string) => {
    if (!selected) return;
    setSelected({ ...selected, [kind]: value });
    pushPatchToIframe(selected.editId, kind, value);
    applyPatch(selected.editId, kind, value);
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const cleaned = deinstrumentHtml(html);
      const res = await fetch(`/api/gestor/stitch-page/${pageType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha");
      setHtml(cleaned);
      const propagated = (data.propagated ?? []) as string[];
      const tail = propagated.length
        ? ` · header/footer propagados em ${propagated.length} página(s): ${propagated.join(", ")}`
        : "";
      setStatus({ ok: true, msg: `Salvo · ${Math.round(data.bytes / 1024)} KB · publicado em ${publicRoute}${tail}` });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  };

  const runAi = async () => {
    const instruction = aiPrompt.trim();
    if (!instruction || aiBusy) return;
    setAiBusy(true);
    setStatus(null);
    try {
      // Envia o HTML limpo (sem instrumentação do editor visual).
      const cleaned = deinstrumentHtml(html);
      const res = await fetch(`/api/gestor/stitch-page/${pageType}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, html: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha ao gerar");
      setHtml(data.html);
      setSelected(null);
      setStatus({
        ok: true,
        msg: `IA aplicou a alteração · ${Math.round(data.bytes / 1024)} KB. Revise no preview e clique em Salvar para publicar.`,
      });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro na IA" });
    } finally {
      setAiBusy(false);
    }
  };

  const revert = () => {
    setHtml(initialHtml);
    setSelected(null);
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
        {instrumentedCount > 0 && tab === "visual" && (
          <span className="hidden md:inline text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {instrumentedCount} elementos editáveis
          </span>
        )}

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
        <aside className="w-[340px] border-r border-gray-200 bg-gray-50/40 flex flex-col">
          <div className="px-4 pt-3 pb-2 flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setTab("visual")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                tab === "visual" ? "bg-white border border-gray-300 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <MousePointerClick size={12} />
              Visual
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
            <button
              onClick={() => setTab("ai")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                tab === "ai" ? "bg-white border border-indigo-300 text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Sparkles size={12} />
              IA
            </button>
          </div>

          {tab === "visual" ? (
            <div className="overflow-y-auto flex-1 p-4">
              {!selected ? (
                <div className="text-xs text-gray-500 space-y-2">
                  <p className="font-semibold text-gray-700">Como editar</p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li>Clique em qualquer texto pra editar</li>
                    <li>Enter ou clique fora pra confirmar</li>
                    <li>Clique numa imagem pra trocar a URL</li>
                    <li>Clique em link/botão pra mudar texto e destino</li>
                  </ul>
                  <p className="text-[11px] text-gray-400 pt-2">
                    Mudanças ficam só no preview até você clicar em <strong>Salvar</strong>.
                  </p>
                </div>
              ) : (
                <SelectedPanel
                  info={selected}
                  onUpdate={updateSelectedField}
                />
              )}
            </div>
          ) : tab === "html" ? (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="flex-1 w-full p-3 text-xs font-mono text-gray-800 bg-white focus:outline-none border-0 resize-none"
              spellCheck={false}
            />
          ) : (
            <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
              <div className="text-xs text-gray-600 space-y-1.5">
                <p className="font-semibold text-indigo-700 flex items-center gap-1.5">
                  <Sparkles size={13} /> Editar com IA
                </p>
                <p>Descreva em português o que você quer mudar nesta página. A IA reescreve o HTML aplicando o seu pedido.</p>
                <p className="text-[11px] text-gray-400">
                  Ex.: “deixe o hero verde escuro e troque o título para X”, “adicione uma seção de depoimentos”, “refaça o texto com foco em antivírus para empresas”.
                </p>
              </div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="O que você quer mudar nesta página?"
                rows={6}
                disabled={aiBusy}
                className="w-full p-3 text-sm text-gray-800 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none disabled:opacity-60"
              />
              <button
                onClick={runAi}
                disabled={aiBusy || !aiPrompt.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiBusy ? "Gerando…" : "Gerar com IA"}
              </button>
              <p className="text-[11px] text-gray-400">
                A IA altera só o preview. Revise e clique em <strong>Salvar</strong> (no topo) para publicar. Use <strong>Reverter</strong> se não gostar.
              </p>
            </div>
          )}
        </aside>

        <main className="flex-1 bg-zinc-950 flex items-stretch">
          <iframe
            ref={iframeRef}
            title="Editor visual"
            srcDoc={instrumentedHtml}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="w-full h-full border-0 bg-white"
          />
        </main>
      </div>
    </div>
  );
}

interface PanelProps {
  info: SelectedInfo;
  onUpdate: (kind: "text" | "href" | "src" | "alt", value: string) => void;
}

function SelectedPanel({ info, onUpdate }: PanelProps) {
  const TagIcon = info.isImage ? ImageIcon : info.isLink || info.isButton ? LinkIcon : TypeIcon;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TagIcon size={14} className="text-emerald-600" />
        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          {info.tag}
        </span>
        {info.isImage && <span className="text-[10px] text-gray-500">Imagem</span>}
        {info.isLink && <span className="text-[10px] text-gray-500">Link</span>}
        {info.isButton && <span className="text-[10px] text-gray-500">Botão</span>}
      </div>

      {info.isImage ? (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">URL da imagem</label>
            <input
              type="url"
              value={info.src}
              onChange={(e) => onUpdate("src", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {info.src && (
              <img
                src={info.src}
                alt="preview"
                className="mt-2 max-h-32 rounded-md border border-gray-200 object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Texto alternativo</label>
            <input
              type="text"
              value={info.alt}
              onChange={(e) => onUpdate("alt", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {info.isButton || info.isLink ? "Texto do botão" : "Conteúdo"}
            </label>
            <textarea
              value={info.text}
              onChange={(e) => onUpdate("text", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Você também pode clicar direto no texto no preview pra editar inline.
            </p>
          </div>
          {(info.isLink || info.isButton) && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Destino (URL)</label>
              <input
                type="text"
                value={info.href}
                onChange={(e) => onUpdate("href", e.target.value)}
                placeholder="/contato ou https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Aplica patch (text/href/src/alt) num HTML cru baseado em data-edit-id. */
function patchHtml(html: string, editId: string, kind: string, value: string): string {
  // Como o html armazenado NÃO tem data-edit-id, reconstruímos a mesma ordem
  // de instrumentação no servidor… alternativa simples: instrumenta, patch, deinstrumenta.
  const instrumented = instrumentHtmlForEditor(html);
  const dom = parseDom(instrumented);
  const target = dom.querySelector(`[data-edit-id="${escapeAttr(editId)}"]`);
  if (!target) return html;
  if (kind === "text") {
    if (target.tagName === "IMG") target.setAttribute("alt", value);
    else target.innerHTML = value;
  } else if (kind === "href") target.setAttribute("href", value);
  else if (kind === "src") target.setAttribute("src", value);
  else if (kind === "alt") target.setAttribute("alt", value);
  return deinstrumentHtml(serializeDom(dom));
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

function parseDom(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function serializeDom(doc: Document): string {
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}
