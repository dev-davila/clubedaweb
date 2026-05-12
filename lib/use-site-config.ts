"use client";

import { useState, useEffect } from "react";
import { SITE_CONFIG } from "@/lib/constants";

export interface SiteContactConfig {
  phone: string;
  whatsapp: string;
  whatsappLink: string;
  email: string;
  address: string;
  addressLink: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  companyName: string;
  logoUrl: string;
  tagline: string;
}

const defaultConfig: SiteContactConfig = {
  phone: SITE_CONFIG.phone || "0800 880 7777",
  whatsapp: SITE_CONFIG.whatsapp || "(11) 94720-0889",
  whatsappLink: SITE_CONFIG.whatsappLink || "https://wa.me/5511947200889",
  email: SITE_CONFIG.email || "comercial@m3solutions.com.br",
  address: SITE_CONFIG.address || "Rua Gomes de Carvalho, 1629",
  addressLink: SITE_CONFIG.addressLink || "https://maps.google.com",
  linkedin: "",
  instagram: "",
  facebook: "",
  companyName: "M3Solutions",
  logoUrl: "",
  tagline: ""
};

export function useSiteConfig(initial?: SiteContactConfig): SiteContactConfig {
  const [config, setConfig] = useState<SiteContactConfig>(initial ?? defaultConfig);

  useEffect(() => {
    fetch("/api/site-config")
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setConfig({
            phone: data.contact_phone || defaultConfig.phone,
            whatsapp: data.contact_whatsapp || defaultConfig.whatsapp,
            whatsappLink: data.contact_whatsapp 
              ? `https://wa.me/55${data.contact_whatsapp.replace(/\D/g, '')}` 
              : defaultConfig.whatsappLink,
            email: data.contact_email || defaultConfig.email,
            address: data.contact_address || defaultConfig.address,
            addressLink: data.contact_address 
              ? `https://maps.google.com/?q=${encodeURIComponent(data.contact_address)}` 
              : defaultConfig.addressLink,
            linkedin: data.social_linkedin || data.contact_linkedin || "",
            instagram: data.social_instagram || data.contact_instagram || "",
            facebook: data.social_facebook || data.contact_facebook || "",
            companyName: data.company_name || data.contact_company_name || "M3Solutions",
            logoUrl: data.logo_url || data.brand_logo_url || "",
            tagline: data.tagline || data.company_tagline || ""
          });
        }
      })
      .catch(() => {
        // Usar configuração padrão em caso de erro
      });
  }, []);

  return config;
}
