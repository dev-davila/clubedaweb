"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface SubscriberData {
  email: string;
  name?: string;
  status: string;
}

export default function UnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscriber, setSubscriber] = useState<SubscriberData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (token) {
      fetchSubscriber();
    }
  }, [token]);

  const fetchSubscriber = async () => {
    try {
      const response = await fetch(`/api/public/unsubscribe?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Token inválido ou expirado");
        return;
      }

      setSubscriber(data);

      // Se já está descadastrado, mostrar mensagem
      if (data.status === "UNSUBSCRIBED") {
        setSuccess(true);
      }
    } catch (err) {
      setError("Erro ao verificar assinatura");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!token) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/public/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao processar descadastramento");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Erro ao processar solicitação");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-slate-600">Verificando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Link Inválido</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Voltar ao Site
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Descadastramento Confirmado</h1>
          <p className="text-slate-600 mb-2">
            O email <strong className="text-slate-800">{subscriber?.email}</strong> foi removido da nossa lista.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Você não receberá mais emails de marketing da M3Solutions.
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600">
              Mudou de ideia? Você pode se inscrever novamente a qualquer momento através do nosso site.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Voltar ao Site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Cancelar Assinatura</h1>
          <p className="text-slate-600">
            Você está prestes a cancelar a assinatura do email:
          </p>
          <p className="font-semibold text-slate-800 mt-2">{subscriber?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pode nos contar o motivo? (opcional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Selecione um motivo</option>
              <option value="too_many_emails">Recebo muitos emails</option>
              <option value="not_relevant">Conteúdo não relevante</option>
              <option value="never_signed_up">Não me inscrevi</option>
              <option value="using_competitor">Usando outro serviço</option>
              <option value="other">Outro motivo</option>
            </select>
          </div>

          <button
            onClick={handleUnsubscribe}
            disabled={processing}
            className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar Descadastramento"
            )}
          </button>

          <Link
            href="/"
            className="block w-full py-3 px-4 text-center border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar e Voltar
          </Link>
        </div>

        <p className="text-xs text-slate-500 text-center mt-6">
          Ao se descadastrar, você deixará de receber emails de marketing.
          Emails transacionais importantes ainda podem ser enviados.
        </p>
      </div>
    </div>
  );
}
