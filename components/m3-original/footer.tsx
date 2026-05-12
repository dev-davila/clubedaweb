"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Linkedin, Instagram, Facebook, ChevronDown, AlertTriangle } from "lucide-react";
import { useSiteConfig, type SiteContactConfig } from "@/lib/use-site-config";
import { useNavigation, menuToLinks } from "@/lib/use-navigation";
import { motion, AnimatePresence } from "framer-motion";

const defaultFooterLinks = {
  solucoes: [
    { label: "Consultoria", href: "/solucoes/consultoria" },
    { label: "Gestão de TI", href: "/solucoes/gestao" },
    { label: "NOC 24x7", href: "/solucoes/noc-24x7" },
    { label: "Multicloud", href: "/solucoes/multicloud" },
    { label: "Nuvem Privada", href: "/solucoes/nuvem-privada" },
    { label: "Segurança", href: "/solucoes/seguranca" },
    { label: "Backup", href: "/solucoes/backup" }
  ],
  portfolio: [
    { label: "Microsoft", href: "/catalogo/microsoft" },
    { label: "Adobe", href: "/catalogo/adobe" },
    { label: "Autodesk", href: "/catalogo/autodesk" },
    { label: "Segurança", href: "/catalogo/seguranca" },
    { label: "Backup", href: "/catalogo/backup" },
    { label: "Ver portfólio completo", href: "/catalogo" }
  ],
  institucional: [
    { label: "Quem Somos", href: "/quem-somos" },
    { label: "Missão, Visão e Valores", href: "/missao-visao-e-valores" },
    { label: "Trabalhe Conosco", href: "/trabalhe-conosco" },
    { label: "Parceiros", href: "/nossos-parceiros" },
    { label: "Notícias", href: "/noticias" },
    { label: "Contato", href: "/contato" }
  ],
  legal: [
    { label: "LGPD", href: "/lgpd" },
    { label: "Aviso de Privacidade", href: "/aviso-de-privacidade" },
    { label: "Aviso de Cookies", href: "/aviso-de-cookies" },
    { label: "Política Antissuborno", href: "/politica-antissuborno-e-anticorrupcao" },
    { label: "Canal de Denúncias", href: "/canal-de-denuncias" }
  ]
};

function FooterDropdown({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-800 md:border-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 md:py-0 md:cursor-default"
      >
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <ChevronDown
          size={20}
          className={`text-gray-400 md:hidden transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      
      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pb-4 md:hidden overflow-hidden"
          >
            {links?.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-blue-400 transition text-gray-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Desktop List - Always Visible */}
      <ul className="hidden md:block space-y-3 mt-4">
        {links?.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="hover:text-blue-400 transition"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Ícone do WhatsApp customizado
const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export function Footer({ initialSiteConfig }: { initialSiteConfig?: SiteContactConfig } = {}) {
  const siteConfig = useSiteConfig(initialSiteConfig);
  const navMenus = useNavigation();

  // Use dynamic menus from DB if available, otherwise fallback to hardcoded
  const solLinks = menuToLinks(navMenus["footer-solucoes"]);
  const portLinks = menuToLinks(navMenus["footer-portfolio"]);
  const instLinks = menuToLinks(navMenus["footer-institucional"]);
  const legalLinks = menuToLinks(navMenus["footer-legal"]);

  const footerLinks = {
    solucoes: solLinks.length > 0 ? solLinks : defaultFooterLinks.solucoes,
    portfolio: portLinks.length > 0 ? portLinks : defaultFooterLinks.portfolio,
    institucional: instLinks.length > 0 ? instLinks : defaultFooterLinks.institucional,
    legal: legalLinks.length > 0 ? legalLinks : defaultFooterLinks.legal,
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center mb-6">
              <span className="text-3xl font-bold text-blue-400">M3</span>
              <span className="text-3xl font-bold text-white">Solutions</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Soluções completas em TI para transformar sua empresa. 
              Consultoria, gestão, cloud e segurança.
            </p>
            <div className="flex gap-4">
              <a
                href={siteConfig.linkedin || "https://linkedin.com/company/m3solutions"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition"
              >
                <Linkedin size={18} />
              </a>
              <a
                href={siteConfig.instagram || "https://instagram.com/m3solutions"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition"
              >
                <Instagram size={18} />
              </a>
              <a
                href={siteConfig.facebook || "https://facebook.com/m3solutions"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-700 transition"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Soluções */}
          <FooterDropdown title="Soluções" links={footerLinks.solucoes} />

          {/* Portfólio */}
          <FooterDropdown title="Portfólio" links={footerLinks.portfolio} />

          {/* Institucional */}
          <FooterDropdown title="Institucional" links={footerLinks.institucional} />

          {/* Contato */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Contato</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={`tel:${siteConfig.phone?.replace(/\D/g, "")}`}
                  className="flex items-start gap-3 hover:text-blue-400 transition"
                >
                  <Phone size={18} className="mt-1 flex-shrink-0" />
                  <span>{siteConfig.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-green-400 transition"
                >
                  <WhatsAppIcon size={18} />
                  <span>{siteConfig.whatsapp} (WhatsApp)</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-start gap-3 hover:text-blue-400 transition"
                >
                  <Mail size={18} className="mt-1 flex-shrink-0" />
                  <span>{siteConfig.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.addressLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 hover:text-blue-400 transition"
                >
                  <MapPin size={18} className="mt-1 flex-shrink-0" />
                  <span>{siteConfig.address}</span>
                </a>
              </li>
            </ul>

            {/* Canal de Denúncias */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <Link
                href="/canal-de-denuncias"
                className="flex items-center gap-3 text-yellow-500 hover:text-yellow-400 transition font-medium"
              >
                <AlertTriangle size={18} />
                <span>Canal de Denúncias</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 M3Solutions. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {footerLinks.legal?.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-500 hover:text-blue-400 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
