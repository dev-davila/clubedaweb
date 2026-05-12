// Página de Configurações de Segurança
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  RefreshCw,
  Save,
  Shield,
  Clock,
  Ban,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface SecuritySettings {
  rate_limit_requests_per_minute: number;
  rate_limit_login_attempts: number;
  rate_limit_login_window_minutes: number;
  rate_limit_api_requests_per_minute: number;
  block_duration_minutes: number;
  block_escalation_multiplier: number;
  max_block_duration_hours: number;
  rule_sql_injection_enabled: boolean;
  rule_xss_enabled: boolean;
  rule_path_traversal_enabled: boolean;
  rule_brute_force_enabled: boolean;
  rule_bot_scan_enabled: boolean;
  rule_rate_limit_enabled: boolean;
  rule_upload_validation_enabled: boolean;
  observation_mode: boolean;
  suspicious_routes: string[];
  forbidden_extensions: string[];
  excluded_routes: string[];
}

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gestor/security/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setSaved(false);
    
    try {
      const res = await fetch("/api/gestor/security/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("Erro ao salvar configurações");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SecuritySettings>(
    key: K,
    value: SecuritySettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const toggleRule = (key: keyof SecuritySettings) => {
    if (!settings) return;
    const current = settings[key];
    if (typeof current === "boolean") {
      setSettings({ ...settings, [key]: !current });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Erro ao carregar configurações</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/gestor/seguranca"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações de Segurança</h1>
            <p className="text-sm text-gray-500">Ajuste regras e limites de proteção</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : saved ? (
            <CheckCircle size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Modo de Operação */}
      <div className={`rounded-xl p-5 border ${
        settings.observation_mode 
          ? "bg-amber-50 border-amber-200" 
          : "bg-green-50 border-green-200"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              settings.observation_mode ? "bg-amber-100" : "bg-green-100"
            }`}>
              {settings.observation_mode ? (
                <Eye className="text-amber-600" size={24} />
              ) : (
                <Shield className="text-green-600" size={24} />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${
                settings.observation_mode ? "text-amber-800" : "text-green-800"
              }`}>
                {settings.observation_mode ? "Modo Observação" : "Modo Proteção"}
              </h3>
              <p className={`text-sm ${
                settings.observation_mode ? "text-amber-600" : "text-green-600"
              }`}>
                {settings.observation_mode 
                  ? "O sistema apenas registra eventos sem bloquear requisições" 
                  : "O sistema bloqueia requisições suspeitas automaticamente"}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleRule("observation_mode")}
            className={`relative w-14 h-7 rounded-full transition ${
              settings.observation_mode ? "bg-amber-400" : "bg-green-500"
            }`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.observation_mode ? "left-1" : "left-8"
            }`} />
          </button>
        </div>
        {!settings.observation_mode && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-yellow-700">
              <strong>Atenção:</strong> No modo proteção, requisições suspeitas serão bloqueadas.
              Certifique-se de que as regras estão bem calibradas para evitar falsos positivos.
            </p>
          </div>
        )}
      </div>

      {/* Regras Ativas */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={18} />
          Regras de Detecção
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "rule_sql_injection_enabled", label: "SQL Injection", desc: "Detecta tentativas de injeção SQL" },
            { key: "rule_xss_enabled", label: "XSS (Cross-Site Scripting)", desc: "Detecta scripts maliciosos" },
            { key: "rule_path_traversal_enabled", label: "Path Traversal", desc: "Detecta acesso a arquivos não autorizados" },
            { key: "rule_brute_force_enabled", label: "Brute Force", desc: "Protege contra ataques de força bruta" },
            { key: "rule_bot_scan_enabled", label: "Bot/Scanner", desc: "Detecta bots e scanners automatizados" },
            { key: "rule_rate_limit_enabled", label: "Rate Limiting", desc: "Limita requisições por IP" },
            { key: "rule_upload_validation_enabled", label: "Validação de Upload", desc: "Valida arquivos enviados" },
          ].map((rule) => (
            <div
              key={rule.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">{rule.label}</p>
                <p className="text-xs text-gray-500">{rule.desc}</p>
              </div>
              <button
                onClick={() => toggleRule(rule.key as keyof SecuritySettings)}
                className="text-gray-400 hover:text-gray-600"
              >
                {settings[rule.key as keyof SecuritySettings] ? (
                  <ToggleRight size={28} className="text-green-500" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-300" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} />
          Limites de Requisições
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requisições por minuto (geral)
            </label>
            <input
              type="number"
              value={settings.rate_limit_requests_per_minute}
              onChange={(e) => updateSetting("rate_limit_requests_per_minute", parseInt(e.target.value) || 60)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Máximo de requisições por IP por minuto</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requisições API por minuto
            </label>
            <input
              type="number"
              value={settings.rate_limit_api_requests_per_minute}
              onChange={(e) => updateSetting("rate_limit_api_requests_per_minute", parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Para endpoints de API</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tentativas de login
            </label>
            <input
              type="number"
              value={settings.rate_limit_login_attempts}
              onChange={(e) => updateSetting("rate_limit_login_attempts", parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Máximo de falhas antes de bloqueio</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Janela de login (minutos)
            </label>
            <input
              type="number"
              value={settings.rate_limit_login_window_minutes}
              onChange={(e) => updateSetting("rate_limit_login_window_minutes", parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Período para contar tentativas</p>
          </div>
        </div>
      </div>

      {/* Bloqueios */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Ban size={18} />
          Configurações de Bloqueio
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração inicial (minutos)
            </label>
            <input
              type="number"
              value={settings.block_duration_minutes}
              onChange={(e) => updateSetting("block_duration_minutes", parseInt(e.target.value) || 15)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Multiplicador de escalonamento
            </label>
            <input
              type="number"
              value={settings.block_escalation_multiplier}
              onChange={(e) => updateSetting("block_escalation_multiplier", parseInt(e.target.value) || 2)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração máxima (horas)
            </label>
            <input
              type="number"
              value={settings.max_block_duration_hours}
              onChange={(e) => updateSetting("max_block_duration_hours", parseInt(e.target.value) || 24)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-medium text-blue-800">Sobre as Configurações</h4>
          <p className="text-sm text-blue-700 mt-1">
            As alterações entram em vigor imediatamente após salvar.
            Recomendamos manter o modo observação ativo por alguns dias para calibrar as regras
            antes de ativar a proteção completa.
          </p>
        </div>
      </div>
    </div>
  );
}
