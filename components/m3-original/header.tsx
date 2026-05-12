"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone, Mail, Linkedin, Facebook, Instagram } from "lucide-react";
import { useSiteConfig, type SiteContactConfig } from "@/lib/use-site-config";
import { useNavigation, menuToItems } from "@/lib/use-navigation";

const defaultMenuItems = [
  { label: "Home", href: "/" },
  { 
    label: "Quem Somos", 
    href: "/quem-somos",
    submenu: [
      { label: "A Empresa", href: "/quem-somos" },
      { label: "Missão, Visão e Valores", href: "/missao-visao-e-valores" },
      { label: "Trabalhe Conosco", href: "/trabalhe-conosco" },
    ]
  },
  {
    label: "Soluções",
    href: "/solucoes",
    submenu: [
      { label: "Consultoria", href: "/solucoes/consultoria" },
      { label: "Gestão de TI", href: "/solucoes/gestao" },
      { label: "Locação de Equipamentos", href: "/solucoes/locacao" },
      { label: "NOC 24x7", href: "/solucoes/noc-24x7" },
      { label: "Suporte Técnico", href: "/solucoes/suporte-tecnico" },
      { label: "Multicloud (AWS, Azure, IBM)", href: "/solucoes/multicloud" },
      { label: "Nuvem Privada", href: "/solucoes/nuvem-privada" },
      { label: "Segurança", href: "/solucoes/seguranca" },
      { label: "Backup e DR", href: "/solucoes/backup" },
      { label: "Microsoft 365", href: "/solucoes/microsoft-office-365" },
      { label: "Ver todas soluções", href: "/solucoes" }
    ]
  },
  {
    label: "Portfólio",
    href: "/catalogo",
    submenu: [
      { label: "Microsoft", href: "/catalogo/microsoft" },
      { label: "Adobe", href: "/catalogo/adobe" },
      { label: "Autodesk", href: "/catalogo/autodesk" },
      { label: "Segurança", href: "/catalogo/seguranca" },
      { label: "Backup", href: "/catalogo/backup" },
      { label: "Virtualização", href: "/catalogo/virtualizacao" },
      { label: "ERP e CRM", href: "/catalogo/erp-crm" },
      { label: "Ver todo portfólio", href: "/catalogo" }
    ]
  },
  { label: "Notícias", href: "/noticias" },
  { label: "Parceiros", href: "/nossos-parceiros" },
  { label: "Contato", href: "/contato" }
];

// Ícone do WhatsApp customizado
const WhatsAppIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export function Header({ initialSiteConfig }: { initialSiteConfig?: SiteContactConfig } = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();
  const siteConfig = useSiteConfig(initialSiteConfig);
  const navMenus = useNavigation();

  // Use dynamic menu from DB if available, otherwise fallback to hardcoded
  const dynamicItems = menuToItems(navMenus["header"]);
  const menuItems = dynamicItems.length > 0 ? dynamicItems : defaultMenuItems;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenSubmenu(null);
  }, [pathname]);

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:block bg-blue-900 text-white text-sm py-2">
        <div className="container mx-auto px-4 flex justify-end items-center">
          {/* Contatos e Redes Sociais - tudo à direita */}
          <div className="flex items-center gap-4">
            <a 
              href={`tel:${siteConfig.phone?.replace(/\D/g, "")}`} 
              className="flex items-center gap-2 hover:text-blue-200 transition"
            >
              <Phone size={14} />
              {siteConfig.phone}
            </a>
            <a 
              href={siteConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-green-300 transition"
              title="WhatsApp"
            >
              <WhatsAppIcon size={16} />
            </a>
            <a 
              href={`mailto:${siteConfig.email}`} 
              className="flex items-center gap-2 hover:text-blue-200 transition"
            >
              <Mail size={14} />
              {siteConfig.email}
            </a>
            
            <span className="text-gray-500">|</span>
            
            <a
              href={siteConfig.linkedin || "https://linkedin.com/company/m3solutions"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition"
              title="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href={siteConfig.facebook || "https://facebook.com/m3solutions"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition"
              title="Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href={siteConfig.instagram || "https://instagram.com/m3solutions"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-300 transition"
              title="Instagram"
            >
              <Instagram size={16} />
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg"
            : "bg-white shadow-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">M3</span>
              <span className="text-2xl font-bold text-gray-800">Solutions</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems?.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => item.submenu && setOpenSubmenu(item.label)}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <Link
                    href={item.href}
                    className={`px-4 py-2 rounded-lg flex items-center gap-1 transition-all ${
                      pathname === item.href || pathname?.startsWith(item.href + "/")
                        ? "text-blue-600 bg-blue-50 font-medium"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown size={16} />}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {item.submenu && openSubmenu === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                      >
                        {item.submenu?.map((subitem) => (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            className={`block px-4 py-2 text-sm transition-all ${
                              pathname === subitem.href
                                ? "text-blue-600 bg-blue-50 font-medium"
                                : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                            }`}
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* CTA Button */}
            <Link
              href="/contato"
              className="hidden lg:flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              Fale Conosco
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t overflow-hidden"
            >
              <nav className="container mx-auto px-4 py-4">
                {/* Mobile contact info */}
                <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b text-sm">
                  <a 
                    href={`tel:${siteConfig.phone?.replace(/\D/g, "")}`}
                    className="flex items-center gap-2 text-gray-600"
                  >
                    <Phone size={14} />
                    {siteConfig.phone}
                  </a>
                  <a 
                    href={siteConfig.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600"
                  >
                    <WhatsAppIcon size={14} />
                    WhatsApp
                  </a>
                </div>

                {menuItems?.map((item) => (
                  <div key={item.href}>
                    <div className="flex items-center justify-between">
                      <Link
                        href={item.href}
                        className={`flex-1 py-3 font-medium ${
                          pathname === item.href
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </Link>
                      {item.submenu && (
                        <button
                          onClick={() =>
                            setOpenSubmenu(
                              openSubmenu === item.label ? null : item.label
                            )
                          }
                          className="p-2"
                        >
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${
                              openSubmenu === item.label ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {item.submenu && openSubmenu === item.label && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-4 border-l-2 border-blue-100 ml-2"
                        >
                          {item.submenu?.map((subitem) => (
                            <Link
                              key={subitem.href}
                              href={subitem.href}
                              className={`block py-2 text-sm ${
                                pathname === subitem.href
                                  ? "text-blue-600 font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {subitem.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Mobile social icons */}
                <div className="flex gap-4 mt-4 pt-4 border-t">
                  <a
                    href={siteConfig.linkedin || "https://linkedin.com/company/m3solutions"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"
                  >
                    <Linkedin size={18} />
                  </a>
                  <a
                    href={siteConfig.facebook || "https://facebook.com/m3solutions"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"
                  >
                    <Facebook size={18} />
                  </a>
                  <a
                    href={siteConfig.instagram || "https://instagram.com/m3solutions"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600"
                  >
                    <Instagram size={18} />
                  </a>
                </div>

                <Link
                  href="/contato"
                  className="block mt-4 bg-blue-600 text-white text-center py-3 rounded-lg font-medium"
                >
                  Fale Conosco
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
