"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { PAGE_LABEL_PT, WIZARD_PAGE_ORDER, pageIndex } from "@/lib/wizard/page-flow";
import type { RequiredPageType } from "@/lib/themes/required-pages";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

interface AdvanceResponse {
  sessionId: string;
  reply: string;
  state: string;
  history: ChatMessage[];
  previewUrl?: string | null;
  currentPage?: string | null;
  published: boolean;
  briefProgress?: number;
}

const STATE_LABELS: Record<string, string> = {
  idle: "Introdução",
  discovery: "Briefing",
  confirm_brief: "Confirmar briefing",
  generating_page: "Gerando página…",
  review_page: "Aprovar página",
  ready_to_publish: "Publicar site",
  publishing: "Publicando…",
  published: "Publicado",
  error: "Erro",
};

function progressFor(state: string, briefProgress?: number): number {
  if (state === "discovery" && typeof briefProgress === "number") {
    // briefProgress: 0-100% baseado em campos preenchidos do brief
    // Mapeia pra faixa 5-70% da barra total
    return 5 + (briefProgress / 100) * 65;
  }
  if (state === "idle") return 5;
  if (state === "discovery") return 30;
  if (state === "confirm_brief") return 72;
  if (state === "generating_page") return 80;
  if (state === "review_page") return 88;
  if (state === "ready_to_publish") return 95;
  if (state === "publishing") return 98;
  if (state === "published") return 100;
  return 5;
}

function renderInline(content: string) {
  const parts: Array<{ kind: "text" | "bold" | "link"; value: string }> = [];
  const regex = /(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    if (match.index > lastIndex) parts.push({ kind: "text", value: content.slice(lastIndex, match.index) });
    const token = match[0];
    if (token.startsWith("**")) parts.push({ kind: "bold", value: token.slice(2, -2) });
    else parts.push({ kind: "link", value: token });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < content.length) parts.push({ kind: "text", value: content.slice(lastIndex) });
  return parts.map((p, i) => {
    if (p.kind === "bold") return <strong key={i} className="font-semibold">{p.value}</strong>;
    if (p.kind === "link")
      return (
        <a key={i} href={p.value} target="_blank" rel="noreferrer" className="underline text-blue-600 hover:text-blue-700 break-all">
          {p.value}
        </a>
      );
    return <span key={i}>{p.value}</span>;
  });
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
          isUser ? "bg-gray-900 text-white rounded-br-md" : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
        }`}
      >
        {message.content.split("\n").map((line, i) => (
          <div key={i}>{renderInline(line)}</div>
        ))}
      </div>
    </div>
  );
}

export function WizardChatShell() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<string>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [briefProgress, setBriefProgress] = useState<number | undefined>(undefined);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const initialize = useCallback(async () => {
    try {
      const res = await fetch("/api/gestor/wizard/chat", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.error === "stale_session"
            ? "Sessão expirada. Faça logout e login novamente no gestor."
            : `status ${res.status}`);
        throw new Error(msg);
      }
      setSessionId(data.sessionId);
      setState(data.state);
      setMessages(data.history);
      setPreviewUrl(data.previewUrl ?? null);
      setCurrentPage(data.currentPage ?? null);
      setBriefProgress(data.briefProgress);
    } catch (err: unknown) {
      setBootError(err instanceof Error ? err.message : "Falha ao iniciar sessão");
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, previewUrl]);

  const send = useCallback(
    async (raw?: string) => {
      const message = (raw ?? input).trim();
      if (!message || busy) return;
      setBusy(true);
      setInput("");
      setMessages((m) => [...m, { role: "user", content: message }]);
      try {
        const res = await fetch("/api/gestor/wizard/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.message || `status ${res.status}`;
          throw new Error(msg);
        }
        setSessionId(data.sessionId);
        setState(data.state);
        setMessages(data.history);
        setPreviewUrl(data.previewUrl ?? null);
        setCurrentPage(data.currentPage ?? null);
        setBriefProgress(data.briefProgress);
      } catch (err: unknown) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Tive um erro ao processar. Tenta de novo. (" +
              (err instanceof Error ? err.message : "unknown") +
              ")",
          },
        ]);
      } finally {
        setBusy(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [input, busy, sessionId],
  );

  const restart = useCallback(async () => {
    if (!sessionId || busy) return;
    if (!confirm("Reiniciar a conversa? Tudo será descartado.")) return;
    setBusy(true);
    try {
      await fetch("/api/gestor/wizard/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      setMessages([]);
      setPreviewUrl(null);
      setCurrentPage(null);
      await initialize();
    } finally {
      setBusy(false);
    }
  }, [sessionId, busy, initialize]);

  const quickReplies = useMemo(() => {
    if (state === "idle") return ["Vamos começar", "Sim"];
    if (state === "confirm_brief") return ["Sim, pode gerar", "Revisar"];
    if (state === "review_page") return ["Aprovar", "Outra versão", "Variante"];
    if (state === "ready_to_publish") return ["Publicar"];
    if (state === "discovery") return ["Não tenho", "Pular"];
    return [];
  }, [state]);

  const pageLabel =
    currentPage && currentPage in PAGE_LABEL_PT
      ? PAGE_LABEL_PT[currentPage as keyof typeof PAGE_LABEL_PT]
      : null;

  return (
    <div className="fixed inset-0 z-[70] bg-gray-50 flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/gestor" className="inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition" title="Voltar">
            <ArrowLeft size={16} className="text-gray-700" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-gray-900 tracking-tight">Assistente do site</div>
            <div className="text-[11px] text-gray-500 font-mono uppercase tracking-wider">
              {STATE_LABELS[state] ?? state}
              {pageLabel ? ` · ${pageLabel}` : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={restart}
            disabled={busy || !sessionId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
          >
            <RotateCcw size={14} />
            Reiniciar
          </button>
          <Link href="/gestor" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">
            <X size={16} />
            Sair
          </Link>
        </div>
      </header>

      <div className="h-1 bg-gray-200">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500" style={{ width: `${progressFor(state, briefProgress)}%` }} />
      </div>

      <main ref={listRef} className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {bootError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">Falha: {bootError}</div>
          )}
          {messages.length === 0 && !bootError && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              Carregando…
            </div>
          )}
          {messages.map((m, i) => (
            <Bubble key={`${m.role}-${i}-${m.createdAt ?? ""}`} message={m} />
          ))}
          {busy && (
            <div className="flex justify-start mb-3">
              <div className="rounded-2xl px-4 py-2.5 bg-white border border-gray-200 shadow-sm text-sm text-gray-500">
                {state === "generating_page"
                  ? pageLabel
                    ? `Gerando ${pageLabel}… (1–3 min)`
                    : "Gerando página com IA… (1–3 min)"
                  : "Processando…"}
              </div>
            </div>
          )}

          {previewUrl && (state === "review_page" || state === "ready_to_publish") && (
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-sm">
              <div className="text-xs uppercase tracking-wider font-bold text-indigo-800 mb-2">
                {state === "review_page" && pageLabel
                  ? `Preview — ${pageLabel} (${pageIndex(currentPage as RequiredPageType) + 1}/${WIZARD_PAGE_ORDER.length})`
                  : "Preview — todas as páginas"}
              </div>
              <p className="text-sm text-indigo-900 mb-3">
                Abra no navegador para validar layout, textos e mobile antes de aprovar.
              </p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <ExternalLink size={16} />
                Abrir preview
              </a>
              <p className="mt-2 text-xs text-indigo-700/80 break-all">{previewUrl}</p>
            </div>
          )}
        </div>
      </main>

      {quickReplies.length > 0 && (
        <div className="border-t border-gray-200 bg-white px-4 py-2 shrink-0">
          <div className="max-w-2xl mx-auto flex flex-wrap gap-2">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => send(qr)}
                disabled={busy}
                className="px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-40"
              >
                {qr}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 bg-white px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={
              busy
                ? "Aguarde a geração…"
                : state === "review_page"
                  ? "aprovar · outra versão · variante · (ajuste curto ex.: escureça o hero)"
                  : "Digite sua resposta…"
            }
            rows={1}
            disabled={busy}
            className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:bg-gray-50"
          />
          <button
            onClick={() => send()}
            disabled={busy || input.trim().length === 0}
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-40"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </footer>
    </div>
  );
}
