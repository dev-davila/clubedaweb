/**
 * Menu canônico do site Stitch. Persistido em SiteConfig.stitch_menu_items
 * (jsonb-ish). Gestor pode editar labels e ordem; polish reaplica esses
 * labels no <header> dos HTMLs publicados antes de servir.
 */

import { prisma } from "@/lib/db";
import {
  REQUIRED_PAGE_TYPES,
  SITE_PAGE_ROUTES,
  type RequiredPageType,
} from "@/lib/themes/required-pages";

export const STITCH_MENU_KEY = "stitch_menu_items";

export interface StitchMenuItem {
  /** Tipo da página obrigatória (chave estável). */
  type: RequiredPageType;
  /** Texto exibido no header. */
  label: string;
  /** Rota pública. */
  route: string;
  /** 0-based, controla ordem. */
  order: number;
  /** Mostra ou esconde no menu. */
  visible: boolean;
}

export const DEFAULT_LABELS: Record<RequiredPageType, string> = {
  home: "Início",
  about: "Quem somos",
  services: "Soluções",
  blog: "Notícias",
  contact: "Contato",
};

export function defaultMenuItems(): StitchMenuItem[] {
  const order: RequiredPageType[] = ["home", "services", "about", "blog", "contact"];
  return order.map((type, idx) => ({
    type,
    label: DEFAULT_LABELS[type],
    route: SITE_PAGE_ROUTES[type],
    order: idx,
    visible: true,
  }));
}

export async function getStitchMenuItems(): Promise<StitchMenuItem[]> {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { key: STITCH_MENU_KEY } });
    if (!row?.value) return defaultMenuItems();
    const parsed = JSON.parse(row.value) as StitchMenuItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultMenuItems();
    // Garante que todas as 5 obrigatórias estão presentes
    const present = new Set(parsed.map((i) => i.type));
    const merged = [...parsed];
    for (const t of REQUIRED_PAGE_TYPES) {
      if (!present.has(t)) {
        merged.push({
          type: t,
          label: DEFAULT_LABELS[t],
          route: SITE_PAGE_ROUTES[t],
          order: merged.length,
          visible: true,
        });
      }
    }
    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return defaultMenuItems();
  }
}

export async function saveStitchMenuItems(items: StitchMenuItem[]): Promise<void> {
  // Normaliza: garante 5 obrigatórias, type único, order sequencial
  const seen = new Set<RequiredPageType>();
  const sane = items
    .filter((i) => REQUIRED_PAGE_TYPES.includes(i.type) && !seen.has(i.type) && seen.add(i.type))
    .map((i, idx) => ({
      type: i.type,
      label: (i.label ?? DEFAULT_LABELS[i.type]).trim() || DEFAULT_LABELS[i.type],
      route: SITE_PAGE_ROUTES[i.type],
      order: idx,
      visible: i.visible !== false,
    }));
  // Completa com obrigatórias faltantes
  for (const t of REQUIRED_PAGE_TYPES) {
    if (!seen.has(t)) {
      sane.push({
        type: t,
        label: DEFAULT_LABELS[t],
        route: SITE_PAGE_ROUTES[t],
        order: sane.length,
        visible: true,
      });
    }
  }

  await prisma.siteConfig.upsert({
    where: { key: STITCH_MENU_KEY },
    update: { value: JSON.stringify(sane), category: "wizard" },
    create: {
      key: STITCH_MENU_KEY,
      value: JSON.stringify(sane),
      category: "wizard",
      label: "Menu do site Stitch (editável)",
    },
  });
}
