"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useSiteConfig } from "@/lib/use-site-config";

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const siteConfig = useSiteConfig();

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!showButton) return null;

  const handleClick = () => {
    const message = encodeURIComponent("Olá! Gostaria de saber mais sobre os serviços da M3Solutions.");
    window.open(`${siteConfig.whatsappLink}?text=${message}`, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-green-500 p-4">
              <h3 className="text-white font-semibold text-lg">M3Solutions</h3>
              <p className="text-green-100 text-sm">Estamos online para ajudar!</p>
            </div>
            <div className="p-4">
              <p className="text-gray-600 text-sm mb-4">
                Olá! Como podemos ajudar você hoje? Clique abaixo para iniciar uma conversa no WhatsApp.
              </p>
              <button
                onClick={handleClick}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Iniciar conversa
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isOpen ? "bg-gray-700" : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <MessageCircle size={28} className="text-white" />
        )}
      </motion.button>

      {!isOpen && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-xs font-bold">1</span>
        </motion.span>
      )}
    </div>
  );
}
