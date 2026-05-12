"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
  size?: "sm" | "md";
}

export function DeletePostButton({ postId, postTitle, size = "sm" }: DeletePostButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/gestor/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir post");
      }

      router.refresh();
      setShowConfirm(false);
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir o post. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const openConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const closeConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  const buttonSize = size === "sm" ? "p-1.5" : "p-2";
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <>
      <button
        onClick={openConfirm}
        className={`${buttonSize} text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100`}
        title="Excluir post"
      >
        <Trash2 size={iconSize} />
      </button>

      {/* Modal de Confirmação */}
      {showConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeConfirm}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Excluir Post
                </h3>
                <p className="text-gray-600 text-sm mb-1">
                  Tem certeza que deseja excluir este post?
                </p>
                <p className="text-gray-900 font-medium text-sm bg-gray-100 px-3 py-2 rounded-lg truncate">
                  {postTitle || "Sem título"}
                </p>
                <p className="text-red-600 text-xs mt-3">
                  ⚠️ Esta ação não pode ser desfeita.
                </p>
              </div>
              <button
                onClick={closeConfirm}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
