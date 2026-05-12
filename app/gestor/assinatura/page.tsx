"use client";

import { useState, useEffect } from "react";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";
import {
  Mail,
  Save,
  Loader2,
  Copy,
  Check,
  User,
  Building2,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Instagram,
  Facebook,
  Palette,
  Eye,
  EyeOff,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";

const M3_LOGO_URL = "https://cdn.abacus.ai/images/b0af7a0d-1b30-484a-b1b1-c6069aa6ec80.png";

// Ícones de redes sociais (CDN confiáveis)
const socialIcons = {
  linkedin: 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
  whatsapp: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
  facebook: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
  instagram: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
  twitter: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png',
  phone: 'https://cdn-icons-png.flaticon.com/512/724/724664.png',
};

interface SignatureData {
  id?: string;
  fullName: string;
  jobTitle: string;
  company: string;
  department: string;
  phone: string;
  mobile: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  disclaimer: string;
  logoUrl: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  twitter: string;
  primaryColor: string;
  showLogo: boolean;
  showAddress: boolean;
  showSocial: boolean;
  showDisclaimer: boolean;
}

const defaultData: SignatureData = {
  fullName: "João da Silva",
  jobTitle: "Diretor de Tecnologia",
  company: "M3Solutions",
  department: "TI",
  phone: "+55 0800 880 7777",
  mobile: "+55 11 99220-6037",
  whatsapp: "+55 11 99220-6037",
  email: "joao.silva@m3solutions.com.br",
  website: "https://m3solutions.com.br",
  address: "São Paulo, SP | Brasil",
  disclaimer: "",
  logoUrl: M3_LOGO_URL,
  linkedin: "https://linkedin.com/company/m3solutions",
  instagram: "https://instagram.com/m3solutions",
  facebook: "https://facebook.com/m3solutions",
  twitter: "https://x.com/m3solutions_br",
  primaryColor: "#1E3A5F",
  showLogo: true,
  showAddress: true,
  showSocial: true,
  showDisclaimer: false
};

// Templates de cor
const templates = [
  { id: "professional", name: "Profissional", color: "#1E3A5F" },
  { id: "modern", name: "Moderno", color: "#2563EB" },
  { id: "elegant", name: "Elegante", color: "#059669" },
  { id: "corporate", name: "Corporativo", color: "#7C3AED" }
];

export default function AssinaturaPage() {
  const [data, setData] = useState<SignatureData>(defaultData);
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carregar assinatura salva
  useEffect(() => {
    const loadSignatures = async () => {
      try {
        const res = await fetch("/api/gestor/signatures");
        if (res.ok) {
          const sigs = await res.json();
          if (sigs && sigs.length > 0) {
            const firstSig = sigs[0];
            if (firstSig) {
              setData({
                id: firstSig.id,
                fullName: firstSig.fullName || defaultData.fullName,
                jobTitle: firstSig.jobTitle || defaultData.jobTitle,
                company: firstSig.company || defaultData.company,
                department: firstSig.department || defaultData.department,
                phone: firstSig.phone || defaultData.phone,
                mobile: firstSig.mobile || defaultData.mobile,
                whatsapp: firstSig.whatsapp || firstSig.mobile || defaultData.whatsapp,
                email: firstSig.email || defaultData.email,
                website: firstSig.website || defaultData.website,
                address: firstSig.address || defaultData.address,
                disclaimer: firstSig.disclaimer || defaultData.disclaimer,
                logoUrl: firstSig.logoUrl || defaultData.logoUrl,
                linkedin: firstSig.socialLinks?.linkedin || defaultData.linkedin,
                instagram: firstSig.socialLinks?.instagram || defaultData.instagram,
                facebook: firstSig.socialLinks?.facebook || defaultData.facebook,
                twitter: firstSig.socialLinks?.twitter || defaultData.twitter,
                primaryColor: firstSig.primaryColor || defaultData.primaryColor,
                showLogo: firstSig.showLogo ?? defaultData.showLogo,
                showAddress: firstSig.showAddress ?? defaultData.showAddress,
                showSocial: firstSig.showSocial ?? defaultData.showSocial,
                showDisclaimer: firstSig.showDisclaimer ?? defaultData.showDisclaimer
              });
              // Match template by color
              const matchedTemplate = templates.find(t => t.color === firstSig.primaryColor);
              if (matchedTemplate) {
                setSelectedTemplate(matchedTemplate.id);
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar assinaturas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSignatures();
  }, []);

  // Gerar HTML da assinatura (padrão Corporate M3)
  const generateHtml = () => {
    const color = templates.find(t => t.id === selectedTemplate)?.color || data.primaryColor;
    
    // Helper para gerar links sociais
    const renderSocialIcons = () => {
      const icons: string[] = [];
      if (data.linkedin) icons.push(`<a href="${data.linkedin}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIcons.linkedin}" alt="LinkedIn" width="26" height="26" style="border-radius:4px;"/></a>`);
      if (data.twitter) icons.push(`<a href="${data.twitter}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIcons.twitter}" alt="X" width="26" height="26" style="border-radius:4px;"/></a>`);
      if (data.facebook) icons.push(`<a href="${data.facebook}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIcons.facebook}" alt="Facebook" width="26" height="26" style="border-radius:4px;"/></a>`);
      if (data.instagram) icons.push(`<a href="${data.instagram}" target="_blank" style="display:inline-block;margin-right:8px;"><img src="${socialIcons.instagram}" alt="Instagram" width="26" height="26" style="border-radius:4px;"/></a>`);
      return icons.join('');
    };
    
    let html = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial, Helvetica, sans-serif;max-width:800px;">
  <tr>
    ${data.showLogo ? `<td style="vertical-align:middle;padding-right:20px;border-right:2px solid #E5E7EB;width:120px;">
      <img src="${data.logoUrl}" alt="${data.company || 'Logo'}" style="max-width:800px;max-height:80px;display:block;" />
    </td>` : ''}
    <td style="vertical-align:top;padding-left:12px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:20px;font-weight:bold;color:${color};padding-bottom:2px;text-decoration:underline;">
            ${data.fullName}
          </td>
        </tr>
        ${data.jobTitle ? `<tr><td style="font-size:18px;color:#374151;padding-bottom:12px;">${data.jobTitle}</td></tr>` : ''}
        ${data.phone ? `<tr><td style="font-size:17px;padding-bottom:4px;white-space:nowrap;">
          <img src="${socialIcons.phone}" alt="" width="14" height="14" style="vertical-align:middle;margin-right:6px;"/><a href="tel:${data.phone.replace(/\D/g, '')}" style="color:${color};text-decoration:none;vertical-align:middle;">${data.phone}</a>
        </td></tr>` : ''}
        ${data.mobile ? `<tr><td style="font-size:17px;padding-bottom:4px;white-space:nowrap;"><img src="${socialIcons.phone}" alt="" width="14" height="14" style="vertical-align:middle;margin-right:6px;"/><a href="tel:${data.mobile.replace(/\D/g, '')}" style="color:${color};text-decoration:none;vertical-align:middle;">${data.mobile}</a>${data.whatsapp ? `<a href="https://wa.me/${data.whatsapp.replace(/\D/g, '')}" target="_blank" style="vertical-align:middle;margin-left:6px;"><img src="${socialIcons.whatsapp}" alt="WhatsApp" width="16" height="16" style="vertical-align:middle;"/></a>` : ''}</td></tr>` : ''}
        ${data.email ? `<tr><td style="font-size:17px;padding-bottom:8px;"><a href="mailto:${data.email}" style="color:${color};text-decoration:underline;">${data.email}</a></td></tr>` : ''}
        ${data.company ? `<tr><td style="font-size:17px;font-weight:bold;color:#374151;padding-bottom:2px;">${data.company}${data.department ? ` - ${data.department}` : ''}</td></tr>` : ''}
        ${data.showAddress && data.address ? `<tr><td style="font-size:17px;color:#6B7280;padding-bottom:2px;">${data.address}</td></tr>` : ''}
        ${data.website ? `<tr><td style="font-size:17px;padding-bottom:10px;"><a href="${data.website}" style="color:${color};text-decoration:underline;">${data.website.replace(/^https?:\/\//, '')}</a></td></tr>` : ''}
        ${data.showSocial && (data.linkedin || data.twitter || data.facebook || data.instagram) ? `<tr><td style="padding-top:4px;padding-bottom:0;">${renderSocialIcons()}</td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>`;

    // Adicionar tabela de aviso legal se houver
    if (data.showDisclaimer && data.disclaimer) {
      html += `
<br>
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial, Helvetica, sans-serif;max-width:800px;">
  <tr>
    <td style="vertical-align:middle;padding-right:20px;border-right:0px solid #E5E7EB;width:600px;text-align:justify;line-height:1.5;font-size:12px;color:#333;">
      ${data.disclaimer}
    </td>
  </tr>
</table>`;
    }

    return html.trim();
  };

  // Copiar HTML
  const copyHtml = async () => {
    try {
      const html = generateHtml();
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setSuccess("HTML copiado para a área de transferência!");
      setTimeout(() => {
        setCopied(false);
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
      setError("Erro ao copiar. Por favor, tente novamente.");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Salvar assinatura
  const saveSignature = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const color = templates.find(t => t.id === selectedTemplate)?.color || data.primaryColor;
      
      const payload = {
        ...(data.id && { id: data.id }),
        name: `Assinatura - ${data.fullName}`,
        fullName: data.fullName,
        jobTitle: data.jobTitle,
        company: data.company,
        department: data.department,
        phone: data.phone,
        mobile: data.mobile,
        whatsapp: data.whatsapp,
        email: data.email,
        website: data.website,
        address: data.address,
        logoUrl: data.logoUrl,
        primaryColor: color,
        showLogo: data.showLogo,
        showAddress: data.showAddress,
        showSocial: data.showSocial,
        showDisclaimer: data.showDisclaimer,
        disclaimer: data.disclaimer,
        socialLinks: {
          linkedin: data.linkedin,
          instagram: data.instagram,
          facebook: data.facebook,
          twitter: data.twitter,
          whatsapp: data.whatsapp ? `https://wa.me/${data.whatsapp.replace(/\D/g, '')}` : ''
        }
      };

      const method = data.id ? "PUT" : "POST";
      const res = await fetch("/api/gestor/signatures", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const saved = await res.json();
        setData(prev => ({ ...prev, id: saved.id }));
        setSuccess("Assinatura salva com sucesso!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar");
      }
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      setError(error.message || "Erro ao salvar assinatura.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Baixar como HTML
  const downloadHtml = () => {
    const html = generateHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assinatura-${data.fullName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Atualizar campo
  const updateField = (field: keyof SignatureData, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Editor de Assinatura de E-mail</h1>
            <p className="text-sm text-gray-500">Crie assinaturas profissionais para sua equipe</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadHtml}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <Download className="w-4 h-4" />
              Baixar HTML
            </button>
            <button
              onClick={copyHtml}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar HTML"}
            </button>
            <button
              onClick={saveSignature}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Mensagens de erro/sucesso */}
      {(error || success) && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Formulário - 4 colunas */}
          <div className="xl:col-span-4 space-y-4">
            {/* Dados Pessoais */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Dados Pessoais
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={data.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    value={data.jobTitle}
                    onChange={(e) => updateField('jobTitle', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
                    <input
                      type="text"
                      value={data.company}
                      onChange={(e) => updateField('company', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <input
                      type="text"
                      value={data.department}
                      onChange={(e) => updateField('department', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                Contato
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Fixo</label>
                    <input
                      type="text"
                      value={data.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                    <input
                      type="text"
                      value={data.mobile}
                      onChange={(e) => updateField('mobile', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={data.whatsapp}
                    onChange={(e) => updateField('whatsapp', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ícone aparece ao lado do celular</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={data.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Aviso Legal */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  Aviso Legal / LGPD
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.showDisclaimer}
                    onChange={(e) => updateField('showDisclaimer', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Exibir</span>
                </label>
              </div>
              <textarea
                value={data.disclaimer}
                onChange={(e) => updateField('disclaimer', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AVISO LEGAL - Este e-mail contém informações confidenciais..."
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">Aparece em tabela separada abaixo da assinatura</p>
            </div>

            {/* Opções Avançadas */}
            <div className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <span className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  Opções Avançadas
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showAdvanced && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Logo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">URL do Logo</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.showLogo}
                          onChange={(e) => updateField('showLogo', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Exibir</span>
                      </label>
                    </div>
                    <input
                      type="url"
                      value={data.logoUrl}
                      onChange={(e) => updateField('logoUrl', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Redes Sociais */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Redes Sociais</label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.showSocial}
                          onChange={(e) => updateField('showSocial', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">Exibir</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Linkedin className="w-4 h-4 text-blue-700" />
                        <input
                          type="url"
                          value={data.linkedin}
                          onChange={(e) => updateField('linkedin', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="LinkedIn"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Facebook className="w-4 h-4 text-blue-600" />
                        <input
                          type="url"
                          value={data.facebook}
                          onChange={(e) => updateField('facebook', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Facebook"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <input
                          type="url"
                          value={data.instagram}
                          onChange={(e) => updateField('instagram', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Instagram"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Exibir Endereço */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Exibir Endereço</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.showAddress}
                        onChange={(e) => updateField('showAddress', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-600">Sim</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview - 8 colunas */}
          <div className="xl:col-span-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Pré-visualização
                </h2>
                
                {/* Seletor de Cor */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Cor:</span>
                  <div className="flex gap-1">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          updateField('primaryColor', t.color);
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          selectedTemplate === t.id
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: t.color }}
                        title={t.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Área de Preview */}
              <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 min-h-[500px]">
                <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
                  <div dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(generateHtml()) }} />
                </div>
              </div>

              {/* Instruções */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-900 mb-2">Como usar:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Preencha os campos com seus dados</li>
                  <li>Escolha a cor do tema</li>
                  <li>Clique em &quot;Copiar HTML&quot; ou &quot;Baixar HTML&quot;</li>
                  <li>No seu cliente de e-mail, cole como assinatura HTML</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
