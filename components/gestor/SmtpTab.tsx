"use client";

import { useState } from "react";
import {
  Save, Loader2, CheckCircle, XCircle, Send, Eye, EyeOff, AlertCircle, Wifi
} from "lucide-react";

interface SmtpTabProps {
  config: Record<string, string>;
  updateConfig: (key: string, value: string) => void;
  SecretField: React.ComponentType<{ label: string; dbKey: string; placeholder?: string; help?: string }>;
  Field: React.ComponentType<{ label: string; dbKey: string; placeholder?: string; type?: string; help?: string }>;
  Section: React.ComponentType<{ title: string; children: React.ReactNode }>;
}

export default function SmtpTab({ config, updateConfig, SecretField, Field, Section }: SmtpTabProps) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [sendResult, setSendResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const smtpData: Record<string, string> = {};
      ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'].forEach(key => {
        if (config[key] !== undefined) smtpData[key] = config[key];
      });

      const res = await fetch('/api/gestor/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpData)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configurações SMTP salvas com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar configurações SMTP' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/gestor/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp_host: config.smtp_host,
          smtp_port: config.smtp_port,
          smtp_user: config.smtp_user,
          smtp_pass: config.smtp_pass,
          smtp_from: config.smtp_from,
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, error: 'Erro de rede ao testar conexão' });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/gestor/smtp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      const data = await res.json();
      setSendResult(data);
    } catch {
      setSendResult({ success: false, error: 'Erro de rede ao enviar email' });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
        <p className="text-sm text-blue-800">
          <strong>📧 SMTP:</strong> Configure seu servidor de email para envio de notificações do sistema.
          Todas as notificações (contatos, crônicas, alertas) serão enviadas por este servidor.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle size={18} />
          {message.text}
        </div>
      )}

      <Section title="Servidor SMTP">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Host SMTP"
            dbKey="smtp_host"
            placeholder="mail01.m3solutions.com.br"
            help="Endereço do servidor SMTP"
          />
          <Field
            label="Porta"
            dbKey="smtp_port"
            placeholder="587"
            help="Portas comuns: 587 (STARTTLS), 465 (SSL), 25 (sem criptografia)"
          />
        </div>
        <Field
          label="Usuário"
          dbKey="smtp_user"
          placeholder="user@m3solutions.com.br"
          help="Email ou usuário para autenticação"
        />
        <SecretField
          label="Senha"
          dbKey="smtp_pass"
          placeholder="Senha do servidor SMTP"
          help="Senha para autenticação SMTP"
        />
        <Field
          label="Email Remetente (From)"
          dbKey="smtp_from"
          placeholder="noreply@m3solutions.com.br"
          help="Endereço de email que aparecerá como remetente nas notificações"
        />
      </Section>

      {/* Test Connection */}
      <Section title="Testar Conexão">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testing || !config.smtp_host || !config.smtp_user}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {testing ? <Loader2 className="animate-spin" size={18} /> : <Wifi size={18} />}
            Testar Conexão SMTP
          </button>

          {testResult && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
              testResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {testResult.success ? 'Conexão bem-sucedida!' : testResult.error}
            </div>
          )}
        </div>
      </Section>

      {/* Send Test Email */}
      <Section title="Enviar Email de Teste">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Digite o email de destino..."
            className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSendTestEmail}
            disabled={sendingTest || !testEmail}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 whitespace-nowrap"
          >
            {sendingTest ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            Enviar Teste
          </button>
        </div>

        {sendResult && (
          <div className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
            sendResult.success
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {sendResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
            {sendResult.success ? 'Email de teste enviado com sucesso! Verifique sua caixa de entrada.' : sendResult.error}
          </div>
        )}
      </Section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 shadow-sm"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Salvar Configurações SMTP
        </button>
      </div>
    </div>
  );
}
