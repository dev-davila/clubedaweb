"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Linkedin, Instagram, Facebook, AlertTriangle, ArrowUpRight, Send } from "lucide-react";
import { useSiteConfig, type SiteContactConfig } from "@/lib/use-site-config";
import { useNavigation, menuToLinks } from "@/lib/use-navigation";

const defaultFooterLinks = {
  solucoes: [
    { label: "Business Security", href: "/p/bitdefender-business-security" },
    { label: "Premium", href: "/p/bitdefender-business-security-premium" },
    { label: "Enterprise", href: "/p/bitdefender-business-security-enterprise" },
    { label: "Comparativo", href: "/p/bitdefender-business-security#comparison" }
  ],
  portfolio: [
    { label: "Antimalware", href: "/p/bitdefender-business-security" },
    { label: "EDR & XDR", href: "/p/bitdefender-business-security-premium" },
    { label: "Anti-Ransomware", href: "/p/bitdefender-business-security" },
    { label: "Sandbox", href: "/p/bitdefender-business-security-premium" }
  ],
  institucional: [
    { label: "Quem Somos", href: "/quem-somos" },
    { label: "Trabalhe Conosco", href: "/trabalhe-conosco" },
    { label: "Notícias", href: "/noticias" },
    { label: "Contato", href: "/contato" }
  ],
  legal: [
    { label: "LGPD", href: "/lgpd" },
    { label: "Privacidade", href: "/aviso-de-privacidade" },
    { label: "Cookies", href: "/aviso-de-cookies" },
    { label: "Anticorrupção", href: "/politica-antissuborno-e-anticorrupcao" }
  ]
};

const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

function FooterLinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-5">
        {title}
      </h3>
      <ul className="space-y-3">
        {links?.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-sm text-white/75 hover:text-white transition"
            >
              {link.label}
              <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ initialSiteConfig }: { initialSiteConfig?: SiteContactConfig }) {
  const siteConfig = useSiteConfig(initialSiteConfig);
  const navMenus = useNavigation();

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
    <footer className="relative bg-foreground text-white overflow-hidden">
      {/* Top mesh */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary rounded-full blur-[180px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-brand-accent rounded-full blur-[160px] opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-10">
        {/* Newsletter strip */}
        <div className="grid lg:grid-cols-12 gap-8 pb-14 mb-14 border-b border-white/10">
          <div className="lg:col-span-7">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] mb-3">
              Receba alertas de
              <span className="block bg-gradient-to-r from-primary via-brand-accent to-white bg-clip-text text-transparent">
                ameaças e novidades
              </span>
            </h2>
            <p className="text-white/65 text-sm md:text-base max-w-md leading-relaxed">
              Insights de cibersegurança, análises de vulnerabilidades críticas e atualizações de produto direto pra sua caixa.
            </p>
          </div>
          <div className="lg:col-span-5 lg:pt-3">
            <form className="flex gap-2 max-w-md">
              <div className="flex-1 relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/15 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-foreground px-5 py-3.5 rounded-2xl font-semibold text-sm hover:bg-white/95 hover:scale-[1.03] transition-all shadow-lg flex items-center gap-1.5"
              >
                Inscrever
                <Send size={14} />
              </button>
            </form>
            <p className="text-xs text-white/40 mt-2.5">Sem spam. Cancele a qualquer momento.</p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              {siteConfig.logoUrl ? (
                <img src={siteConfig.logoUrl} alt={siteConfig.companyName} className="h-9 w-auto" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground group-hover:rotate-6 transition-transform">
                    {(siteConfig.companyName || "M3").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-heading text-2xl font-bold tracking-tight">
                    {siteConfig.companyName || "M3Solutions"}
                  </span>
                </>
              )}
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-7 max-w-xs">
              {siteConfig.tagline || "Cybersegurança que se antecipa às ameaças. Proteção de classe mundial para empresas que não podem parar."}
            </p>
            <div className="flex gap-2">
              {[
                { href: siteConfig.linkedin || "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
                { href: siteConfig.instagram || "https://instagram.com", icon: Instagram, label: "Instagram" },
                { href: siteConfig.facebook || "https://facebook.com", icon: Facebook, label: "Facebook" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-primary hover:border-primary hover:text-primary-foreground hover:scale-105 transition-all"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="col-span-1 lg:col-span-2">
            <FooterLinkColumn title="Edições" links={footerLinks.solucoes} />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <FooterLinkColumn title="Camadas" links={footerLinks.portfolio} />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <FooterLinkColumn title="Empresa" links={footerLinks.institucional} />
          </div>

          {/* Contact */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-5">
              Contato
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`tel:${siteConfig.phone?.replace(/\D/g, "")}`} className="flex items-start gap-2 text-white/75 hover:text-white transition">
                  <Phone size={14} className="mt-0.5 shrink-0" />
                  <span>{siteConfig.phone}</span>
                </a>
              </li>
              <li>
                <a href={siteConfig.whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-white/75 hover:text-green-400 transition">
                  <WhatsAppIcon size={14} />
                  <span>{siteConfig.whatsapp}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.email}`} className="flex items-start gap-2 text-white/75 hover:text-white transition break-all">
                  <Mail size={14} className="mt-0.5 shrink-0" />
                  <span>{siteConfig.email}</span>
                </a>
              </li>
              <li>
                <a href={siteConfig.addressLink} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-white/75 hover:text-white transition">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>{siteConfig.address}</span>
                </a>
              </li>
            </ul>

            {/* Canal de Denúncias */}
            <Link
              href="/canal-de-denuncias"
              className="mt-5 inline-flex items-center gap-2 text-xs text-yellow-500 hover:text-yellow-400 transition font-semibold uppercase tracking-wider"
            >
              <AlertTriangle size={12} />
              Canal de Denúncias
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-xs font-mono">
            © {new Date().getFullYear()} {siteConfig.companyName}. ALL RIGHTS RESERVED.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs">
            {footerLinks.legal?.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/40 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Big watermark */}
      <div className="relative h-32 md:h-48 overflow-hidden flex items-center justify-center pointer-events-none">
        <span className="font-heading text-[20vw] font-black tracking-tightest leading-none bg-gradient-to-b from-white/[0.04] to-transparent bg-clip-text text-transparent select-none whitespace-nowrap">
          {(siteConfig.companyName || "M3Solutions").toUpperCase()}
        </span>
      </div>
    </footer>
  );
}
