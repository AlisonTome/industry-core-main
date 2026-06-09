import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, FileText, Users, Briefcase, FileSignature, Bell, Factory, Package, Settings, LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const buyerMain = [
  { title: "Visão geral", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Cotações (RFQ)", url: "/dashboard/cotacoes", icon: FileText, badge: 12 },
  { title: "Projetos", url: "/dashboard/projetos", icon: Briefcase },
  { title: "Propostas", url: "/dashboard/propostas", icon: Package, badge: 4 },
  { title: "Financeiro", url: "/dashboard/contratos", icon: FileSignature },
];

const supplierMain = [
  { title: "Visão geral", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "RFQs abertas", url: "/dashboard/cotacoes", icon: FileText, badge: 12 },
  { title: "Minhas propostas", url: "/dashboard/propostas", icon: Package, badge: 4 },
  { title: "Financeiro", url: "/dashboard/contratos", icon: FileSignature },
];

const buyerNetwork = [
  { title: "Fornecedores", url: "/dashboard/fornecedores", icon: Factory },
];

const supplierNetwork = [
  { title: "Compradores", url: "/dashboard/compradores", icon: Users },
];

const system = [
  { title: "Notificações", url: "/dashboard/notificacoes", icon: Bell, badge: 3 },
  { title: "Configurações", url: "/dashboard/configuracoes", icon: Settings },
  { title: "Suporte", url: "/dashboard/suporte", icon: LifeBuoy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string, end?: boolean) => end ? pathname === url : pathname.startsWith(url);
  const main = user?.role === "supplier" ? supplierMain : buyerMain;
  const network = user?.role === "supplier" ? supplierNetwork : buyerNetwork;

  const renderGroup = (label: string, items: typeof buyerMain) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((it) => (
            <SidebarMenuItem key={it.title}>
              <SidebarMenuButton asChild isActive={isActive(it.url, (it as any).end)} tooltip={it.title}>
                <NavLink to={it.url} end={(it as any).end} className="flex items-center gap-3">
                  <it.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="flex-1 truncate">{it.title}</span>}
                  {!collapsed && (it as any).badge && (
                    <span className="ml-auto rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{(it as any).badge}</span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold shrink-0">N</div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight truncate">NexForge</p>
              <p className="text-[10px] text-muted-foreground truncate">Procurement industrial</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Operação", main)}
        {renderGroup("Rede", network)}
        {renderGroup("Sistema", system)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold">
            {(user?.name ?? "U").split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name ?? "Usuário"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.company ?? "Workspace"}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
