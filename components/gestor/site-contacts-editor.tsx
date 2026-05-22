"use client";

import { useState } from "react";
import { Check, Loader2, Phone, Mail, MessageCircle, MapPin, Clock, Building2 } from "lucide-react";

interface Initial {
  contact_phone: string;
  contact_email: string;
  contact_whatsapp: string;
  contact_address: string;
  contact_hours: string;
  company_name: string;
}

interface Props {
  initial: Initial;
}

type FieldDef = {
  key: keyof Initial;
  label: string;
  placeholder: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  type?: string;
};

const FIELDS: FieldDef[] = [
  { key: "company_name", label: "Nome da empresa", placeholder: "Acme S/A", icon: Building2 },
  { key: "contact_phone", label: "Telefone principal", placeholder: "(11) 4040-5500", icon: Phone },
  { key: "contact_whatsapp", label: "WhatsApp", placeholder: "(11) 99500-8800", icon: MessageCircle },
  { key: "contact_email", label: "E-mail", placeholder: "contato@empresa.com", icon: Mail, type: "email" },
  { key: "contact_address", label: "Endereço", placeholder: "Av. Paulista, 1842 - SP", icon: MapPin },
  { key: "contact_hours", label: "Horário de atendimento", placeholder: "Seg-Sex 9h-19h", icon: Clock },
];

export function SiteContactsEditor({ initial }: Props) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/gestor/site-contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha ao salvar");
      setStatus({ ok: true, msg: "Contatos salvos · aparecem em todas as páginas publicadas imediatamente." });
    } catch (err) {
      setStatus({ ok: false, msg: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Contatos do site</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Estes valores substituem os contatos que o Stitch gerou. Aplicam-se a TODAS as páginas e ao footer.
          </p>
        </div>
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Salvar
        </button>
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Icon size={12} className="text-gray-500" />
                {f.label}
              </label>
              <input
                type={f.type ?? "text"}
                value={values[f.key]}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                disabled={busy}
              />
            </div>
          );
        })}
      </div>

      {status && (
        <div
          className={`mx-5 mb-4 px-3 py-2 rounded-lg text-xs font-medium ${
            status.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.msg}
        </div>
      )}
    </div>
  );
}
