"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home, ChevronDown, ChevronUp, Save, Loader2, Plus, Trash2, GripVertical,
  Image as ImageIcon, Type, Link2, Star, Award, Users, RotateCcw, Check
} from "lucide-react";
import type {
  HeroConfig, ServiceItem, SolutionItem, FeatureItem, TestimonialItem, HomeConfig
} from "@/lib/home-config";
import {
  DEFAULT_HERO, DEFAULT_SERVICES, DEFAULT_SOLUTIONS, DEFAULT_FEATURES, DEFAULT_TESTIMONIALS
} from "@/lib/home-config";

type SectionKey = "hero" | "services" | "solutions" | "features" | "testimonials";

const SECTION_LABELS: Record<SectionKey, { label: string; icon: any; description: string }> = {
  hero: { label: "Hero (Banner Principal)", icon: ImageIcon, description: "T\u00edtulo, subt\u00edtulo, bot\u00f5es CTA, estat\u00edsticas e imagem de fundo" },
  services: { label: "Servi\u00e7os", icon: Award, description: "Cards de servi\u00e7os exibidos na home" },
  solutions: { label: "Solu\u00e7\u00f5es Avan\u00e7adas", icon: Star, description: "Cards de solu\u00e7\u00f5es com imagem de fundo" },
  features: { label: "Diferenciais (Por que n\u00f3s)", icon: Award, description: "Cards de diferenciais da empresa" },
  testimonials: { label: "Depoimentos", icon: Users, description: "Depoimentos de clientes" }
};

const ICON_OPTIONS = [
  "Lightbulb", "Settings", "Laptop", "Monitor", "FolderKanban", "Headphones",
  "Cloud", "Server", "Shield", "Key", "Lock", "Zap", "Award", "Users",
  "Clock", "CheckCircle", "TrendingUp", "Star", "Target", "Cpu"
];

export default function GestorHomePage() {
  const [config, setConfig] = useState<HomeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SectionKey | null>(null);
  const [saved, setSaved] = useState<SectionKey | null>(null);
  const [openSection, setOpenSection] = useState<SectionKey | null>("hero");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gestor/home-config")
      .then(res => res.json())
      .then(data => { setConfig(data); setLoading(false); })
      .catch(() => {
        setConfig({
          hero: DEFAULT_HERO,
          services: DEFAULT_SERVICES,
          solutions: DEFAULT_SOLUTIONS,
          features: DEFAULT_FEATURES,
          testimonials: DEFAULT_TESTIMONIALS
        });
        setLoading(false);
      });
  }, []);

  const saveSection = useCallback(async (section: SectionKey) => {
    if (!config) return;
    setSaving(section);
    setError(null);
    try {
      const res = await fetch("/api/gestor/home-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data: config[section] })
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      setSaved(section);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(null);
    }
  }, [config]);

  const resetSection = useCallback((section: SectionKey) => {
    if (!config) return;
    const defaults: Record<SectionKey, any> = {
      hero: DEFAULT_HERO,
      services: DEFAULT_SERVICES,
      solutions: DEFAULT_SOLUTIONS,
      features: DEFAULT_FEATURES,
      testimonials: DEFAULT_TESTIMONIALS
    };
    setConfig({ ...config, [section]: JSON.parse(JSON.stringify(defaults[section])) });
  }, [config]);

  const toggleSection = (key: SectionKey) => {
    setOpenSection(openSection === key ? null : key);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Home className="w-7 h-7 text-blue-600" />
            Edi\u00e7\u00e3o da Home
          </h1>
          <p className="text-gray-500 mt-1">Edite o conte\u00fado de cada se\u00e7\u00e3o da p\u00e1gina inicial</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {(Object.keys(SECTION_LABELS) as SectionKey[]).map(key => {
          const { label, icon: SIcon, description } = SECTION_LABELS[key];
          const isOpen = openSection === key;
          const isSaving = saving === key;
          const isSaved = saved === key;

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <SIcon className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500">{description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSaved && <span className="text-green-600 text-sm flex items-center gap-1"><Check size={14} /> Salvo</span>}
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {/* Section content */}
              {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="pt-4">
                    {key === "hero" && <HeroEditor value={config.hero} onChange={v => setConfig({ ...config, hero: v })} />}
                    {key === "services" && <ListEditor items={config.services} onChange={v => setConfig({ ...config, services: v })} type="service" />}
                    {key === "solutions" && <ListEditor items={config.solutions} onChange={v => setConfig({ ...config, solutions: v })} type="solution" />}
                    {key === "features" && <FeaturesEditor items={config.features} onChange={v => setConfig({ ...config, features: v })} />}
                    {key === "testimonials" && <TestimonialsEditor items={config.testimonials} onChange={v => setConfig({ ...config, testimonials: v })} />}
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => saveSection(key)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {isSaving ? "Salvando..." : "Salvar se\u00e7\u00e3o"}
                    </button>
                    <button
                      onClick={() => resetSection(key)}
                      className="inline-flex items-center gap-2 text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <RotateCcw size={16} />
                      Restaurar padr\u00e3o
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== HERO EDITOR ====================

function HeroEditor({ value, onChange }: { value: HeroConfig; onChange: (v: HeroConfig) => void }) {
  const update = (partial: Partial<HeroConfig>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Badge (texto pequeno acima do t\u00edtulo)</label>
          <input
            type="text" value={value.badge}
            onChange={e => update({ badge: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Palavra destacada (em azul)</label>
          <input
            type="text" value={value.titleHighlight}
            onChange={e => update({ titleHighlight: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          T\u00edtulo <span className="text-gray-400 text-xs">(use {'{highlight}'} para marcar onde aparece a palavra destacada)</span>
        </label>
        <input
          type="text" value={value.title}
          onChange={e => update({ title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subt\u00edtulo</label>
        <textarea
          value={value.subtitle} rows={2}
          onChange={e => update({ subtitle: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de fundo (URL)</label>
        <input
          type="text" value={value.backgroundImage}
          onChange={e => update({ backgroundImage: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bot\u00e3o prim\u00e1rio - Texto</label>
          <input type="text" value={value.ctaPrimaryText} onChange={e => update({ ctaPrimaryText: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bot\u00e3o prim\u00e1rio - Link</label>
          <input type="text" value={value.ctaPrimaryLink} onChange={e => update({ ctaPrimaryLink: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bot\u00e3o secund\u00e1rio - Texto</label>
          <input type="text" value={value.ctaSecondaryText} onChange={e => update({ ctaSecondaryText: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bot\u00e3o secund\u00e1rio - Link</label>
          <input type="text" value={value.ctaSecondaryLink} onChange={e => update({ ctaSecondaryLink: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      {/* Stats */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Estat\u00edsticas</label>
        <div className="space-y-2">
          {value.stats?.map((stat, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text" value={stat.value} placeholder="Valor"
                onChange={e => {
                  const newStats = [...value.stats];
                  newStats[i] = { ...newStats[i], value: e.target.value };
                  update({ stats: newStats });
                }}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text" value={stat.label} placeholder="Label"
                onChange={e => {
                  const newStats = [...value.stats];
                  newStats[i] = { ...newStats[i], label: e.target.value };
                  update({ stats: newStats });
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => update({ stats: value.stats.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
          <button
            onClick={() => update({ stats: [...value.stats, { value: "", label: "" }] })}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus size={14} /> Adicionar estat\u00edstica
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Cards de destaque (lateral direita)</label>
        <div className="space-y-2">
          {value.featureCards?.map((card, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select
                value={card.icon}
                onChange={e => {
                  const newCards = [...value.featureCards];
                  newCards[i] = { ...newCards[i], icon: e.target.value };
                  update({ featureCards: newCards });
                }}
                className="w-32 border border-gray-300 rounded-lg px-2 py-2 text-sm"
              >
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input
                type="text" value={card.title} placeholder="T\u00edtulo"
                onChange={e => {
                  const newCards = [...value.featureCards];
                  newCards[i] = { ...newCards[i], title: e.target.value };
                  update({ featureCards: newCards });
                }}
                className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text" value={card.description} placeholder="Descri\u00e7\u00e3o"
                onChange={e => {
                  const newCards = [...value.featureCards];
                  newCards[i] = { ...newCards[i], description: e.target.value };
                  update({ featureCards: newCards });
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => update({ featureCards: value.featureCards.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          ))}
          <button
            onClick={() => update({ featureCards: [...value.featureCards, { icon: "Shield", title: "", description: "" }] })}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus size={14} /> Adicionar card
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== LIST EDITOR (Services / Solutions) ====================

function ListEditor({ items, onChange, type }: { items: (ServiceItem | SolutionItem)[]; onChange: (v: any[]) => void; type: "service" | "solution" }) {
  const addItem = () => {
    onChange([...items, { title: "", slug: "", description: "", icon: "Cloud", image: "cloud" }]);
  };

  const updateItem = (index: number, partial: Partial<ServiceItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...partial };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const IMAGE_KEY_OPTIONS = ["hero", "consultoria", "gestao", "noc", "cloud", "seguranca", "suporte", "equipe", "servidores", "projetos", "locacao", "nuvemPrivada"];

  return (
    <div className="space-y-3">
      {items?.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <GripVertical size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
            <div className="flex-1" />
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">T\u00edtulo</label>
              <input type="text" value={item.title} onChange={e => updateItem(i, { title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Slug (URL)</label>
              <input type="text" value={item.slug} onChange={e => updateItem(i, { slug: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Descri\u00e7\u00e3o</label>
              <input type="text" value={item.description} onChange={e => updateItem(i, { description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">\u00cdcone</label>
              <select value={item.icon} onChange={e => updateItem(i, { icon: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Imagem (chave ou URL)</label>
              <select value={IMAGE_KEY_OPTIONS.includes(item.image) ? item.image : ""} onChange={e => updateItem(i, { image: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {IMAGE_KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
        <Plus size={14} /> Adicionar {type === "service" ? "servi\u00e7o" : "solu\u00e7\u00e3o"}
      </button>
    </div>
  );
}

// ==================== FEATURES EDITOR ====================

function FeaturesEditor({ items, onChange }: { items: FeatureItem[]; onChange: (v: FeatureItem[]) => void }) {
  const addItem = () => {
    onChange([...items, { icon: "Award", title: "", description: "" }]);
  };

  const updateItem = (index: number, partial: Partial<FeatureItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...partial };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items?.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <GripVertical size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
            <div className="flex-1" />
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">\u00cdcone</label>
              <select value={item.icon} onChange={e => updateItem(i, { icon: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">T\u00edtulo</label>
              <input type="text" value={item.title} onChange={e => updateItem(i, { title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descri\u00e7\u00e3o</label>
              <input type="text" value={item.description} onChange={e => updateItem(i, { description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
        <Plus size={14} /> Adicionar diferencial
      </button>
    </div>
  );
}

// ==================== TESTIMONIALS EDITOR ====================

function TestimonialsEditor({ items, onChange }: { items: TestimonialItem[]; onChange: (v: TestimonialItem[]) => void }) {
  const addItem = () => {
    onChange([...items, { name: "", role: "", company: "", content: "", rating: 5 }]);
  };

  const updateItem = (index: number, partial: Partial<TestimonialItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...partial };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items?.map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <GripVertical size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
            <div className="flex-1" />
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome</label>
              <input type="text" value={item.name} onChange={e => updateItem(i, { name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cargo</label>
              <input type="text" value={item.role} onChange={e => updateItem(i, { role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Empresa</label>
              <input type="text" value={item.company} onChange={e => updateItem(i, { company: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">Depoimento</label>
            <textarea value={item.content} rows={2} onChange={e => updateItem(i, { content: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="mt-2">
            <label className="block text-xs text-gray-500 mb-1">Avalia\u00e7\u00e3o</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => updateItem(i, { rating: star })}
                  className={`${star <= item.rating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition`}
                >
                  <Star size={20} fill={star <= item.rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
        <Plus size={14} /> Adicionar depoimento
      </button>
    </div>
  );
}
