import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, ExternalLink, Users, Home, Globe } from "lucide-react";
import { DeletePartnerButton } from "@/components/gestor/delete-partner-button";
import { TogglePartnerHome } from "@/components/gestor/toggle-partner-home";

export const dynamic = "force-dynamic";

export default async function ParceirosPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { order: "asc" }
  });

  const homeCount = partners.filter(p => p.showOnHome && p.active).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parceiros</h1>
          <p className="text-gray-500">
            {partners.length} parceiros cadastrados • {homeCount} exibidos na home
          </p>
        </div>
        <Link
          href="/gestor/parceiros/novo"
          className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Novo Parceiro
        </Link>
      </div>

      {/* Legenda e Aviso */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Exibido na Home
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            Apenas em "Nossos Parceiros"
          </span>
        </div>
        
        {homeCount > 12 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <span className="text-amber-600 text-lg">⚠️</span>
            <div className="text-sm">
              <span className="font-medium text-amber-800">Atenção:</span>
              <span className="text-amber-700"> Você tem {homeCount} parceiros marcados para exibição na home, mas apenas 12 serão exibidos. Desmarque alguns para controlar quais aparecem.</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {partners.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum parceiro</h3>
            <p className="text-gray-500 mb-4">Comece adicionando seus parceiros</p>
            <Link
              href="/gestor/parceiros/novo"
              className="inline-flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <Plus size={16} />
              Adicionar Parceiro
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {partners.map((partner) => (
              <div key={partner.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                  {partner.logoUrl ? (
                    <Image
                      src={partner.logoUrl}
                      alt={partner.name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  ) : (
                    <Users className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900">{partner.name}</h3>
                    {!partner.active && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inativo</span>
                    )}
                    {partner.showOnHome && partner.active && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        <Home size={10} />
                        Na Home
                      </span>
                    )}
                  </div>
                  {partner.description && (
                    <p className="text-sm text-gray-500 truncate">{partner.description}</p>
                  )}
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                    >
                      <Globe size={12} />
                      Visitar site
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <TogglePartnerHome 
                    partnerId={partner.id} 
                    initialShowOnHome={partner.showOnHome} 
                  />
                  <Link
                    href={`/gestor/parceiros/${partner.id}/editar`}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </Link>
                  <DeletePartnerButton partnerId={partner.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
