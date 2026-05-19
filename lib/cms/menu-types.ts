export interface MenuNavItem {
  id?: string;
  label: string;
  url: string;
  icon: string;
  target: string;
  order: number;
  active: boolean;
  highlight: boolean;
  parentId: string | null;
  _tempId: string;
  /** Origem do link no builder */
  source?: "system" | "page" | "custom";
  sourceId?: string;
}

export const MENU_LOCATIONS = [
  { name: "header", label: "Menu principal (header)" },
  { name: "footer-solucoes", label: "Rodapé — Soluções" },
  { name: "footer-portfolio", label: "Rodapé — Portfólio" },
  { name: "footer-institucional", label: "Rodapé — Institucional" },
  { name: "footer-legal", label: "Rodapé — Legal" },
] as const;

export type MenuLocationName = (typeof MENU_LOCATIONS)[number]["name"];

let tempCounter = 0;
export function newMenuItemId(): string {
  return `_temp_${++tempCounter}_${Date.now()}`;
}

export function flattenMenuTree(
  roots: { item: MenuNavItem; children: MenuNavItem[] }[],
): MenuNavItem[] {
  const flat: MenuNavItem[] = [];
  roots.forEach(({ item, children }, rootIdx) => {
    flat.push({ ...item, order: rootIdx, parentId: null });
    children.forEach((child, childIdx) => {
      flat.push({
        ...child,
        order: childIdx,
        parentId: item.id || item._tempId,
      });
    });
  });
  return flat;
}

export function buildMenuTree(items: MenuNavItem[]): { item: MenuNavItem; children: MenuNavItem[] }[] {
  const roots = items
    .filter((i) => !i.parentId)
    .sort((a, b) => a.order - b.order);

  return roots.map((item) => ({
    item,
    children: items
      .filter((i) => i.parentId === (item.id || item._tempId))
      .sort((a, b) => a.order - b.order),
  }));
}

export function itemKey(item: MenuNavItem): string {
  return item._tempId || item.id || "";
}
