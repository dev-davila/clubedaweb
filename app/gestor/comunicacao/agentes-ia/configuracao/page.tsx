"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Bot, Cog, Plus, Loader2, Save, Trash2, Edit2, X,
  CheckCircle, AlertTriangle, Power, PowerOff,
  Zap, Server, Key, Activity, Clock, Cpu,
  Upload, FileText, Link2, GripVertical, Info,
  ShieldAlert, MessageSquare, Globe, File, ArrowRightLeft, Star, GraduationCap,
  ChevronDown, ChevronUp, Timer, Ticket,
} from "lucide-react";

/* ============ Types ============ */
interface TrainingFile {
  name: string;
  url: string; // cloud_storage_path
  type: string;
  size?: number;
}

interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  restrictions: string | null;
  welcomeMessage: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  departments: string;
  active: boolean;
  instanceIds: string | null;
  businessRules: string | null;
  trainingFiles: string | null;
  trainingUrls: string | null;
  isEntryPoint: boolean;
  routingInstructions: string | null;
  routingAgentIds: string | null; // JSON array of selected agent IDs for routing
  responseDelay: number; // delay in seconds before responding
  inactivityTimeout: number; // inactivity timeout in minutes (0 = disabled)
  fallbackModel: string | null;
  trainingEnabled: boolean;
  unodeskEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { sessions: number };
}

interface Instance {
  id: string;
  instanceName: string;
  phoneNumber: string | null;
  status: string;
}

interface ApiStatus {
  configured: boolean;
  maskedKey: string;
  endpoint: string;
  provider: string;
  availableModels: { id: string; name: string; description: string }[];
}

interface ApiTestResult {
  success: boolean;
  model?: string;
  reply?: string;
  tokensUsed?: number;
  latencyMs?: number;
  error?: string;
}

/* ============ Defaults ============ */
const defaultPrompt = `Você é um assistente virtual da empresa M3 Solutions, especialista em tecnologia e soluções digitais.

Sua função é:
1. Cumprimentar o cliente de forma profissional e simpática
2. Identificar a necessidade (comercial, suporte técnico ou financeiro)
3. Coletar informações relevantes (nome, empresa, email)
4. Fornecer informações básicas sobre nossos serviços
5. Encaminhar para um atendente humano quando necessário

Nossos serviços incluem:
- Desenvolvimento de software e aplicativos
- Infraestrutura e cloud computing
- Consultoria em TI
- Suporte técnico

Seja sempre educado, objetivo e profissional. Não invente preços ou prazos.`;

const defaultWelcome = "👋 Olá! Sou o assistente virtual da M3 Solutions. Como posso ajudá-lo hoje?";

const defaultRestrictions = `- Não fale sobre concorrentes ou compare preços
- Não invente preços, prazos ou promoções
- Não compartilhe dados internos da empresa
- Não prometa nada que não esteja descrito nos serviços
- Não use linguagem informal ou gírias`;

/* ============ Helpers ============ */
function parseTrainingFiles(raw: string | null): TrainingFile[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseTrainingUrls(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fileIconColor: Record<string, string> = {
  pdf: "text-red-400",
  doc: "text-blue-400",
  docx: "text-blue-400",
  ppt: "text-orange-400",
  pptx: "text-orange-400",
  txt: "text-gray-400",
  csv: "text-green-400",
  xls: "text-green-400",
  xlsx: "text-green-400",
};

function getFileExt(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

/* ============ Component ============ */
export default function ConfiguracaoPage() {
  const { data: session } = useSession() || {};
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editConfig, setEditConfig] = useState<Partial<AgentConfig> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Training data local state (parsed from editConfig)
  const [trainingFiles, setTrainingFiles] = useState<TrainingFile[]>([]);
  const [trainingUrls, setTrainingUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API Status
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [apiTestResult, setApiTestResult] = useState<ApiTestResult | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [testModel, setTestModel] = useState("gpt-4o-mini");
  const [showApiSection, setShowApiSection] = useState(false);

  useEffect(() => {
    if (session?.user) loadData();
  }, [session]);

  async function loadData() {
    setLoading(true);
    try {
      const [configsRes, instancesRes, apiRes] = await Promise.all([
        fetch("/api/gestor/comunicacao/agentes-ia/config"),
        fetch("/api/gestor/comunicacao/instancias"),
        fetch("/api/gestor/comunicacao/agentes-ia/test-api"),
      ]);
      setConfigs(await configsRes.json());
      const instData = await instancesRes.json();
      setInstances(instData.instances || instData || []);
      if (apiRes.ok) setApiStatus(await apiRes.json());
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function testApiConnection() {
    setTestingApi(true);
    setApiTestResult(null);
    try {
      const res = await fetch("/api/gestor/comunicacao/agentes-ia/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: testModel }),
      });
      setApiTestResult(await res.json());
    } catch {
      setApiTestResult({ success: false, error: "Erro de conexão com o servidor" });
    } finally {
      setTestingApi(false);
    }
  }

  function startNew() {
    const c: Partial<AgentConfig> = {
      name: "",
      systemPrompt: defaultPrompt,
      restrictions: defaultRestrictions,
      welcomeMessage: defaultWelcome,
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 1024,
      departments: "comercial,suporte,financeiro",
      active: true,
      instanceIds: "",
      businessRules: "",
      trainingFiles: null,
      trainingUrls: null,
      isEntryPoint: false,
      routingInstructions: null,
      routingAgentIds: null,
      responseDelay: 0,
      inactivityTimeout: 0,
      fallbackModel: null,
      trainingEnabled: false,
      unodeskEnabled: false,
    };
    setEditConfig(c);
    setTrainingFiles([]);
    setTrainingUrls([]);
    setNewUrl("");
    setIsNew(true);
  }

  function startEdit(c: AgentConfig) {
    setEditConfig({ ...c });
    setTrainingFiles(parseTrainingFiles(c.trainingFiles));
    setTrainingUrls(parseTrainingUrls(c.trainingUrls));
    setNewUrl("");
    setIsNew(false);
  }

  async function handleSave() {
    if (!editConfig?.name || !editConfig?.systemPrompt) {
      setMessage({ type: "error", text: "Nome e prompt do sistema são obrigatórios" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...editConfig,
        trainingFiles: trainingFiles.length > 0 ? JSON.stringify(trainingFiles) : null,
        trainingUrls: trainingUrls.length > 0 ? JSON.stringify(trainingUrls) : null,
        restrictions: editConfig.restrictions || null,
      };
      const method = isNew ? "POST" : "PUT";
      const res = await fetch("/api/gestor/comunicacao/agentes-ia/config", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage({ type: "success", text: isNew ? "Agente criado com sucesso!" : "Agente atualizado!" });
        setEditConfig(null);
        await loadData();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Erro ao salvar" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de conexão" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este agente? As sessões serão perdidas.")) return;
    try {
      const res = await fetch(`/api/gestor/comunicacao/agentes-ia/config?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Agente excluído" });
        await loadData();
      }
    } catch {}
  }

  async function toggleActive(c: AgentConfig) {
    try {
      await fetch("/api/gestor/comunicacao/agentes-ia/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      await loadData();
    } catch {}
  }

  /* ---- File Upload (M3Solutions S3) ---- */
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newFiles: TrainingFile[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/gestor/comunicacao/agentes-ia/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Falha no upload de ${file.name}`);
        }
        const data = await res.json();

        newFiles.push({
          name: file.name,
          url: data.url || data.cloud_storage_path,
          type: file.type,
          size: file.size,
        });
      }
      setTrainingFiles(prev => [...prev, ...newFiles]);
      setMessage({ type: "success", text: `${newFiles.length} arquivo(s) enviado(s) com sucesso!` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erro no upload" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeFile(idx: number) {
    setTrainingFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function addUrl() {
    const url = newUrl.trim();
    if (!url) return;
    if (!url.startsWith("http")) {
      setMessage({ type: "error", text: "URL deve começar com http:// ou https://" });
      return;
    }
    if (trainingUrls.includes(url)) {
      setMessage({ type: "error", text: "URL já adicionada" });
      return;
    }
    setTrainingUrls(prev => [...prev, url]);
    setNewUrl("");
  }

  function removeUrl(idx: number) {
    setTrainingUrls(prev => prev.filter((_, i) => i !== idx));
  }

  /* ---- Drag and drop ---- */
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, []);

  /* ============ Render ============ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cog className="w-7 h-7 text-blue-400" />
            Configuração de Agentes IA
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie os agentes de atendimento automático</p>
        </div>
        {!editConfig && (
          <button
            onClick={startNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Agente
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* API Configuration Section — collapsible */}
      {apiStatus && !editConfig && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowApiSection(!showApiSection)}
            className="w-full p-5 border-b border-gray-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">API de Inteligência Artificial</h2>
                  <p className="text-xs text-gray-400">{apiStatus.provider}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  apiStatus.configured
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {apiStatus.configured ? "✓ Configurada" : "✗ Não Configurada"}
                </span>
                {showApiSection ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </div>
          </button>

          {showApiSection && (<div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Endpoint</span>
                </div>
                <p className="text-sm text-white font-mono break-all">{apiStatus.endpoint}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Chave de API</span>
                </div>
                <p className="text-sm text-white font-mono">
                  {apiStatus.configured ? apiStatus.maskedKey : "Não configurada"}
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Status</span>
                </div>
                {apiTestResult ? (
                  <p className={`text-sm font-medium ${apiTestResult.success ? "text-green-400" : "text-red-400"}`}>
                    {apiTestResult.success ? "✓ Conectado" : "✗ Falha"}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Não testado</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Modelos Disponíveis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {apiStatus.availableModels.map((m) => (
                  <div
                    key={m.id}
                    className={`bg-gray-900 rounded-lg p-3 border cursor-pointer transition-colors ${
                      testModel === m.id
                        ? "border-blue-500/50 bg-blue-600/10"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                    onClick={() => setTestModel(m.id)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white font-medium">{m.name}</p>
                      {testModel === m.id && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{m.description}</p>
                    <p className="text-[10px] text-gray-600 font-mono mt-1">{m.id}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
              <button
                onClick={testApiConnection}
                disabled={testingApi || !apiStatus.configured}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
              >
                {testingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Testar Conexão {testModel && `(${testModel})`}
              </button>
              {apiTestResult && (
                <div className={`flex-1 rounded-lg p-3 text-sm ${
                  apiTestResult.success ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                }`}>
                  {apiTestResult.success ? (
                    <div className="space-y-1">
                      <p className="text-green-400 font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {apiTestResult.reply}
                      </p>
                      <div className="flex gap-4 text-[11px] text-green-400/70">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apiTestResult.latencyMs}ms</span>
                        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{apiTestResult.model}</span>
                        <span>{apiTestResult.tokensUsed} tokens</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {apiTestResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {!apiStatus.configured && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-300">
                <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                A chave de API (<code className="bg-gray-700 px-1 py-0.5 rounded text-xs">ABACUSAI_API_KEY</code>) não está configurada.
              </div>
            )}
          </div>)}
        </div>
      )}

      {/* ======== EDIT FORM ======== */}
      {editConfig && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Form Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{isNew ? "Novo Agente" : "Editar Agente"}</h2>
                <p className="text-xs text-gray-400">Preencha as informações para configurar o agente</p>
              </div>
            </div>
            <button onClick={() => setEditConfig(null)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* ---- Section: Basic Info ---- */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Cog className="w-4 h-4 text-gray-500" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Nome do Agente <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={editConfig.name || ""}
                    onChange={(e) => setEditConfig({ ...editConfig, name: e.target.value })}
                    placeholder="Ex: Agente Comercial M3"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Modelo de IA</label>
                  <select
                    value={editConfig.model || "gpt-4o-mini"}
                    onChange={(e) => setEditConfig({ ...editConfig, model: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                  >
                    {(apiStatus?.availableModels || [
                      { id: "gpt-4o", name: "GPT-4o" },
                      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
                      { id: "gpt-4.1", name: "GPT-4.1" },
                      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
                      { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
                      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
                      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
                      { id: "deepseek-v3", name: "DeepSeek V3" },
                    ]).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Modelo Fallback <span className="text-gray-500">(opcional)</span></label>
                  <select
                    value={editConfig.fallbackModel || ""}
                    onChange={(e) => setEditConfig({ ...editConfig, fallbackModel: e.target.value || null })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                  >
                    <option value="">Nenhum (sem fallback)</option>
                    {(apiStatus?.availableModels || [
                      { id: "gpt-4o", name: "GPT-4o" },
                      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
                      { id: "gpt-4.1", name: "GPT-4.1" },
                      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
                      { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
                      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
                      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
                      { id: "deepseek-v3", name: "DeepSeek V3" },
                    ]).filter(m => m.id !== editConfig.model).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">Se o modelo principal falhar, o sistema tentará novamente com este modelo.</p>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Temperatura ({editConfig.temperature})</label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Preciso</span>
                    <input
                      type="range"
                      min="0" max="1" step="0.1"
                      value={editConfig.temperature || 0.7}
                      onChange={(e) => setEditConfig({ ...editConfig, temperature: parseFloat(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500">Criativo</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Max Tokens</label>
                  <input
                    type="number"
                    value={editConfig.maxTokens || 1024}
                    onChange={(e) => setEditConfig({ ...editConfig, maxTokens: parseInt(e.target.value) || 1024 })}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    Delay de Resposta
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={300}
                      step={5}
                      value={editConfig.responseDelay || 0}
                      onChange={(e) => setEditConfig({ ...editConfig, responseDelay: Math.max(0, Math.min(300, parseInt(e.target.value) || 0)) })}
                      className="w-24 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                    />
                    <span className="text-xs text-gray-400">segundos</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tempo de espera antes de enviar a resposta (simula digitação humana). Ex: 10s, 30s, 90s.
                  </p>
                </div>

                {/* Inactivity Timeout */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-orange-400" />
                    Timeout de Inatividade
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={1440}
                      step={5}
                      value={editConfig.inactivityTimeout || 0}
                      onChange={(e) => setEditConfig({ ...editConfig, inactivityTimeout: Math.max(0, Math.min(1440, parseInt(e.target.value) || 0)) })}
                      className="w-24 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                    />
                    <span className="text-xs text-gray-400">minutos</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Sessões inativas por este tempo serão encerradas automaticamente. 0 = desativado. Ex: 30, 60, 120.
                  </p>
                </div>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Mensagem de Boas-vindas</label>
                <textarea
                  rows={2}
                  value={editConfig.welcomeMessage || ""}
                  onChange={(e) => setEditConfig({ ...editConfig, welcomeMessage: e.target.value })}
                  placeholder="Primeira mensagem enviada ao iniciar uma nova sessão"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm resize-y focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                />
              </div>
            </div>

            {/* ---- Section: Instance Selector ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-500" />
                Instância de Comunicação
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  Selecione em quais instâncias (números de WhatsApp) este agente irá atuar. Deixe vazio para atuar em todas.
                </p>
                {instances.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Nenhuma instância cadastrada. Vá em Comunicação → Instâncias para adicionar.</p>
                ) : (
                  <div className="space-y-2">
                    {/* "All instances" option */}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        !editConfig.instanceIds
                          ? "border-blue-500/50 bg-blue-600/10"
                          : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="instanceMode"
                        checked={!editConfig.instanceIds}
                        onChange={() => setEditConfig({ ...editConfig, instanceIds: "" })}
                        className="accent-blue-500"
                      />
                      <div>
                        <p className="text-sm text-white font-medium">Todas as instâncias</p>
                        <p className="text-[11px] text-gray-500">O agente irá responder em qualquer número conectado</p>
                      </div>
                    </label>

                    {/* Specific instances */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        editConfig.instanceIds
                          ? "border-blue-500/50 bg-blue-600/10"
                          : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="instanceMode"
                        checked={!!editConfig.instanceIds}
                        onChange={() => {
                          if (!editConfig.instanceIds && instances.length > 0) {
                            setEditConfig({ ...editConfig, instanceIds: instances[0].id });
                          }
                        }}
                        className="accent-blue-500 mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">Instâncias específicas</p>
                        <p className="text-[11px] text-gray-500 mb-2">Escolha quais números este agente irá atender</p>
                        {editConfig.instanceIds !== undefined && editConfig.instanceIds !== "" && editConfig.instanceIds !== null && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {instances.map(inst => {
                              const selectedIds = (editConfig.instanceIds || "").split(",").map(s => s.trim()).filter(Boolean);
                              const isSelected = selectedIds.includes(inst.id);
                              return (
                                <button
                                  key={inst.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const newIds = isSelected
                                      ? selectedIds.filter(id => id !== inst.id)
                                      : [...selectedIds, inst.id];
                                    setEditConfig({ ...editConfig, instanceIds: newIds.join(",") || " " });
                                  }}
                                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                                    isSelected
                                      ? "bg-blue-600/30 border-blue-500 text-blue-300"
                                      : "bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600"
                                  }`}
                                >
                                  {isSelected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                  {inst.instanceName}
                                  {inst.phoneNumber && <span className="text-gray-500 ml-1">({inst.phoneNumber})</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ---- Section: Departments ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-500" />
                Departamentos
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-3 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Defina os departamentos que este agente pode encaminhar atendimentos. A IA usará esses departamentos para classificar e direcionar o cliente ao setor correto. Separe por vírgula.</span>
                </p>
                <input
                  type="text"
                  value={editConfig.departments || ""}
                  onChange={(e) => setEditConfig({ ...editConfig, departments: e.target.value })}
                  placeholder="comercial, suporte, financeiro, técnico"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                />
                {editConfig.departments && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editConfig.departments.split(",").map((d, i) => d.trim()).filter(Boolean).map((d, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">{d}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ---- Section: Behavior Prompt ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                Comportamento e Função
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 space-y-3">
                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Descreva <strong className="text-gray-300">COMO</strong> o agente deve se comportar: personalidade, tom de voz, funções, serviços que oferece e fluxos de atendimento.</span>
                </p>
                <textarea
                  rows={10}
                  value={editConfig.systemPrompt || ""}
                  onChange={(e) => setEditConfig({ ...editConfig, systemPrompt: e.target.value })}
                  placeholder="Descreva o comportamento, personalidade e funções do agente..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm font-mono resize-y focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                />
              </div>
            </div>

            {/* ---- Section: Restrictions ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-red-400/80 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Restrições (O que NÃO Fazer)
              </h3>
              <div className="bg-red-950/20 rounded-lg p-4 border border-red-900/30 space-y-3">
                <p className="text-xs text-red-300/60 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0 mt-0.5" />
                  <span>Defina o que o agente <strong className="text-red-300/80">NÃO</strong> deve falar, prometer ou fazer. Essas regras serão enviadas como restrições ao modelo de IA.</span>
                </p>
                <textarea
                  rows={6}
                  value={editConfig.restrictions || ""}
                  onChange={(e) => setEditConfig({ ...editConfig, restrictions: e.target.value })}
                  placeholder="- Não fale sobre concorrentes\n- Não invente preços\n- Não compartilhe dados internos..."
                  className="w-full bg-gray-900 border border-red-900/40 rounded-lg px-3 py-2.5 text-white text-sm font-mono resize-y focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none"
                />
              </div>
            </div>

            {/* ---- Section: Inter-Agent Routing ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                Roteamento entre Agentes
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 space-y-4">
                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Configure este agente como ponto de entrada (recepciona todos os contatos iniciais) e defina regras para transferir automaticamente para agentes especializados (comercial, suporte, etc.).</span>
                </p>

                {/* Entry Point Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditConfig({ ...editConfig, isEntryPoint: !editConfig.isEntryPoint })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${editConfig.isEntryPoint ? "bg-amber-500" : "bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${editConfig.isEntryPoint ? "translate-x-5" : ""}`} />
                  </button>
                  <div>
                    <p className="text-sm text-white flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      Agente de Entrada (Entry Point)
                    </p>
                    <p className="text-xs text-gray-500">
                      {editConfig.isEntryPoint
                        ? "✅ Este agente recepciona TODOS os contatos iniciais e decide para qual agente especializado encaminhar."
                        : "Este agente só será acionado quando outro agente transferir para ele."}
                    </p>
                  </div>
                </div>

                {/* Agent selection for routing */}
                {configs.filter(c => c.id !== editConfig.id).length > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-1 font-medium">Agentes disponíveis para roteamento:</p>
                    <p className="text-[11px] text-gray-500 mb-2">Selecione quais agentes este entry point pode encaminhar conversas. Se nenhum for selecionado, todos os agentes ativos serão considerados.</p>
                    <div className="space-y-1.5">
                      {configs.filter(c => c.id !== editConfig.id).map(c => {
                        const selectedIds: string[] = (() => {
                          try { return JSON.parse(editConfig.routingAgentIds || "[]") || []; } catch { return []; }
                        })();
                        const isSelected = selectedIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition border ${
                              isSelected
                                ? "bg-blue-900/30 border-blue-700/40"
                                : "bg-gray-900/30 border-gray-700/30 hover:bg-gray-800/50"
                            } ${!c.active ? "opacity-50" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const newIds = isSelected
                                  ? selectedIds.filter(id => id !== c.id)
                                  : [...selectedIds, c.id];
                                setEditConfig({
                                  ...editConfig,
                                  routingAgentIds: newIds.length > 0 ? JSON.stringify(newIds) : null,
                                });
                              }}
                              className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/30 w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm font-medium ${isSelected ? "text-blue-300" : "text-gray-300"}`}>
                                {c.isEntryPoint && <Star className="w-3 h-3 inline-block mr-1 text-amber-400" />}
                                {c.name}
                              </span>
                              <span className="text-gray-500 text-xs ml-1.5">({c.departments})</span>
                              {!c.active && <span className="text-red-400 text-[10px] ml-1.5">(inativo)</span>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Routing Instructions */}
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Instruções de Roteamento</label>
                  <textarea
                    rows={5}
                    value={editConfig.routingInstructions || ""}
                    onChange={(e) => setEditConfig({ ...editConfig, routingInstructions: e.target.value })}
                    placeholder={`Exemplo:\n- Se o cliente quer comprar ou saber preços → transferir para "Agente Comercial"\n- Se precisa de ajuda técnica → transferir para "Agente Suporte"\n- Se é assunto financeiro (boletos, NF) → transferir para "Agente Financeiro"\n- Sempre confirme com o cliente antes de transferir`}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm font-mono resize-y focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Essas instruções são enviadas ao modelo de IA para guiar quando e para qual agente transferir a conversa.
                  </p>
                </div>
              </div>
            </div>

            {/* ---- Section: Training Mode ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-500" />
                Modo Treinamento
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm text-gray-200 font-medium">Ativar Modo Treinamento</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Quando ativado: (1) ao fechar/transferir uma conversa, um e-mail com a transcrição completa é enviado para os gestores; 
                      (2) cada resposta da IA na visualização do chat terá botões de aceitar/rejeitar/comentar para os operadores avaliarem; 
                      (3) feedbacks rejeitados são usados automaticamente para melhorar o comportamento do agente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditConfig({ ...editConfig, trainingEnabled: !editConfig.trainingEnabled })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      editConfig.trainingEnabled ? "bg-amber-500" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        editConfig.trainingEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {editConfig.trainingEnabled && (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-300 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Modo treinamento ativo. Os operadores poderão avaliar respostas da IA no chat. E-mails de resumo serão enviados para <strong>gestores@m3solutions.com.br</strong> ao finalizar conversas.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ---- Section: Unodesk Integration ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-orange-500" />
                Integração Unodesk
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <p className="text-sm text-gray-200 font-medium">Ativar Ferramentas Unodesk</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Permite ao agente consultar CNPJ, telefone e e-mail no Unodesk (ServiceDesk), cadastrar novas empresas e pessoas, e abrir chamados automaticamente durante a conversa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditConfig({ ...editConfig, unodeskEnabled: !editConfig.unodeskEnabled })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      editConfig.unodeskEnabled ? "bg-orange-500" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        editConfig.unodeskEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {editConfig.unodeskEnabled && (
                  <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-xs text-orange-300 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Ferramentas ativas: <strong>consultar_cnpj</strong>, <strong>consultar_telefone</strong>, <strong>consultar_email</strong>, <strong>cadastrar_empresa</strong>, <strong>cadastrar_pessoa</strong>, <strong>criar_chamado</strong>. Configure as credenciais em <a href="/gestor/comunicacao/integracoes/unodesk" className="underline hover:text-orange-200">Integrações → Unodesk</a>.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ---- Section: Training Files ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Materiais de Treinamento (Arquivos)
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 space-y-3">
                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Envie PDFs, DOCs ou PPTs que serão usados como base de conhecimento para o agente. Os arquivos ficam armazenados na nuvem.</span>
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-blue-500 bg-blue-600/10"
                      : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.csv,.xls,.xlsx"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-blue-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Enviando arquivos...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Arraste arquivos aqui ou <span className="text-blue-400 underline">clique para selecionar</span></p>
                      <p className="text-[11px] text-gray-600 mt-1">PDF, DOC, DOCX, PPT, PPTX, TXT, CSV, XLS, XLSX</p>
                    </>
                  )}
                </div>

                {/* Uploaded files list */}
                {trainingFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {trainingFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <File className={`w-4 h-4 flex-shrink-0 ${fileIconColor[getFileExt(f.name)] || "text-gray-400"}`} />
                          <span className="text-sm text-gray-300 truncate">{f.name}</span>
                          {f.size && <span className="text-[10px] text-gray-600 flex-shrink-0">{fmtSize(f.size)}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ---- Section: Training URLs ---- */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                URLs de Referência
              </h3>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 space-y-3">
                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Adicione links de páginas web, documentações ou artigos que o agente pode usar como fonte de informação.</span>
                </p>

                {/* Add URL row */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
                    placeholder="https://exemplo.com/documentacao"
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addUrl}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {/* URL list */}
                {trainingUrls.length > 0 && (
                  <div className="space-y-1.5">
                    {trainingUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <span className="text-sm text-blue-300 truncate">{url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUrl(idx)}
                          className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ---- Section: Business Rules (collapsed advanced) ---- */}
            <details className="group">
              <summary className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 cursor-pointer list-none">
                <Cog className="w-4 h-4 text-gray-500" />
                Configurações Avançadas
                <span className="text-[10px] text-gray-600 font-normal normal-case">(clique para expandir)</span>
              </summary>
              <div className="mt-3 bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <label className="text-sm text-gray-300 mb-1.5 block">Regras de Negócio (JSON)</label>
                <textarea
                  rows={3}
                  value={editConfig.businessRules || ""}
                  onChange={(e) => setEditConfig({ ...editConfig, businessRules: e.target.value })}
                  placeholder='{"nao_compare_concorrentes": true, "oferta_minima": 500}'
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm font-mono resize-y focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none"
                />
              </div>
            </details>

            {/* ---- Save Buttons ---- */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setEditConfig(null)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isNew ? "Criar Agente" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== CONFIGS LIST ======== */}
      {!editConfig && (
        <div className="space-y-4">
          {configs.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
              <Bot className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-lg">Nenhum agente configurado</p>
              <p className="text-gray-500 text-sm mt-1">Crie seu primeiro agente IA para começar o atendimento automatizado.</p>
              <button
                onClick={startNew}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm mx-auto"
              >
                <Plus className="w-4 h-4" /> Criar Primeiro Agente
              </button>
            </div>
          ) : (
            configs.map(c => {
              const files = parseTrainingFiles(c.trainingFiles);
              const urls = parseTrainingUrls(c.trainingUrls);
              return (
                <div key={c.id} className={`bg-gray-800 rounded-xl border ${
                  c.active ? "border-green-500/30" : "border-gray-700"
                } p-5`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Bot className={`w-5 h-5 ${c.active ? "text-green-400" : "text-gray-500"}`} />
                        <h3 className="text-white font-semibold truncate">{c.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${c.active ? "bg-green-500/20 text-green-400" : "bg-gray-600/50 text-gray-500"}`}>
                          {c.active ? "Ativo" : "Inativo"}
                        </span>
                        {c.isEntryPoint && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 bg-amber-500/20 text-amber-400 flex items-center gap-1">
                            <Star className="w-3 h-3" /> Entrada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Modelo: {c.model} • Temp: {c.temperature} • Sessões: {c._count?.sessions || 0}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Departamentos: {c.departments}</p>
                      {(files.length > 0 || urls.length > 0) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {files.length > 0 && <span className="text-blue-400/70">{files.length} arquivo(s)</span>}
                          {files.length > 0 && urls.length > 0 && " • "}
                          {urls.length > 0 && <span className="text-blue-400/70">{urls.length} URL(s)</span>}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-0.5">Atualizado: {fmtDate(c.updatedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`p-2 rounded-lg ${c.active ? "bg-green-600/20 text-green-400 hover:bg-green-600/30" : "bg-gray-700 text-gray-500 hover:bg-gray-600"}`}
                        title={c.active ? "Desativar" : "Ativar"}
                      >
                        {c.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => startEdit(c)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Prompt (preview)</p>
                      <p className="text-xs text-gray-400 line-clamp-3">{c.systemPrompt}</p>
                    </div>
                    {c.restrictions && (
                      <div className="bg-red-950/20 rounded-lg p-3 border border-red-900/20">
                        <p className="text-[10px] text-red-400/60 mb-1 uppercase tracking-wider">Restrições</p>
                        <p className="text-xs text-red-300/50 line-clamp-3">{c.restrictions}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
