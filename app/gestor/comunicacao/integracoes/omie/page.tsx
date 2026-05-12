"use client";

import { Receipt, Construction } from "lucide-react";

export default function OmiePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
          <Receipt className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">OMIE</h1>
          <p className="text-xs text-gray-400">Integração com sistema ERP OMIE</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
        <Construction className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-2">Em Desenvolvimento</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          A integração com o OMIE ERP está sendo preparada. Em breve você poderá consultar
          clientes, pedidos, notas fiscais e dados financeiros diretamente por aqui.
        </p>
      </div>
    </div>
  );
}
