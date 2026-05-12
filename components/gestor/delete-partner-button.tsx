"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeletePartnerButton({ partnerId }: { partnerId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este parceiro?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/gestor/partners/${partnerId}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data?.success) {
        router.refresh();
      } else {
        alert(data?.message ?? "Erro ao excluir");
      }
    } catch (error) {
      alert("Erro ao excluir parceiro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
      title="Excluir"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  );
}
