"use client";

import { Building2, Phone, MessageCircle, Mail, MapPin, Linkedin, Instagram, Facebook, Image as ImageIcon } from "lucide-react";
import type { WizardData } from "../types";

interface Props {
  data: WizardData["identity"];
  onChange: (key: keyof WizardData["identity"], value: string) => void;
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  cols = 1,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  cols?: 1 | 2;
}) {
  return (
    <div className={cols === 2 ? "md:col-span-2" : ""}>
      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 transition`}
        />
      </div>
    </div>
  );
}

export function Step2Identity({ data, onChange }: Props) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
          Identidade da empresa
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Como você quer que sua marca apareça no site. Preencha o que tiver — pode ajustar depois.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-7 space-y-7">
        {/* Marca */}
        <section>
          <h3 className="font-heading font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            Marca
          </h3>
          <p className="text-xs text-gray-500 mb-4">Nome, slogan e logo</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nome da empresa" value={data.companyName} onChange={(v) => onChange("companyName", v)} placeholder="Bitdefender" />
            <Field label="Slogan (tagline)" value={data.tagline} onChange={(v) => onChange("tagline", v)} placeholder="Cybersegurança que se antecipa" cols={2} />
            <Field label="Logo (URL)" icon={<ImageIcon size={14} />} value={data.logoUrl} onChange={(v) => onChange("logoUrl", v)} placeholder="/images/logo.svg" cols={2} />
          </div>
          {data.logoUrl && (
            <div className="mt-3 inline-flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-200 px-4 py-2">
              <img src={data.logoUrl} alt="logo preview" className="h-8 w-auto" />
              <span className="text-xs text-gray-500">Preview do logo</span>
            </div>
          )}
        </section>

        <div className="border-t border-gray-100" />

        {/* Contato */}
        <section>
          <h3 className="font-heading font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Phone size={16} className="text-gray-400" />
            Contato
          </h3>
          <p className="text-xs text-gray-500 mb-4">Como clientes podem te alcançar</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Telefone" icon={<Phone size={14} />} value={data.phone} onChange={(v) => onChange("phone", v)} placeholder="0800 880 7777" />
            <Field label="WhatsApp" icon={<MessageCircle size={14} />} value={data.whatsapp} onChange={(v) => onChange("whatsapp", v)} placeholder="(11) 94720-0889" />
            <Field label="E-mail" icon={<Mail size={14} />} value={data.email} onChange={(v) => onChange("email", v)} placeholder="comercial@empresa.com" cols={2} />
            <Field label="Endereço" icon={<MapPin size={14} />} value={data.address} onChange={(v) => onChange("address", v)} placeholder="Rua, Cidade — SP" cols={2} />
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Redes sociais */}
        <section>
          <h3 className="font-heading font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Linkedin size={16} className="text-gray-400" />
            Redes sociais
          </h3>
          <p className="text-xs text-gray-500 mb-4">Links pros perfis oficiais</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="LinkedIn" icon={<Linkedin size={14} />} value={data.linkedin} onChange={(v) => onChange("linkedin", v)} placeholder="https://linkedin.com/company/..." cols={2} />
            <Field label="Instagram" icon={<Instagram size={14} />} value={data.instagram} onChange={(v) => onChange("instagram", v)} placeholder="https://instagram.com/..." />
            <Field label="Facebook" icon={<Facebook size={14} />} value={data.facebook} onChange={(v) => onChange("facebook", v)} placeholder="https://facebook.com/..." />
          </div>
        </section>
      </div>
    </div>
  );
}
