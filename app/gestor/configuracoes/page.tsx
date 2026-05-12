"use client";

import { useState, useEffect } from "react";
import {
  Save, Loader2, AlertCircle, Eye, EyeOff,
  Shield, Globe, Bot, Search, Bell, Phone, FileText, Mail, CheckCircle, XCircle, Send
} from "lucide-react";
import NotificacoesTab from "@/components/gestor/NotificacoesTab";
import FormulariosTab from "@/components/gestor/FormulariosTab";
import SmtpTab from "@/components/gestor/SmtpTab";

type TabKey = 'contato' | 'lgpd' | 'analytics' | 'ia' | 'seo' | 'smtp' | 'notificacoes' | 'formularios';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'contato', label: 'Contato', icon: <Phone size={16} /> },
  { key: 'lgpd', label: 'LGPD', icon: <Shield size={16} /> },
  { key: 'analytics', label: 'Analytics', icon: <Globe size={16} /> },
  { key: 'ia', label: 'IA', icon: <Bot size={16} /> },
  { key: 'seo', label: 'SEO', icon: <Search size={16} /> },
  { key: 'smtp', label: 'SMTP', icon: <Mail size={16} /> },
  { key: 'notificacoes', label: 'Notificações', icon: <Bell size={16} /> },
  { key: 'formularios', label: 'Formulários', icon: <FileText size={16} /> },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('contato');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gestor/site-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const toggleKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/gestor/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const Field = ({ label, dbKey, placeholder, type = 'text', help }: { label: string; dbKey: string; placeholder?: string; type?: string; help?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={config[dbKey] || ''}
          onChange={(e) => updateConfig(dbKey, e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={config[dbKey] || ''}
          onChange={(e) => updateConfig(dbKey, e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={placeholder}
        />
      )}
      {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
    </div>
  );

  const SecretField = ({ label, dbKey, placeholder, help }: { label: string; dbKey: string; placeholder?: string; help?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={showKeys[dbKey] ? 'text' : 'password'}
          value={config[dbKey] || ''}
          onChange={(e) => updateConfig(dbKey, e.target.value)}
          className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => toggleKey(dbKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showKeys[dbKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
    </div>
  );

  const Toggle = ({ label, dbKey, help }: { label: string; dbKey: string; help?: string }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {help && <p className="text-xs text-gray-400">{help}</p>}
      </div>
      <button
        type="button"
        onClick={() => updateConfig(dbKey, config[dbKey] === 'true' ? 'false' : 'true')}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          config[dbKey] === 'true' ? 'bg-purple-600' : 'bg-gray-300'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          config[dbKey] === 'true' ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="bg-white rounded-xl border p-6 space-y-4">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle size={18} />
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 whitespace-nowrap text-sm ${
              activeTab === tab.key
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ CONTATO ============ */}
      {activeTab === 'contato' && (
        <div className="space-y-6">
          <Section title="Dados da Empresa">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome da Empresa" dbKey="company_name" placeholder="M3Solutions" />
              <Field label="CNPJ" dbKey="company_cnpj" placeholder="00.000.000/0001-00" />
            </div>
          </Section>

          <Section title="Informações de Contato">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Telefone" dbKey="contact_phone" placeholder="0800 880 7777" />
              <Field label="WhatsApp (número)" dbKey="contact_whatsapp" placeholder="11947200889" />
            </div>
            <Field label="Email" dbKey="contact_email" type="email" placeholder="comercial@m3solutions.com.br" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Endereço" dbKey="contact_address" placeholder="Rua Gomes de Carvalho, 1629" />
              <Field label="Cidade" dbKey="contact_city" placeholder="São Paulo" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Estado" dbKey="contact_state" placeholder="SP" />
              <Field label="CEP" dbKey="contact_zip" placeholder="04547-006" />
            </div>
          </Section>

          <Section title="Redes Sociais">
            <Field label="Facebook" dbKey="social_facebook" type="url" placeholder="https://www.facebook.com/..." />
            <Field label="Instagram" dbKey="social_instagram" type="url" placeholder="https://www.instagram.com/..." />
            <Field label="LinkedIn" dbKey="social_linkedin" type="url" placeholder="https://www.linkedin.com/company/..." />
          </Section>

          <Section title="Domínios">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Domínio Principal" dbKey="domain_primary" placeholder="m3solutions.com.br" />
              <Field label="Domínio Alias (www)" dbKey="domain_alias" placeholder="www.m3solutions.com.br" />
            </div>
          </Section>
        </div>
      )}

      {/* ============ LGPD ============ */}
      {activeTab === 'lgpd' && (
        <div className="space-y-6">
          <Section title="Consentimento de Cookies">
            <Toggle label="Exibir banner de cookies" dbKey="cookieConsent" help="Mostra o banner de consentimento de cookies para visitantes" />
            <Field
              label="Texto do Banner de Cookies"
              dbKey="lgpd_cookie_banner_text"
              type="textarea"
              placeholder="Para melhorar sua experiência em nosso website, utilizamos cookies..."
              help="Texto exibido no banner de consentimento de cookies"
            />
            <Field
              label="URL da Política de Cookies"
              dbKey="lgpd_cookie_policy_url"
              placeholder="/aviso-de-cookies"
              help="Link para a página de política de cookies"
            />
          </Section>

          <Section title="Política de Privacidade">
            <Field
              label="URL da Política de Privacidade"
              dbKey="lgpd_privacy_policy_url"
              placeholder="/aviso-de-privacidade"
              help="Link para a página de política de privacidade"
            />
            <Field
              label="Versão da Política"
              dbKey="lgpd_privacy_version"
              placeholder="1.0"
              help="Versão atual da política de privacidade (usado para controle de atualizações)"
            />
            <Field
              label="Data da Última Atualização"
              dbKey="lgpd_privacy_updated_at"
              placeholder="2026-01-01"
              help="Data da última revisão da política de privacidade"
            />
          </Section>

          <Section title="Encarregado de Dados (DPO)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome do DPO" dbKey="lgpd_dpo_name" placeholder="Nome do encarregado de dados" />
              <Field label="Email do DPO" dbKey="lgpd_dpo_email" type="email" placeholder="dpo@m3solutions.com.br" />
            </div>
            <Field label="Telefone do DPO" dbKey="lgpd_dpo_phone" placeholder="(11) 0000-0000" />
          </Section>

          <Section title="Retenção de Dados">
            <Field
              label="Período de Retenção de Dados (meses)"
              dbKey="lgpd_data_retention_months"
              placeholder="24"
              help="Tempo em meses que os dados pessoais serão mantidos"
            />
            <Field
              label="Período de Retenção de Logs (meses)"
              dbKey="lgpd_log_retention_months"
              placeholder="12"
              help="Tempo em meses que os logs de acesso/auditoria serão mantidos"
            />
            <Toggle
              label="Permitir solicitação de exclusão de dados"
              dbKey="lgpd_allow_data_deletion"
              help="Permite que usuários solicitem a exclusão de seus dados pessoais"
            />
          </Section>

          <Section title="Coleta de Dados">
            <Toggle label="Coleta de dados de formulários" dbKey="lgpd_collect_forms" help="Permitir coleta de dados via formulários do site" />
            <Toggle label="Coleta de dados de newsletter" dbKey="lgpd_collect_newsletter" help="Permitir coleta de emails para newsletter" />
            <Toggle label="Analytics e rastreamento" dbKey="lgpd_collect_analytics" help="Permitir coleta de dados de navegação e analytics" />
            <Field
              label="Texto de Consentimento em Formulários"
              dbKey="lgpd_form_consent_text"
              type="textarea"
              placeholder="Ao enviar este formulário, você concorda com nossa Política de Privacidade..."
              help="Texto exibido junto ao checkbox de consentimento nos formulários"
            />
          </Section>

          <Section title="Canal de Denúncias">
            <Field label="URL do Canal de Denúncias" dbKey="lgpd_complaint_channel_url" placeholder="/canal-de-denuncias" />
            <Field label="Email do Canal de Denúncias" dbKey="lgpd_complaint_email" type="email" placeholder="denuncia@m3solutions.com.br" />
          </Section>
        </div>
      )}

      {/* ============ ANALYTICS ============ */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Section title="Google Analytics 4">
            <Field label="ID do Google Analytics (GA4)" dbKey="analytics_ga4_id" placeholder="G-XXXXXXXXXX" help="Measurement ID do Google Analytics 4" />
            <Field label="Property ID do GA4" dbKey="analytics_ga4_property_id" placeholder="123456789" help="ID numérico da propriedade do GA4 (usado para relatórios via API)" />
          </Section>

          <Section title="Google Tag Manager">
            <Field label="ID do GTM" dbKey="analytics_gtm_id" placeholder="GTM-XXXXXXX" help="Container ID do Google Tag Manager" />
          </Section>

          <Section title="Scripts Personalizados">
            <Field
              label="Scripts no <head>"
              dbKey="analytics_custom_head"
              type="textarea"
              placeholder="<script>...</script>"
              help="Scripts personalizados inseridos no <head> de todas as páginas"
            />
            <Field
              label="Scripts no <body>"
              dbKey="analytics_custom_body"
              type="textarea"
              placeholder="<script>...</script>"
              help="Scripts personalizados inseridos antes do fechamento do <body>"
            />
          </Section>
        </div>
      )}

      {/* ============ IA ============ */}
      {activeTab === 'ia' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
            <p className="text-sm text-blue-800">
              <strong>💡 Dica:</strong> Configure aqui as chaves de API e pesos de cada provedor de IA.
              O peso determina a probabilidade de cada provedor ser escolhido na geração de conteúdo.
            </p>
          </div>

          <Section title="OpenAI / ChatGPT">
            <Toggle label="Habilitado" dbKey="ai_chatgpt_enabled" help="Ativar ou desativar o uso do ChatGPT na geração de conteúdo" />
            <SecretField label="API Key" dbKey="ai_chatgpt_api_key" placeholder="sk-proj-..." help="Chave de API do OpenAI" />
            <Field label="Peso (probabilidade)" dbKey="ai_chatgpt_weight" placeholder="50" help="Peso relativo para seleção (ex: 50 = 50% de chance se total de pesos = 100)" />
            <Field label="Modelo Padrão" dbKey="ai_chatgpt_model" placeholder="gpt-4o" help="Modelo utilizado para geração de texto (ex: gpt-4o, gpt-4o-mini)" />
            <Field label="Modelo de Imagem" dbKey="ai_chatgpt_image_model" placeholder="dall-e-3" help="Modelo utilizado para geração de imagens" />
          </Section>

          <Section title="Abacus.AI">
            <Toggle label="Habilitado" dbKey="ai_abacus_enabled" help="Ativar ou desativar o uso do Abacus.AI" />
            <SecretField label="API Key" dbKey="ai_abacus_api_key" placeholder="Chave de API do Abacus.AI" />
            <Field label="Peso (probabilidade)" dbKey="ai_abacus_weight" placeholder="100" help="Peso relativo para seleção" />
          </Section>

          <Section title="Google Gemini">
            <Toggle label="Habilitado" dbKey="ai_gemini_enabled" help="Ativar ou desativar o uso do Google Gemini" />
            <SecretField label="API Key" dbKey="ai_gemini_api_key" placeholder="Chave de API do Google Gemini" />
            <Field label="Peso (probabilidade)" dbKey="ai_gemini_weight" placeholder="30" help="Peso relativo para seleção" />
          </Section>

          <Section title="Configurações Gerais de IA">
            <Field label="Temperatura Padrão" dbKey="ai_default_temperature" placeholder="0.7" help="Temperatura padrão para geração de texto (0.0 a 1.0)" />
            <Field label="Max Tokens" dbKey="ai_default_max_tokens" placeholder="4000" help="Número máximo de tokens por geração" />
            <Toggle label="Gerar imagens com IA" dbKey="ai_generate_images" help="Usar IA para gerar imagens de destaque dos posts (quando desativado, usa imagens de fallback)" />
          </Section>
        </div>
      )}

      {/* ============ SEO ============ */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <Section title="Meta Tags de Verificação">
            <Field
              label="Google Search Console (meta tag)"
              dbKey="seo_google_meta_tag"
              placeholder="conteúdo da meta tag de verificação do Google"
              help="Valor da meta tag google-site-verification"
            />
            <Field
              label="Bing Webmaster (meta tag)"
              dbKey="seo_bing_meta_tag"
              placeholder="conteúdo da meta tag de verificação do Bing"
              help="Valor da meta tag msvalidate.01"
            />
          </Section>

          <Section title="Google Search Console">
            <Field
              label="Propriedade Padrão"
              dbKey="seo_google_default_property"
              placeholder="https://m3solutions.com.br/"
              help="URL da propriedade verificada no Google Search Console"
            />
          </Section>

          <Section title="Webmaster Tools">
            <Field label="Google Webmaster Verification" dbKey="webmaster_google" placeholder="Código de verificação Google" />
            <Field label="Bing Webmaster Verification" dbKey="webmaster_bing" placeholder="Código de verificação Bing" />
          </Section>

          <Section title="Configurações de Sitemap">
            <Field
              label="Versão Ativa do Sitemap"
              dbKey="sitemap_active_version"
              placeholder="sitemap_version_..."
              help="Identificador da versão ativa do sitemap (gerenciado automaticamente)"
            />
          </Section>

          <Section title="Open Graph / Redes Sociais">
            <Field label="Título padrão para OG" dbKey="seo_og_title" placeholder="M3Solutions - Soluções em TI" help="Título usado quando a página não define um próprio" />
            <Field label="Descrição padrão para OG" dbKey="seo_og_description" type="textarea" placeholder="Descrição padrão para compartilhamento" />
            <Field label="Imagem padrão para OG" dbKey="seo_og_image" placeholder="https://lh6.googleusercontent.com/vtWF6bdArOp6FxMN4E382qIq9wDVyjySF8U7p0QWaFj7F3EjyBAxRQ6VSNQJ7jlvN2O3Mb-Ia41F9j8ogFMGzB8FvXiW-vmTm71ZhTNayAPHn2-7wk5VT793VbUWALZh5PJti7UjGPMwo_X8bSSCLw" help="URL da imagem padrão para compartilhamento em redes sociais" />
          </Section>
        </div>
      )}

      {/* ============ SMTP ============ */}
      {activeTab === 'smtp' && (
        <SmtpTab config={config} updateConfig={updateConfig} SecretField={SecretField} Field={Field} Section={Section} />
      )}

      {/* ============ NOTIFICAÇÕES ============ */}
      {activeTab === 'notificacoes' && (
        <NotificacoesTab />
      )}

      {/* ============ FORMULÁRIOS ============ */}
      {activeTab === 'formularios' && (
        <FormulariosTab />
      )}

      {/* Save Button */}
      {activeTab !== 'notificacoes' && activeTab !== 'formularios' && activeTab !== 'smtp' && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Configurações
          </button>
        </div>
      )}
    </div>
  );
}
