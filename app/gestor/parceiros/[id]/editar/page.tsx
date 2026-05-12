"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Loader2, Home, Eye, EyeOff, Globe, Users } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  website: string | null;
  order: number;
  active: boolean;
  showOnHome: boolean;
}

export default function EditPartnerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Partner>({
    id: "",
    name: "",
    logoUrl: null,
    description: null,
    website: null,
    order: 0,
    active: true,
    showOnHome: true
  });

  useEffect(() => {
    fetchPartner();
  }, [params.id]);

  const fetchPartner = async () => {
    try {
      const res = await fetch(`/api/gestor/partners/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      } else {
        setError("Parceiro não encontrado");
      }
    } catch (err) {
      setError("Erro ao carregar parceiro");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/gestor/partners/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push("/gestor/parceiros");
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao salvar");
      }
    } catch (err) {
      setError("Erro ao salvar parceiro");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !formData.id) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{error}</p>
        <Link href="/gestor/parceiros" className="text-blue-600 hover:underline mt-4 inline-block">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/gestor/parceiros"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Parceiro</h1>
          <p className="text-gray-500">Atualize as informações do parceiro</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Preview do Logo */}
        {formData.logoUrl && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview do Logo</p>
            <div className="relative h-20 w-40 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
              <Image
                src={formData.logoUrl}
                alt={formData.name}
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
        )}

        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL do Logo</label>
            <input
              type="url"
              value={formData.logoUrl || ""}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value || null })}
              placeholder="https://i.pinimg.com/736x/db/87/75/db87753a7685b0758792da046372c959.jpg"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
            <textarea
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              placeholder="Breve descrição do parceiro..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={formData.website || ""}
                onChange={(e) => setFormData({ ...formData, website: e.target.value || null })}
                placeholder="https://parceiro.com.br"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordem</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={formData.active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === "true" })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          {/* Toggle Exibir na Home */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.showOnHome ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                  <Home size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Exibir na Home</p>
                  <p className="text-sm text-gray-500">Mostrar este parceiro na página inicial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, showOnHome: !formData.showOnHome })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  formData.showOnHome ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    formData.showOnHome ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-5 border-t">
          <Link
            href="/gestor/parceiros"
            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={18} /> Salvar Alterações</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
