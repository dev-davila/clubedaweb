"use client";

import { Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator?.share) {
      navigator.share({ title, url: window?.location?.href ?? "" }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      if (typeof navigator !== "undefined" && navigator?.clipboard) {
        navigator.clipboard.writeText(window?.location?.href ?? "").then(() => {
          alert("Link copiado!");
        }).catch(() => {});
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition"
      title="Compartilhar"
    >
      <Share2 size={18} />
    </button>
  );
}
