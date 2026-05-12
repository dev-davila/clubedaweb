"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface TogglePartnerHomeProps {
  partnerId: string;
  initialShowOnHome: boolean;
}

export function TogglePartnerHome({ partnerId, initialShowOnHome }: TogglePartnerHomeProps) {
  const router = useRouter();
  const [showOnHome, setShowOnHome] = useState(initialShowOnHome);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gestor/partners/${partnerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHome: !showOnHome })
      });
      
      if (res.ok) {
        setShowOnHome(!showOnHome);
        router.refresh();
      }
    } catch (error) {
      console.error("Error toggling partner home status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-lg transition flex items-center gap-1 text-xs font-medium ${
        showOnHome 
          ? "bg-green-100 text-green-700 hover:bg-green-200" 
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      title={showOnHome ? "Remover da Home" : "Adicionar \u00e0 Home"}
    >
      <Home size={14} />
      {showOnHome ? "Na Home" : "Fora"}
    </button>
  );
}
