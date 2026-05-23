"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  LogOut,
  Menu,
  MenuSquare,
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  Tags,
  FolderOpen,
  UserCircle,
  BarChart3,
  History,
  Plus,
  Settings,
  PenTool,
  Mail,
  Layers,
  Share2,
  Shield,
  Newspaper,
  Server,
  Package,
  Globe,
  Inbox,
  Home,
  KeyRound,
  MessageCircle,
  Radio,
  QrCode,
  Tag,
  CalendarClock,
  Bot,
  Cog,
  BarChart2,
  Zap,
  Plug,
  Ticket,
  Briefcase,
  Receipt,
} from "lucide-react";
import { useState, useEffect } from "react";

interface MenuItem {
  label: string;
  href?: string;
  icon?: any;
  type?: string;
  roles?: string[]; // which roles can see this item; undefined = all
  subItems?: { label: string; href: string; icon?: any; external?: boolean }[];
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/gestor", icon: LayoutDashboard },
  // Site
  { type: "divider", label: "Site", roles: ["admin"] },
  { label: "Páginas", href: "/gestor/paginas", icon: FileText, roles: ["admin"] },
  { label: "Menus", href: "/gestor/menus", icon: MenuSquare, roles: ["admin"] },
  { label: "Configurar site (Wizard)", href: "/gestor/wizard", icon: Zap, roles: ["admin"] },
  // { label: "Temas", href: "/gestor/temas", icon: Layers, roles: ["admin"] },
  { label: "Aparência", href: "/gestor/aparencia", icon: PenTool, roles: ["admin"] },
  { label: "Editor visual", href: "/gestor/editor", icon: Cog, roles: ["admin"] },
  // Itens ocultos do wizard (mantidos no código, escondidos do menu) — descomente pra reativar
  // { label: "Edição da Home", href: "/gestor/home", icon: Home, roles: ["admin"] },
  // { label: "Soluções", href: "/gestor/solucoes", icon: Server, roles: ["admin"] },
  // { label: "Catálogo", href: "/gestor/catalogo", icon: Package, roles: ["admin"] },
  // { label: "Institucional", href: "/gestor/institucional", icon: FileText, roles: ["admin"] },
  // { label: "Contatos", href: "/gestor/contatos", icon: Inbox, roles: ["admin"] },
  // { label: "Parceiros", href: "/gestor/parceiros", icon: Users, roles: ["admin"] },
  // { label: "Configurações", href: "/gestor/configuracoes", icon: Settings, roles: ["admin"] },
  // Blog
  { type: "divider", label: "Blog", roles: ["admin", "operador", "cliente"] },
  { label: "Posts", href: "/gestor/posts", icon: FileText, roles: ["admin", "operador", "cliente"] },
  { label: "Calendário", href: "/gestor/calendario", icon: Calendar, roles: ["admin", "operador"] },
  { label: "Categorias", href: "/gestor/categorias", icon: FolderOpen, roles: ["admin"] },
  { label: "Tags", href: "/gestor/tags", icon: Tags, roles: ["admin"] },
  { label: "Autores", href: "/gestor/autores", icon: UserCircle, roles: ["admin"] },
  { 
    label: "Crônicas", 
    icon: Newspaper,
    roles: ["admin", "operador", "cliente"],
    subItems: [
      { label: "Dashboard", href: "/gestor/cronicas", icon: LayoutDashboard },
      { label: "Matérias", href: "/gestor/cronicas/materias", icon: FileText },
      { label: "Pendentes", href: "/gestor/cronicas/pendentes", icon: History },
      { label: "Histórico", href: "/gestor/cronicas/historico", icon: Calendar },
      { label: "Sites", href: "/gestor/cronicas/sites", icon: Layers },
      { label: "Destinatários", href: "/gestor/cronicas/destinatarios", icon: Mail },
      { label: "Redes Sociais", href: "/gestor/redes-sociais", icon: Share2 },
    ]
  },
  // SEO
  { type: "divider", label: "SEO", roles: ["admin"] },
  { label: "Dashboard", href: "/gestor/seo", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Google Search Console", href: "/gestor/seo/google", icon: Globe, roles: ["admin"] },
  { label: "Bing Webmaster", href: "/gestor/seo/bing", icon: Globe, roles: ["admin"] },
  { label: "Configurações", href: "/gestor/seo/configuracoes", icon: Settings, roles: ["admin"] },
  // Comunicação
  { type: "divider", label: "Comunicação" },
  {
    label: "Comunicação",
    icon: MessageCircle,
    subItems: [
      { label: "Servidores", href: "/gestor/comunicacao/servidores", icon: Radio },
      { label: "Instâncias", href: "/gestor/comunicacao/instancias", icon: QrCode },
      { label: "Mensagens", href: "/chat", icon: MessageSquare, external: true },
      { label: "Contatos", href: "/gestor/comunicacao/contatos", icon: Users },
      { label: "Agendamentos", href: "/gestor/comunicacao/agendamentos", icon: CalendarClock },
      { label: "Tags", href: "/gestor/comunicacao/tags", icon: Tag },
    ]
  },
  {
    label: "Agentes IA",
    icon: Bot,
    subItems: [
      { label: "Dashboard", href: "/gestor/comunicacao/agentes-ia", icon: BarChart2 },
      { label: "Playground", href: "/gestor/comunicacao/agentes-ia/teste", icon: Zap },
      { label: "Sessões", href: "/gestor/comunicacao/agentes-ia/sessoes", icon: MessageSquare },
      { label: "Configuração", href: "/gestor/comunicacao/agentes-ia/configuracao", icon: Cog },
    ]
  },
  {
    label: "Integrações",
    icon: Plug,
    subItems: [
      { label: "Unodesk", href: "/gestor/comunicacao/integracoes/unodesk", icon: Ticket },
      { label: "CRM", href: "/gestor/comunicacao/integracoes/crm", icon: Briefcase },
      { label: "OMIE", href: "/gestor/comunicacao/integracoes/omie", icon: Receipt },
    ]
  },
  // Relatórios
  { type: "divider", label: "Relatórios", roles: ["admin"] },
  { label: "Consumo de IA", href: "/gestor/uso-ia", icon: BarChart3, roles: ["admin"] },
  { label: "Relatório de Acesso", href: "/gestor/relatorios/acesso", icon: BarChart3, roles: ["admin"] },
  // Administração
  { type: "divider", label: "Administração", roles: ["admin"] },
  { label: "Usuários", href: "/gestor/usuarios", icon: Users, roles: ["admin"] },
  { label: "Segurança", href: "/gestor/seguranca", icon: Shield, roles: ["admin"] },
  // Conta
  { type: "divider", label: "Conta" },
  { label: "Meu Perfil", href: "/gestor/perfil", icon: KeyRound },
];

// Group items by section (divider) for collapsible sections
function getMenuSections(items: MenuItem[], userRole: string) {
  const sections: { divider: MenuItem | null; items: MenuItem[] }[] = [];
  let currentSection: { divider: MenuItem | null; items: MenuItem[] } = { divider: null, items: [] };

  for (const item of items) {
    // Filter by role
    if (item.roles && !item.roles.includes(userRole)) continue;

    if (item.type === "divider") {
      if (currentSection.divider || currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { divider: item, items: [] };
    } else {
      currentSection.items.push(item);
    }
  }
  if (currentSection.divider || currentSection.items.length > 0) {
    sections.push(currentSection);
  }
  return sections;
}

export function GestorLayoutClient({
  children,
  session,
  brand,
}: {
  children: React.ReactNode;
  session: any;
  brand?: { companyName: string; logoUrl: string };
}) {
  const companyName = brand?.companyName || "M3Solutions";
  const logoUrl = brand?.logoUrl || "";
  const initials = companyName.slice(0, 2).toUpperCase();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const isLoginPage = pathname === "/gestor/login";
  const isSelectionPage = pathname.startsWith("/gestor/cronicas/selecao/");

  const userRole = (session?.user as any)?.role || "admin";
  const sections = getMenuSections(menuItems, userRole);

  // Auto-expand submenu and section if current path matches
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems) {
        const isSubItemActive = item.subItems.some(sub => pathname?.startsWith(sub.href));
        if (isSubItemActive && !expandedMenus.includes(item.label)) {
          setExpandedMenus(prev => [...prev, item.label]);
        }
      }
    });
    // Auto-expand section if collapsed but active item inside
    sections.forEach(sec => {
      if (!sec.divider) return;
      const sectionLabel = sec.divider.label;
      const hasActive = sec.items.some(item => {
        if (item.href && (pathname === item.href || (item.href !== "/gestor" && pathname?.startsWith(item.href)))) return true;
        if (item.subItems) return item.subItems.some(sub => pathname?.startsWith(sub.href));
        return false;
      });
      if (hasActive && collapsedSections.includes(sectionLabel)) {
        setCollapsedSections(prev => prev.filter(s => s !== sectionLabel));
      }
    });
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  const toggleSection = (label: string) => {
    setCollapsedSections(prev =>
      prev.includes(label)
        ? prev.filter(s => s !== label)
        : [...prev, label]
    );
  };

  useEffect(() => {
    if (!session && !isLoginPage && !isSelectionPage) {
      router.replace("/gestor/login");
    }
  }, [session, isLoginPage, isSelectionPage, router]);

  // Páginas públicas (login e seleção de crônicas) - sem sidebar/header
  if (isLoginPage || isSelectionPage) {
    return <>{children}</>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/gestor" className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="h-8 w-auto" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">{initials}</span>
            </div>
          )}
          <span className="text-lg font-semibold text-gray-800">Gestor</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r transform transition-transform lg:transform-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 overflow-hidden`}
        >
          <div className="h-full flex flex-col overflow-hidden">
            <div className="hidden lg:flex items-center gap-3 p-5 border-b">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-10 w-auto" />
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-bold">{initials}</span>
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-gray-800 truncate">{companyName}</div>
                <div className="text-xs text-gray-500">Gestor de Conteúdo</div>
              </div>
            </div>

            {/* Quick action - hidden for clients */}
            {((session?.user as any)?.role !== "cliente") && (
              <div className="p-4">
                <Link
                  href="/gestor/posts/nova-pauta"
                  className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-xl font-medium hover:bg-primary/90 transition shadow-sm"
                >
                  <Plus size={18} />
                  Nova Pauta
                </Link>
              </div>
            )}

            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
              {sections.map((sec, secIdx) => {
                const isSectionCollapsed = sec.divider ? collapsedSections.includes(sec.divider.label) : false;

                return (
                  <div key={secIdx}>
                    {/* Section divider header — clickable to collapse/expand */}
                    {sec.divider && (
                      <button
                        onClick={() => toggleSection(sec.divider!.label)}
                        className="w-full flex items-center justify-between pt-4 pb-2 px-3 group"
                      >
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition">
                          {sec.divider.label}
                        </span>
                        <ChevronDown
                          size={12}
                          className={`text-gray-400 group-hover:text-gray-600 transition-transform ${isSectionCollapsed ? "-rotate-90" : ""}`}
                        />
                      </button>
                    )}

                    {/* Section items — hidden when collapsed */}
                    {!isSectionCollapsed && sec.items.map((item) => {
                      const Icon = item.icon;

                      // Handle items with submenus
                      if (item.subItems) {
                        const isExpanded = expandedMenus.includes(item.label);
                        const isAnySubActive = item.subItems.some(sub => pathname?.startsWith(sub.href));

                        return (
                          <div key={item.label}>
                            <button
                              onClick={() => toggleMenu(item.label)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                                isAnySubActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                {Icon && <Icon size={18} />}
                                {item.label}
                              </span>
                              <ChevronDown
                                size={16}
                                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                            {isExpanded && (
                              <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-3">
                                {item.subItems.map(sub => {
                                  const SubIcon = sub.icon;
                                  const isSubActive = pathname === sub.href || pathname?.startsWith(sub.href);
                                  if (sub.external) {
                                    return (
                                      <a
                                        key={sub.href}
                                        href={sub.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setSidebarOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                      >
                                        {SubIcon && <SubIcon size={16} />}
                                        {sub.label}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-50"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                      </a>
                                    );
                                  }
                                  return (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      onClick={() => setSidebarOpen(false)}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                                        isSubActive
                                          ? "bg-primary/10 text-primary font-medium"
                                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                      }`}
                                    >
                                      {SubIcon && <SubIcon size={16} />}
                                      {sub.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Regular menu items
                      const isActive = pathname === item.href || (item.href !== "/gestor" && pathname?.startsWith(item.href || ""));
                      return (
                        <Link
                          key={item.href}
                          href={item.href || ""}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {Icon && <Icon size={18} />}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="shrink-0 p-4 border-t bg-white">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {session?.user?.name?.charAt(0) ?? "A"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-900 text-sm truncate">
                      {session?.user?.name ?? "Admin"}
                    </span>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      (session?.user as any)?.role === "admin" ? "bg-red-100 text-red-700" :
                      (session?.user as any)?.role === "operador" ? "bg-blue-100 text-blue-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {(session?.user as any)?.role === "admin" ? "Admin" :
                       (session?.user as any)?.role === "operador" ? "Op" : "Cli"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {session?.user?.email ?? ""}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition"
                >
                  <ChevronRight size={14} />
                  Ver site
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/gestor/login" })}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen lg:min-h-0">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}