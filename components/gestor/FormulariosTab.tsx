"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Mail, MessageSquare, Users, Loader2, AlertCircle,
  ExternalLink, Eye, MailOpen, Clock, Send, CheckCircle, XCircle,
  Link2, Key, ListChecks, ToggleLeft, ToggleRight, RefreshCw
} from "lucide-react";

interface FormsData {
  newsletter: {
    total: number;
    active: number;
    unsubscribed: number;
  };
  contact: {
    total: number;
    unread: number;
    recent: {
      id: string;
      name: string;
      email: string;
      subject: string | null;
      read: boolean;
      createdAt: string;
    }[];
  };
}

interface AllConfig {
  [key: string]: string | undefined;
}

interface MarketingForm {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  listId: string;
}

export default function FormulariosTab() {
  const [data, setData] = useState<FormsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Email marketing configs (newsletter + contato)
  const [configLoading, setConfigLoading] = useState(true);
  const [newsletterForm, setNewsletterForm] = useState<MarketingForm>({ enabled: false, apiUrl: "", apiKey: "", listId: "" });
  const [contactForm, setContactForm] = useState<MarketingForm>({ enabled: false, apiUrl: "", apiKey: "", listId: "" });
  const [savingNewsletter, setSavingNewsletter] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [testingNewsletter, setTestingNewsletter] = useState(false);
  const [testingContact, setTestingContact] = useState(false);
  const [testResultNewsletter, setTestResultNewsletter] = useState<{ success: boolean; message: string } | null>(null);
  const [testResultContact, setTestResultContact] = useState<{ success: boolean; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gestor/forms");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      setConfigLoading(true);
      const res = await fetch("/api/gestor/email-marketing/config");
      if (res.ok) {
        const config: AllConfig = await res.json();
        setNewsletterForm({
          enabled: config.email_marketing_enabled === "true",
          apiUrl: config.email_marketing_api_url || "",
          apiKey: config.email_marketing_api_key || "",
          listId: config.email_marketing_list_id || "",
        });
        setContactForm({
          enabled: config.contact_marketing_enabled === "true",
          apiUrl: config.contact_marketing_api_url || "",
          apiKey: config.contact_marketing_api_key || "",
          listId: config.contact_marketing_list_id || "",
        });
      }
    } catch {
      // silently fail
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchConfig();
  }, [fetchData, fetchConfig]);

  const saveConfig = async (type: "newsletter" | "contact") => {
    const setLoading = type === "newsletter" ? setSavingNewsletter : setSavingContact;
    const form = type === "newsletter" ? newsletterForm : contactForm;
    const prefix = type === "newsletter" ? "email_marketing" : "contact_marketing";
    try {
      setLoading(true);
      const res = await fetch("/api/gestor/email-marketing/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [`${prefix}_enabled`]: String(form.enabled),
          [`${prefix}_api_url`]: form.apiUrl,
          [`${prefix}_api_key`]: form.apiKey,
          [`${prefix}_list_id`]: form.listId,
        }),
      });
      if (res.ok) {
        await fetchConfig();
        alert("Configurações salvas com sucesso!");
      }
    } catch {
      alert("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (type: "newsletter" | "contact") => {
    const setTesting = type === "newsletter" ? setTestingNewsletter : setTestingContact;
    const setResult = type === "newsletter" ? setTestResultNewsletter : setTestResultContact;
    const form = type === "newsletter" ? newsletterForm : contactForm;
    try {
      setTesting(true);
      setResult(null);
      // Use the same test endpoint but with the correct URL
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (form.apiKey && !form.apiKey.includes("****")) {
        headers["Authorization"] = `Bearer ${form.apiKey}`;
        headers["X-API-Key"] = form.apiKey;
      }
      const testPayload = {
        email: "teste@m3solutions.com.br",
        name: "Teste M3Solutions",
        list_id: form.listId || undefined,
        test: true,
        source: type === "contact" ? "contact_form" : "newsletter",
      };
      const response = await fetch(form.apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(testPayload),
      });
      if (response.ok) {
        setResult({ success: true, message: `Conexão OK (Status ${response.status})` });
      } else {
        setResult({ success: false, message: `Falha (Status ${response.status}: ${response.statusText})` });
      }
    } catch {
      setResult({ success: false, message: "Erro ao testar conexão" });
    } finally {
      setTesting(false);
    }
  };

  const renderMarketingConfig = (props: {
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBg: string;
    form: MarketingForm;
    setForm: React.Dispatch<React.SetStateAction<MarketingForm>>;
    saving: boolean;
    testing: boolean;
    testResult: { success: boolean; message: string } | null;
    onSave: () => void;
    onTest: () => void;
    placeholder: string;
    helpText: string;
    isLoading: boolean;
  }) => (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${props.iconBg} rounded-lg flex items-center justify-center`}>
            {props.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{props.title}</h3>
            <p className="text-xs text-gray-500">{props.description}</p>
          </div>
        </div>
        <button
          onClick={() => props.setForm((f) => ({ ...f, enabled: !f.enabled }))}
          className={`flex items-center gap-1 text-sm font-medium ${
            props.form.enabled ? "text-green-600" : "text-gray-400"
          }`}
        >
          {props.form.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          {props.form.enabled ? "Ativo" : "Inativo"}
        </button>
      </div>

      {props.isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin text-purple-400" size={20} />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
              <Link2 size={12} />
              URL da API
            </label>
            <input
              type="url"
              value={props.form.apiUrl}
              onChange={(e) => props.setForm((f) => ({ ...f, apiUrl: e.target.value }))}
              placeholder={props.placeholder}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Endpoint para cadastrar novos contatos no sistema de email marketing
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
              <Key size={12} />
              Chave da API (opcional)
            </label>
            <input
              type="password"
              value={props.form.apiKey}
              onChange={(e) => props.setForm((f) => ({ ...f, apiKey: e.target.value }))}
              placeholder="Chave de autenticação da API"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enviada como Bearer token e X-API-Key nos headers
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
              <ListChecks size={12} />
              ID da Lista (opcional)
            </label>
            <input
              type="text"
              value={props.form.listId}
              onChange={(e) => props.setForm((f) => ({ ...f, listId: e.target.value }))}
              placeholder="ID da lista de contatos"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={props.onSave}
              disabled={props.saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              {props.saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Salvar Configurações
            </button>
            <button
              onClick={props.onTest}
              disabled={props.testing || !props.form.apiUrl}
              className="flex items-center gap-2 px-4 py-2 border border-purple-300 text-purple-600 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-50"
            >
              {props.testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Testar Conexão
            </button>
          </div>

          {props.testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                props.testResult.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {props.testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {props.testResult.message}
            </div>
          )}

          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <h4 className="text-xs font-medium text-purple-700 mb-1">Como funciona</h4>
            <p className="text-xs text-purple-600">
              {props.helpText} Se a API externa falhar, o dado continua salvo localmente.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <FileText size={20} className="text-purple-600" />
          Formulários do Site
        </h2>
        <p className="text-sm text-gray-500">
          Visão geral dos formulários públicos do site e suas integrações.
        </p>
      </div>

      {/* Newsletter Form */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Newsletter</h3>
              <p className="text-xs text-gray-500">Formulário de inscrição na newsletter (páginas de notícias)</p>
            </div>
          </div>
          <a
            href="/noticias"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={12} />
            Ver no site
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{data?.newsletter.total ?? 0}</div>
            <div className="text-xs text-blue-600">Total inscritos</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{data?.newsletter.active ?? 0}</div>
            <div className="text-xs text-green-600">Ativos</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-500">{data?.newsletter.unsubscribed ?? 0}</div>
            <div className="text-xs text-gray-500">Descadastrados</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <AlertCircle size={12} />
            Configuração do formulário
          </h4>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>API (POST):</span>
              <code className="bg-white px-2 py-0.5 rounded text-purple-600">/api/newsletter/subscribe</code>
            </div>
            <div className="flex justify-between">
              <span>Campos:</span>
              <span>Email (obrigatório), Nome (opcional)</span>
            </div>
            <div className="flex justify-between">
              <span>Onde aparece:</span>
              <span>Páginas de notícias (/noticias/[slug])</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Marketing Integration - Newsletter */}
      {renderMarketingConfig({
        title: "Integração Email Marketing — Newsletter",
        description: "Sincronizar inscritos da newsletter com sistema externo",
        icon: <Send size={20} className="text-purple-600" />,
        iconBg: "bg-purple-100",
        form: newsletterForm,
        setForm: setNewsletterForm,
        saving: savingNewsletter,
        testing: testingNewsletter,
        testResult: testResultNewsletter,
        onSave: () => saveConfig("newsletter"),
        onTest: () => testConnection("newsletter"),
        placeholder: "https://mkt.m3solutions.news/api/subscribers",
        helpText: "Quando ativo, cada nova inscrição na newsletter será salva no banco do site e enviada automaticamente via API para o sistema de email marketing.",
        isLoading: configLoading,
      })}

      {/* Contact Form */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Formulário de Contato</h3>
              <p className="text-xs text-gray-500">&quot;Envie sua mensagem&quot; na página /contato</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/gestor/contatos"
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              <Eye size={12} />
              Ver todos
            </a>
            <a
              href="/contato"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
            >
              <ExternalLink size={12} />
              Ver no site
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{data?.contact.total ?? 0}</div>
            <div className="text-xs text-green-600">Total mensagens</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{data?.contact.unread ?? 0}</div>
            <div className="text-xs text-orange-500">Não lidas</div>
          </div>
        </div>

        {/* Recent messages */}
        {data?.contact.recent && data.contact.recent.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
              <Clock size={12} />
              Últimas mensagens
            </h4>
            <div className="space-y-1">
              {data.contact.recent.slice(0, 5).map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    msg.read ? "bg-gray-50" : "bg-orange-50 border border-orange-100"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {msg.read ? (
                      <MailOpen size={12} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <Eye size={12} className="text-orange-500 flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{msg.name}</span>
                    <span className="text-gray-400 truncate">{msg.email}</span>
                    {msg.subject && (
                      <span className="text-gray-500 truncate hidden md:inline">— {msg.subject}</span>
                    )}
                  </div>
                  <span className="text-gray-400 flex-shrink-0 ml-2">
                    {new Date(msg.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
            <AlertCircle size={12} />
            Configuração do formulário
          </h4>
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>API (POST):</span>
              <code className="bg-white px-2 py-0.5 rounded text-purple-600">/api/contact</code>
            </div>
            <div className="flex justify-between">
              <span>Campos obrigatórios:</span>
              <span>Nome, Email, Mensagem</span>
            </div>
            <div className="flex justify-between">
              <span>Campos opcionais:</span>
              <span>Telefone, Empresa, CNPJ, Assunto</span>
            </div>
            <div className="flex justify-between">
              <span>Notificação:</span>
              <span className="text-green-600 font-medium">✓ Email para gestores a cada contato</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Marketing Integration - Contato */}
      {renderMarketingConfig({
        title: "Integração Email Marketing — Contato",
        description: "Sincronizar contatos do formulário com sistema externo",
        icon: <MessageSquare size={20} className="text-green-600" />,
        iconBg: "bg-green-100",
        form: contactForm,
        setForm: setContactForm,
        saving: savingContact,
        testing: testingContact,
        testResult: testResultContact,
        onSave: () => saveConfig("contact"),
        onTest: () => testConnection("contact"),
        placeholder: "https://mkt.m3solutions.news/api/contacts",
        helpText: "Quando ativo, cada novo contato pelo formulário será salvo no banco do site e enviado automaticamente via API para o sistema de email marketing. Dados extras como telefone, empresa e assunto também são enviados.",
        isLoading: configLoading,
      })}

      {/* Summary */}
      <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
        <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
          <Users size={14} />
          Resumo
        </h3>
        <p className="text-xs text-purple-700">
          O site possui 2 formulários públicos ativos. Os dados são armazenados no banco de dados
          e podem ser consultados nesta página. Contatos recebidos geram notificação automática
          para os destinatários gestores. Ambos os formulários podem ser integrados com o sistema de email marketing.
        </p>
      </div>
    </div>
  );
}
