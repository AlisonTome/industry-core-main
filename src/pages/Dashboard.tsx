import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Bell, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocal, K, Notification } from "@/lib/store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [notifications] = useLocal<Notification[]>(K.notifications, []);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
            <SidebarTrigger />
            <div className="hidden md:flex items-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">NexForge</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">{user?.company ?? "Workspace"}</span>
            </div>
            <div className="relative ml-auto hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={user?.role === "supplier" ? "Buscar RFQs, propostas, pagamentos…" : "Buscar projetos, RFQs, fornecedores…"} className="pl-9 h-9 bg-background" />
            </div>
            <Button variant="ghost" size="icon" aria-label="Notificações" onClick={() => nav("/dashboard/notificacoes")} className="relative">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />}
            </Button>
            {user?.role !== "supplier" && (
              <Button variant="accent" size="sm" onClick={() => nav("/dashboard/cotacoes?new=1")}>Nova RFQ</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-bold" aria-label="Conta">
                  {(user?.name ?? "U").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold">{user?.name}</div>
                  <div className="text-xs text-muted-foreground font-normal">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav("/dashboard/configuracoes")}>Configurações</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); nav("/"); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
