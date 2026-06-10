import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { ArrowLeft, Bell, Home, LogOut, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocal, K, Notification, visibleNotificationsForUser } from "@/lib/store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [notifications] = useLocal<Notification[]>(K.notifications, []);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("nf.theme") === "dark");
  const visibleNotifications = visibleNotificationsForUser(notifications, user);
  const unread = visibleNotifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("nf.theme", isDark ? "dark" : "light");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDark]);

  const currentDashboardPath = `${location.pathname}${location.search}${location.hash}`;
  const isOverview = location.pathname === "/dashboard";

  useEffect(() => {
    if (!location.pathname.startsWith("/dashboard")) return;
    const raw = sessionStorage.getItem("nf.dashboardHistory");
    const stack = raw ? (JSON.parse(raw) as string[]) : [];
    if (stack[stack.length - 1] !== currentDashboardPath) {
      sessionStorage.setItem("nf.dashboardHistory", JSON.stringify([...stack, currentDashboardPath].slice(-30)));
    }
  }, [currentDashboardPath, location.pathname]);

  function goBackWithinDashboard() {
    const raw = sessionStorage.getItem("nf.dashboardHistory");
    const stack = raw ? (JSON.parse(raw) as string[]) : [];
    while (stack.length && stack[stack.length - 1] === currentDashboardPath) stack.pop();
    const previous = stack[stack.length - 1];
    if (!previous || !previous.startsWith("/dashboard")) {
      sessionStorage.setItem("nf.dashboardHistory", JSON.stringify([currentDashboardPath]));
      return;
    }
    sessionStorage.setItem("nf.dashboardHistory", JSON.stringify(stack));
    nav(previous);
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
            <SidebarTrigger />
            {!isOverview && (
              <>
                <Button variant="ghost" size="icon" aria-label="Voltar" onClick={goBackWithinDashboard} className="md:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Home" onClick={() => nav("/dashboard")} className="md:hidden">
                  <Home className="h-4 w-4" />
                </Button>
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={goBackWithinDashboard}>
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")}>
                    <Home className="mr-1.5 h-3.5 w-3.5" /> Home
                  </Button>
                </div>
              </>
            )}
            <div className="relative ml-auto hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={user?.role === "supplier" ? "Buscar RFQs, propostas, pagamentos…" : "Buscar projetos, RFQs, fornecedores…"} className="pl-9 h-9 bg-background" />
            </div>
            <Button variant="ghost" size="icon" aria-label="Notificações" onClick={() => nav("/dashboard/notificacoes")} className="relative ml-auto md:ml-0">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
              title={isDark ? "Tema claro" : "Tema escuro"}
              onClick={() => setIsDark((current) => !current)}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
                <DropdownMenuItem onClick={() => { document.documentElement.classList.remove("dark"); logout(); nav("/"); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
