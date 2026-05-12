"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Shield, Cookie, Settings, Check, ChevronDown, ChevronUp, Lock, BarChart3, Target, Sparkles } from "lucide-react";

interface LgpdConfig {
  lgpd_enabled: boolean;
  lgpd_cookie_text: string;
  lgpd_accept_text: string;
  lgpd_reject_text: string;
  lgpd_more_info_text: string;
  lgpd_privacy_url: string;
  lgpd_cookie_url: string;
  lgpd_position: string;
  lgpd_style: string;
}

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieCategory {
  id: keyof CookiePreferences;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  cookies: { name: string; purpose: string; duration: string }[];
}

const defaultConfig: LgpdConfig = {
  lgpd_enabled: true,
  lgpd_cookie_text: 'Para melhorar sua experiência em nosso website, utilizamos cookies. Eles nos ajudam a personalizar conteúdo e anúncios, além de analisar nosso tráfego. Ao navegar em nosso site, você tem a opção de personalizar suas preferências de cookies, podendo aceitá-los, recusá-los ou ajustá-los conforme seu consentimento. É importante destacar que os cookies estritamente necessários são sempre ativos para garantir o funcionamento básico e correto do site, amparados pela hipótese legal de legítimo interesse pela LGPD.',
  lgpd_accept_text: 'Aceitar todos',
  lgpd_reject_text: 'Rejeitar cookies não necessários',
  lgpd_more_info_text: 'Personalizar',
  lgpd_privacy_url: '/aviso-de-privacidade',
  lgpd_cookie_url: '/aviso-de-cookies',
  lgpd_position: 'bottom',
  lgpd_style: 'bar'
};

const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false
};

const cookieCategories: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Cookies Essenciais',
    description: 'Necessários para o funcionamento básico do site. Sem eles, o site não funciona corretamente. Não podem ser desativados.',
    icon: <Lock size={18} />,
    required: true,
    cookies: [
      { name: 'session_id', purpose: 'Mantém sua sessão de navegação', duration: 'Sessão' },
      { name: 'cookie_consent', purpose: 'Armazena suas preferências de cookies', duration: '1 ano' },
      { name: 'csrf_token', purpose: 'Proteção contra ataques CSRF', duration: 'Sessão' },
    ]
  },
  {
    id: 'functional',
    name: 'Cookies Funcionais',
    description: 'Permitem funcionalidades aprimoradas como lembrar preferências, idioma e região. Se desativados, algumas funcionalidades podem não funcionar.',
    icon: <Sparkles size={18} />,
    required: false,
    cookies: [
      { name: 'user_preferences', purpose: 'Lembra suas preferências de exibição', duration: '1 ano' },
      { name: 'language', purpose: 'Armazena preferência de idioma', duration: '1 ano' },
      { name: 'timezone', purpose: 'Detecta seu fuso horário', duration: '30 dias' },
    ]
  },
  {
    id: 'analytics',
    name: 'Cookies de Análise',
    description: 'Coletam informações sobre como você usa o site para nos ajudar a melhorá-lo. Dados são anonimizados e agregados.',
    icon: <BarChart3 size={18} />,
    required: false,
    cookies: [
      { name: '_ga', purpose: 'Google Analytics - Distingue usuários', duration: '2 anos' },
      { name: '_gid', purpose: 'Google Analytics - Identifica sessão', duration: '24 horas' },
      { name: '_gat', purpose: 'Google Analytics - Limita taxa de requisições', duration: '1 minuto' },
    ]
  },
  {
    id: 'marketing',
    name: 'Cookies de Marketing',
    description: 'Utilizados para exibir anúncios relevantes. Podem rastrear sua navegação em diferentes sites.',
    icon: <Target size={18} />,
    required: false,
    cookies: [
      { name: '_fbp', purpose: 'Facebook Pixel - Rastreamento de anúncios', duration: '3 meses' },
      { name: 'NID', purpose: 'Google Ads - Preferências de anúncios', duration: '6 meses' },
      { name: '_gcl_au', purpose: 'Google Ads - Conversões de anúncios', duration: '3 meses' },
    ]
  }
];

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [config, setConfig] = useState<LgpdConfig>(defaultConfig);
  const [isClosing, setIsClosing] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se já aceitou/rejeitou cookies
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Carregar preferências salvas
      try {
        const saved = JSON.parse(consent);
        setPreferences({
          essential: true,
          functional: saved.functional ?? false,
          analytics: saved.analytics ?? false,
          marketing: saved.marketing ?? false
        });
      } catch {
        // ignore
      }
    }

    // Carregar configurações do banco
    fetch('/api/gestor/site-config')
      .then(res => res.json())
      .then(data => {
        if (data.lgpd_enabled !== undefined) {
          setConfig(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify({
      accepted: true,
      ...prefs,
      timestamp: new Date().toISOString(),
      version: '2.0'
    }));
    
    // Dispatch evento para outros scripts reagirem
    window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: prefs }));
    
    closeWithAnimation();
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };
    setPreferences(onlyEssential);
    savePreferences(onlyEssential);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Não pode desativar essenciais
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setShowPreferences(false);
    }, 300);
  };

  if (!isVisible || !config.lgpd_enabled) return null;

  // Modal de preferências detalhadas
  if (showPreferences) {
    return (
      <>
        <div 
          className={`fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={() => setShowPreferences(false)}
        />
        
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
            isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Settings size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Configurar Cookies
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Personalize suas preferências conforme a LGPD
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Seus direitos (LGPD):</strong> Você tem o direito de escolher quais cookies aceita. 
                  Cookies essenciais são necessários para o funcionamento do site e não podem ser desativados.
                </p>
              </div>

              {cookieCategories.map((category) => (
                <div 
                  key={category.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        preferences[category.id] 
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {category.name}
                          {category.required && (
                            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                              Obrigatório
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Toggle Switch */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePreference(category.id);
                        }}
                        disabled={category.required}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences[category.id]
                            ? 'bg-purple-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                        } ${category.required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span 
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            preferences[category.id] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      {expandedCategory === category.id ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedCategory === category.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {category.description}
                      </p>
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Cookies utilizados:
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left p-2 text-gray-600 dark:text-gray-400 font-medium">Nome</th>
                                <th className="text-left p-2 text-gray-600 dark:text-gray-400 font-medium">Finalidade</th>
                                <th className="text-left p-2 text-gray-600 dark:text-gray-400 font-medium">Duração</th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.cookies.map((cookie, idx) => (
                                <tr 
                                  key={idx}
                                  className="border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                                >
                                  <td className="p-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                                    {cookie.name}
                                  </td>
                                  <td className="p-2 text-gray-600 dark:text-gray-400">
                                    {cookie.purpose}
                                  </td>
                                  <td className="p-2 text-gray-500 dark:text-gray-500">
                                    {cookie.duration}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Salvar preferências
                </button>
                <button
                  onClick={handleRejectNonEssential}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-xl transition"
                >
                  Rejeitar cookies não necessários
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition"
                >
                  Aceitar todos
                </button>
              </div>
              <div className="mt-4 flex gap-4 justify-center text-xs text-gray-500 dark:text-gray-400">
                <Link href={config.lgpd_privacy_url} className="hover:text-purple-600 underline">
                  Política de Privacidade
                </Link>
                <Link href={config.lgpd_cookie_url} className="hover:text-purple-600 underline">
                  Política de Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Banner inicial
  const positionClasses = {
    'bottom': 'bottom-0 left-0 right-0',
    'bottom-left': 'bottom-4 left-4 max-w-md',
    'bottom-right': 'bottom-4 right-4 max-w-md',
    'center': 'inset-0 flex items-center justify-center'
  }[config.lgpd_position] || 'bottom-0 left-0 right-0';

  const isModal = config.lgpd_style === 'modal' || config.lgpd_position === 'center';
  const isBox = config.lgpd_style === 'box' || config.lgpd_position.includes('left') || config.lgpd_position.includes('right');

  return (
    <>
      {isModal && (
        <div 
          className={`fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      
      <div 
        className={`fixed z-[9999] transition-all duration-300 ${
          positionClasses
        } ${
          isClosing 
            ? 'opacity-0 translate-y-4' 
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div 
          className={`bg-gray-900 text-white shadow-2xl ${
            isModal ? 'rounded-2xl max-w-lg mx-4 p-6' : 
            isBox ? 'rounded-xl m-4 p-5' : 
            'p-4 md:px-8'
          }`}
        >
          <div className={`${
            isModal || isBox 
              ? 'flex flex-col' 
              : 'container mx-auto flex flex-col md:flex-row md:items-center gap-4'
          }`}>
            <div className="flex items-start gap-3 mb-3 md:mb-0">
              <div className="p-2 bg-purple-600 rounded-lg shrink-0">
                <Cookie size={20} />
              </div>
              <div className="flex-1">
                {(isModal || isBox) && (
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Shield size={18} className="text-purple-400" />
                    Privacidade e Cookies
                  </h3>
                )}
                <p className={`text-gray-300 text-sm leading-relaxed text-justify ${
                  isModal || isBox ? '' : 'md:max-w-2xl'
                }`}>
                  {config.lgpd_cookie_text}
                </p>
                <div className="flex gap-3 mt-2 text-sm">
                  <Link 
                    href={config.lgpd_privacy_url} 
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Política de Privacidade
                  </Link>
                  <Link 
                    href={config.lgpd_cookie_url} 
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Política de Cookies
                  </Link>
                </div>
              </div>
            </div>

            <div className={`flex gap-2 shrink-0 ${
              isModal || isBox 
                ? 'mt-4 flex-col sm:flex-row' 
                : 'md:ml-auto flex-col sm:flex-row'
            }`}>
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition whitespace-nowrap flex items-center justify-center gap-2"
              >
                <Settings size={14} />
                {config.lgpd_more_info_text}
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition whitespace-nowrap"
              >
                {config.lgpd_reject_text}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition whitespace-nowrap"
              >
                {config.lgpd_accept_text}
              </button>
            </div>
          </div>

          {(isModal || isBox) && (
            <button
              onClick={handleRejectNonEssential}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
