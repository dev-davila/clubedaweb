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

export function Header({ initialSiteConfig }: { initialSiteConfig?: SiteContactConfig }) {
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
      <div className="hidden lg:block bg-primary text-primary-foreground text-sm py-2">
        <div className="container mx-auto px-4 flex justify-end items-center">
          {/* Contatos e Redes Sociais - tudo à direita */}
          <div className="flex items-center gap-4">
            <a 
              href={`tel:${siteConfig.phone?.replace(/\D/g, "")}`} 
              className="flex items-center gap-2 hover:opacity-80 transition"
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
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <Mail size={14} />
              {siteConfig.email}
            </a>
            
            <span className="text-gray-500">|</span>
            
            <a
              href={siteConfig.linkedin || "https://linkedin.com/company/m3solutions"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition"
              title="LinkedIn"
            >
              <Linkedin size={16} />
            </a>
            <a
              href={siteConfig.facebook || "https://facebook.com/m3solutions"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition"
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
        className={`fixed top-3 left-3 right-3 z-50 transition-all duration-500 ${
          isScrolled
            ? "top-2"
            : "top-3"
        }`}
      >
        <div className={`max-w-7xl mx-auto rounded-2xl transition-all duration-500 ${
          isScrolled
            ? "bg-background/85 backdrop-blur-2xl shadow-2xl shadow-foreground/10 border border-border/40"
            : "bg-background/70 backdrop-blur-xl border border-border/30"
        }`}>
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              {siteConfig.logoUrl ? (
                <img
                  src={siteConfig.logoUrl}
                  alt={siteConfig.companyName || "Logo"}
                  className="h-8 w-auto"
                />
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground text-sm group-hover:scale-110 transition-transform">
                    {(siteConfig.companyName || "M3").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-heading text-lg font-bold text-foreground tracking-tight hidden sm:inline">
                    {siteConfig.companyName || "M3Solutions"}
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 bg-muted/60 backdrop-blur rounded-full px-1 py-1 border border-border/40">
              {menuItems?.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => item.submenu && setOpenSubmenu(item.label)}
                  onMouseLeave={() => setOpenSubmenu(null)}
                >
                  <Link
                    href={item.href}
                    className={`px-3.5 py-1.5 rounded-full flex items-center gap-1 text-sm font-medium tracking-tight transition-all ${
                      pathname === item.href || pathname?.startsWith(item.href + "/")
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground/70 hover:text-foreground hover:bg-background/60"
                    }`}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown size={13} className="opacity-60" />}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {item.submenu && openSubmenu === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-background/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-border/50 p-2 z-50"
                      >
                        {item.submenu?.map((subitem) => (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            className={`block px-3 py-2 rounded-xl text-sm transition-all ${
                              pathname === subitem.href
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-foreground/75 hover:bg-muted hover:text-foreground"
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
              className="hidden lg:flex items-center gap-1.5 bg-foreground text-background px-5 py-2 rounded-full text-sm font-semibold tracking-tight hover:bg-foreground/90 hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              Falar com especialista
              <ChevronDown size={14} className="-rotate-90" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-foreground"
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-background/95 backdrop-blur-2xl border-t border-border/40 overflow-hidden rounded-b-2xl"
            >
              <nav className="px-5 py-4">
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
                            ? "text-primary"
                            : "text-foreground/80"
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
                          className="pl-4 border-l-2 border-primary/20 ml-2"
                        >
                          {item.submenu?.map((subitem) => (
                            <Link
                              key={subitem.href}
                              href={subitem.href}
                              className={`block py-2 text-sm ${
                                pathname === subitem.href
                                  ? "text-primary font-medium"
                                  : "text-foreground/70"
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
                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                  >
                    <Linkedin size={18} />
                  </a>
                  <a
                    href={siteConfig.facebook || "https://facebook.com/m3solutions"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
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
                  className="block mt-4 bg-primary text-primary-foreground text-center py-3 rounded-lg font-medium"
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
