import { Mail, User, Building2, Smartphone } from "lucide-react";

export default function TemplateAssinaturaPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="text-blue-600" size={24} />
          Templates de Assinatura
        </h1>
        <p className="text-gray-500 mt-1">
          Configure os templates de assinatura de e-mail
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={20} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Assinatura Pessoal</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Template de assinatura para colaboradores.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="text-sm">
              <p className="font-semibold text-gray-900">Nome Completo</p>
              <p className="text-gray-600">Cargo | Departamento</p>
              <p className="text-blue-600">email@m3solutions.com.br</p>
              <p className="text-gray-500 text-xs mt-2">M3Solutions | Soluções em TI</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 size={20} className="text-purple-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Assinatura Corporativa</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Template institucional com logo e dados da empresa.
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Smartphone size={20} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Assinatura Mobile</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Template otimizado para dispositivos móveis.
          </p>
          <div className="text-center py-8 text-gray-400">
            Em breve
          </div>
        </div>
      </div>
    </div>
  );
}
