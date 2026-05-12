"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Globe, Rss, Code } from "lucide-react";

export default function EditarSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    feedUrl: "",
    selector: "",
    checkInterval: 3,
    active: true
  });

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/cronicas/sites/${id}`);
        if (!res.ok) throw new Error("Site não encontrado");
        const site = await res.json();
        setForm({
          name: site.name,
          url: site.url,
          feedUrl: site.feedUrl || "",
          selector: site.selector || "",
          checkInterval: site.checkInterval,
          active: site.active
        });
      } catch (error) {
        alert("Erro ao carregar site");
        router.push("/gestor/cronicas/sites");
      } finally {
        setLoading(false);
      }
    };
    fetchSite();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.url) {
      alert("Nome e URL são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/cronicas/sites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      router.push("/gestor/cronicas/sites");
    } catch (error: any) {
      alert(error.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/gestor/cronicas/sites"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Site</h1>
          <p className="text-gray-500 text-sm mt-1">Atualize as configurações do site</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Globe size={14} className="inline mr-1" />
            Nome do Site *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: CNN Brasil"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Base *</label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.cnnbrasil.com.br"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Rss size={14} className="inline mr-1" />
            URL do Feed RSS (opcional)
          </label>
          <input
            type="url"
            value={form.feedUrl}
            onChange={(e) => setForm({ ...form, feedUrl: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://www.cnnbrasil.com.br/feed/"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Code size={14} className="inline mr-1" />
            Seletor CSS (opcional)
          </label>
          <input
            type="text"
            value={form.selector}
            onChange={(e) => setForm({ ...form, selector: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="article.news-item, .post-card"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo de Verificação (horas)</label>
          <select
            value={form.checkInterval}
            onChange={(e) => setForm({ ...form, checkInterval: parseInt(e.target.value) })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 hora</option>
            <option value={2}>2 horas</option>
            <option value={3}>3 horas (recomendado)</option>
            <option value={6}>6 horas</option>
            <option value={12}>12 horas</option>
            <option value={24}>24 horas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="active" className="text-sm text-gray-700">Site ativo para monitoramento</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            href="/gestor/cronicas/sites"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving && <Loader2 className="animate-spin" size={16} />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
