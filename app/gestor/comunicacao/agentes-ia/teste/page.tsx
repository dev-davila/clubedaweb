"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Bot, Send, Loader2, Trash2, User, Cpu, Clock,
  Zap, Info, ChevronDown, MessageSquare, RotateCcw,
  PhoneForwarded, CheckCircle, AlertTriangle, Play,
} from "lucide-react";

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  temperature: number;
  active: boolean;
  departments: string;
  welcomeMessage: string | null;
  restrictions: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  meta?: {
    model?: string;
    tokensUsed?: number;
    latencyMs?: number;
    department?: string;
    step?: string;
    shouldHandoff?: boolean;
    shouldClose?: boolean;
    metadata?: Record<string, any>;
  };
}

export default function TestePage() {
  const { data: session } = useSession() || {};
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMeta, setShowMeta] = useState(true);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalLatency, setTotalLatency] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) loadAgents();
  }, [session]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/gestor/comunicacao/agentes-ia/config");
      const data = await res.json();
      setAgents(data);
      if (data.length > 0) setSelectedAgent(data[0].id);
    } catch (err) {
      console.error("Error loading agents:", err);
    } finally {
      setLoading(false);
    }
  }

  function getAgent() {
    return agents.find(a => a.id === selectedAgent);
  }

  function startConversation() {
    const agent = getAgent();
    if (!agent) return;
    const initial: ChatMessage[] = [];
    if (agent.welcomeMessage) {
      initial.push({
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: agent.welcomeMessage,
        timestamp: new Date(),
        meta: { step: "greeting" },
      });
    }
    setMessages(initial);
    setTotalTokens(0);
    setTotalLatency(0);
    inputRef.current?.focus();
  }

  function clearChat() {
    setMessages([]);
    setTotalTokens(0);
    setTotalLatency(0);
  }

  async function handleSend() {
    if (!input.trim() || !selectedAgent || sending) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      // Build messages for API (only user/assistant, exclude welcome system msg)
      const apiMessages = [...messages, userMsg]
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/gestor/comunicacao/agentes-ia/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent,
          messages: apiMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "system" as const,
            content: `❌ Erro: ${data.error || "Falha na comunicação"}`,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        meta: {
          model: data.model,
          tokensUsed: data.tokensUsed,
          latencyMs: data.latencyMs,
          department: data.parsed?.department,
          step: data.parsed?.step,
          shouldHandoff: data.parsed?.shouldHandoff,
          shouldClose: data.parsed?.shouldClose,
          metadata: data.parsed?.metadata,
        },
      };

      setMessages(prev => [...prev, assistantMsg]);
      setTotalTokens(prev => prev + (data.tokensUsed || 0));
      setTotalLatency(prev => prev + (data.latencyMs || 0));
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "system" as const,
          content: "❌ Erro de conexão com o servidor",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const agent = getAgent();
  const msgCount = messages.filter(m => m.role !== "system").length;
  const stepLabels: Record<string, string> = {
    greeting: "👋 Saudação",
    qualifying: "🔍 Qualificação",
    collecting: "📝 Coleta de dados",
    handoff: "👤 Transferência",
    resolved: "✅ Resolvido",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Play className="w-7 h-7 text-green-400" />
          Playground – Testar Agente IA
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Simule uma conversa com o agente diretamente pelo painel, sem precisar enviar mensagens pelo WhatsApp.
        </p>
      </div>

      {/* Agent Selector + Controls */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full">
            <label className="text-xs text-gray-400 mb-1 block">Selecione o Agente para Testar</label>
            <select
              value={selectedAgent}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                clearChat();
              }}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
            >
              {agents.length === 0 && <option value="">Nenhum agente configurado</option>}
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.model}) {!a.active ? "[INATIVO]" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={startConversation}
              disabled={!selectedAgent}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              Iniciar Conversa
            </button>
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              title="Limpar conversa"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Agent info bar */}
        {agent && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {agent.model}</span>
            <span>Temp: {agent.temperature}</span>
            <span>Departamentos: {agent.departments}</span>
            <span className={agent.active ? "text-green-400" : "text-red-400"}>
              {agent.active ? "● Ativo" : "● Inativo"}
            </span>
            {agent.restrictions && <span className="text-yellow-500">⚠ Com restrições</span>}
          </div>
        )}
      </div>

      {/* Stats bar */}
      {msgCount > 0 && (
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {msgCount} mensagens</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {totalTokens} tokens</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {(totalLatency / 1000).toFixed(1)}s total</span>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            {showMeta ? "Ocultar detalhes" : "Mostrar detalhes"}
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 flex flex-col" style={{ minHeight: "500px", maxHeight: "65vh" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <Bot className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma conversa iniciada</p>
              <p className="text-gray-600 text-sm mt-1">Selecione um agente e clique em &quot;Iniciar Conversa&quot; para começar o teste.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "system" ? (
                  /* System/error message */
                  <div className="flex justify-center">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
                      {msg.content}
                    </div>
                  </div>
                ) : msg.role === "user" ? (
                  /* User message */
                  <div className="flex justify-end">
                    <div className="max-w-[75%] bg-blue-600 rounded-2xl rounded-br-md px-4 py-2.5">
                      <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] text-blue-200/50 mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Assistant message */
                  <div className="flex justify-start gap-2">
                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="max-w-[75%]">
                      <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 border border-gray-700">
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {/* Meta info */}
                      {showMeta && msg.meta && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-gray-600 px-1">
                          {msg.meta.model && (
                            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1">
                              <Cpu className="w-2.5 h-2.5" /> {msg.meta.model}
                            </span>
                          )}
                          {msg.meta.latencyMs && (
                            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" /> {msg.meta.latencyMs}ms
                            </span>
                          )}
                          {msg.meta.tokensUsed && (
                            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                              {msg.meta.tokensUsed} tokens
                            </span>
                          )}
                          {msg.meta.step && (
                            <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                              {stepLabels[msg.meta.step] || msg.meta.step}
                            </span>
                          )}
                          {msg.meta.department && msg.meta.department !== "não classificado" && (
                            <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
                              {msg.meta.department}
                            </span>
                          )}
                          {msg.meta.shouldHandoff && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 flex items-center gap-1">
                              <PhoneForwarded className="w-2.5 h-2.5" /> Transferência
                            </span>
                          )}
                          {msg.meta.shouldClose && (
                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" /> Encerrado
                            </span>
                          )}
                          {msg.meta.metadata && Object.keys(msg.meta.metadata).length > 0 && (
                            <span className="bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30" title={JSON.stringify(msg.meta.metadata)}>
                              📋 {Object.keys(msg.meta.metadata).join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {sending && (
            <div className="flex justify-start gap-2">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-green-400" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 border border-gray-700">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-700 p-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={messages.length === 0 ? "Inicie uma conversa primeiro..." : "Digite uma mensagem como cliente..."}
              disabled={sending || messages.length === 0}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none disabled:opacity-50 placeholder:text-gray-600"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim() || messages.length === 0}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium flex items-center gap-1.5"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5 px-1">
            💡 Você está simulando o papel do <strong>cliente</strong>. O agente irá responder como faria no WhatsApp.
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 text-xs text-gray-500 space-y-1">
        <p className="text-gray-400 font-medium mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          Dicas para testar
        </p>
        <p>• Comece com uma saudação simples: <span className="text-gray-300">&quot;Olá, preciso de ajuda&quot;</span></p>
        <p>• Teste o encaminhamento para departamentos: <span className="text-gray-300">&quot;Preciso de suporte técnico&quot;</span></p>
        <p>• Teste a coleta de dados: <span className="text-gray-300">&quot;Meu nome é João, da empresa XYZ&quot;</span></p>
        <p>• Teste a transferência humana: <span className="text-gray-300">&quot;Quero falar com um atendente&quot;</span></p>
        <p>• Teste as restrições: tente perguntar algo que você definiu como proibido na configuração</p>
        <p>• Os badges coloridos abaixo de cada resposta mostram departamento detectado, etapa, dados coletados e flags de transferência</p>
      </div>
    </div>
  );
}
