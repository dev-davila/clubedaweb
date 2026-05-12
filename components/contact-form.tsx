"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Máscara de telefone (fixo ou celular)
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Celular: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Validação de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    cnpj: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  // Anti-spam: honeypot field (bots preenchem, humanos não veem)
  const [honeypot, setHoneypot] = useState("");
  // Anti-spam: timestamp de quando o form foi carregado
  const formLoadedAt = useRef<number>(0);
  useEffect(() => { formLoadedAt.current = Date.now(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    
    // Validar email antes de enviar
    if (!isValidEmail(formData.email)) {
      setEmailError("Por favor, insira um e-mail válido");
      return;
    }
    
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          _hp: honeypot, // honeypot
          _ts: formLoadedAt.current, // timestamp
        })
      });

      const data = await response.json();

      if (data?.success) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", company: "", cnpj: "", subject: "", message: "" });
      } else {
        throw new Error(data?.message ?? "Erro ao enviar mensagem");
      }
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error?.message ?? "Ocorreu um erro ao enviar sua mensagem.");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    if (emailError && isValidEmail(email)) {
      setEmailError("");
    }
  };

  const handleEmailBlur = () => {
    if (formData.email && !isValidEmail(formData.email)) {
      setEmailError("Por favor, insira um e-mail válido");
    } else {
      setEmailError("");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Mensagem enviada!</h3>
        <p className="text-gray-600 mb-6">Obrigado pelo contato. Responderemos em breve.</p>
        <button
          onClick={() => setStatus("idle")}
          className="text-blue-600 font-medium hover:text-blue-700"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === "error" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Honeypot anti-spam — invisível para humanos */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            className={`w-full px-4 py-3 rounded-xl border transition focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              emailError ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="seu@email.com"
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={handlePhoneChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="(11) 99999-9999"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Nome da empresa"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ <span className="text-gray-400 font-normal">(opcional)</span></label>
        <input
          type="text"
          value={formData.cnpj}
          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="00.000.000/0000-00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assunto</label>
        <select
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="">Selecione um assunto</option>
          <option value="Comercial">Comercial</option>
          <option value="Financeiro">Financeiro</option>
          <option value="Suporte">Suporte</option>
          <option value="Marketing">Marketing</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem *</label>
        <textarea
          required
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          placeholder="Como podemos ajudar?"
        />
      </div>

      <p className="text-sm text-gray-500">
        Ao enviar, você concorda com nossa <a href="/aviso-de-privacidade" className="text-blue-600 hover:underline">Política de Privacidade</a>.
      </p>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar mensagem
          </>
        )}
      </button>
    </form>
  );
}
