import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, FileText, Users, Briefcase, FileSignature, Bell, Factory, Package, Settings, LifeBuoy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { K, Notification, Proposal, Rfq, useLocal, visibleNotificationsForUser, visibleRfqsForUser } from "@/lib/store";

type BadgeKey = "rfqs" | "proposals" | "notifications";
type SidebarItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badgeKey?: BadgeKey;
};

const buyerMain: SidebarItem[] = [
  { title: "Visão geral", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "Cotações (RFQ)", url: "/dashboard/cotacoes", icon: FileText, badgeKey: "rfqs" },
  { title: "Projetos", url: "/dashboard/projetos", icon: Briefcase },
  { title: "Propostas", url: "/dashboard/propostas", icon: Package, badgeKey: "proposals" },
  { title: "Financeiro", url: "/dashboard/contratos", icon: FileSignature },
];

const supplierMain: SidebarItem[] = [
  { title: "Visão geral", url: "/dashboard", icon: LayoutDashboard, end: true },
  { title: "RFQs abertas", url: "/dashboard/cotacoes", icon: FileText, badgeKey: "rfqs" },
  { title: "Minhas propostas", url: "/dashboard/propostas", icon: Package, badgeKey: "proposals" },
  { title: "Financeiro", url: "/dashboard/contratos", icon: FileSignature },
];

const buyerNetwork: SidebarItem[] = [
  { title: "Fornecedores", url: "/dashboard/fornecedores", icon: Factory },
];

const supplierNetwork: SidebarItem[] = [
  { title: "Compradores", url: "/dashboard/compradores", icon: Users },
];

const system: SidebarItem[] = [
  { title: "Notificações", url: "/dashboard/notificacoes", icon: Bell, badgeKey: "notifications" },
  { title: "Configurações", url: "/dashboard/configuracoes", icon: Settings },
  { title: "Suporte", url: "/dashboard/suporte", icon: LifeBuoy },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const [rfqs] = useLocal<Rfq[]>(K.rfqs, []);
  const [proposals] = useLocal<Proposal[]>(K.proposals, []);
  const [notifications] = useLocal<Notification[]>(K.notifications, []);
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string, end?: boolean) => end ? pathname === url : pathname.startsWith(url);

  const visibleRfqs = visibleRfqsForUser(rfqs, user);
  const visibleRfqIds = new Set(visibleRfqs.map((r) => r.id));
  const visibleProposals = proposals.filter((p) => visibleRfqIds.has(p.rfqId) && (user?.role !== "supplier" || p.supplier === user.company));
  const visibleNotifications = visibleNotificationsForUser(notifications, user);
  const unreadNotifications = visibleNotifications.filter((n) => !n.readAt).length;
  const badges: Record<BadgeKey, number> = {
    rfqs: visibleRfqs.length,
    proposals: visibleProposals.length,
    notifications: unreadNotifications,
  };

  const main = user?.role === "supplier" ? supplierMain : buyerMain;
  const network = user?.role === "supplier" ? supplierNetwork : buyerNetwork;

  const renderGroup = (label: string, items: SidebarItem[]) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((it) => {
            const badge = it.badgeKey ? badges[it.badgeKey] : 0;
            return (
              <SidebarMenuItem key={it.title}>
                <SidebarMenuButton asChild isActive={isActive(it.url, it.end)} tooltip={it.title}>
                  <NavLink to={it.url} end={it.end} className="flex items-center gap-3">
                    <it.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{it.title}</span>}
                    {!collapsed && badge > 0 && (
                      <span className="ml-auto rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{badge}</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
