"use client";

import { useState, useEffect } from "react";

export interface NavItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  target: string;
  order: number;
  active: boolean;
  highlight: boolean;
  parentId: string | null;
  children?: NavItem[];
}

export interface NavMenu {
  id: string;
  name: string;
  label: string;
  items: NavItem[];
}

type NavigationMap = Record<string, NavMenu>;

let cachedMenus: NavigationMap | null = null;
let fetchPromise: Promise<NavigationMap> | null = null;

function buildTree(items: NavItem[]): NavItem[] {
  const map = new Map<string, NavItem>();
  const roots: NavItem[] = [];
  
  // Sort by order
  const sorted = [...items].sort((a, b) => a.order - b.order);
  
  sorted.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });
  
  sorted.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}

async function fetchMenus(): Promise<NavigationMap> {
  try {
    const res = await fetch("/api/navigation");
    if (!res.ok) return {};
    const data = await res.json();
    if (!data || typeof data !== "object") return {};
    // data is { menuName: { id, name, label, items: [{ ..., children: [...] }] } }
    // Items already come in tree form from the API (parentId=null items with children included)
    const result: NavigationMap = {};
    for (const [name, menu] of Object.entries(data)) {
      const m = menu as any;
      if (!m || !m.id) continue;
      result[name] = {
        id: m.id,
        name: m.name,
        label: m.label,
        items: (m.items || []).map((item: any) => ({
          ...item,
          children: (item.children || []).map((c: any) => ({ ...c, children: [] }))
        }))
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function useNavigation(): NavigationMap {
  const [menus, setMenus] = useState<NavigationMap>(cachedMenus || {});

  useEffect(() => {
    if (cachedMenus) {
      setMenus(cachedMenus);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = fetchMenus();
    }
    fetchPromise.then(data => {
      cachedMenus = data;
      setMenus(data);
    });
  }, []);

  return menus;
}

// Helper to convert DB menu items to the format header/footer expects
export function menuToItems(menu: NavMenu | undefined): { label: string; href: string; submenu?: { label: string; href: string }[] }[] {
  if (!menu) return [];
  return menu.items
    .filter(item => item.active)
    .map(item => ({
      label: item.label,
      href: item.url,
      ...(item.children && item.children.length > 0 ? {
        submenu: item.children
          .filter(c => c.active)
          .map(c => ({ label: c.label, href: c.url }))
      } : {})
    }));
}

// Helper to get simple link list from a menu (for footer sections)
export function menuToLinks(menu: NavMenu | undefined): { label: string; href: string }[] {
  if (!menu) return [];
  return menu.items
    .filter(item => item.active)
    .sort((a, b) => a.order - b.order)
    .map(item => ({ label: item.label, href: item.url }));
}

// Invalidate cache (call after admin edits menus)
export function invalidateNavigationCache() {
  cachedMenus = null;
  fetchPromise = null;
}
