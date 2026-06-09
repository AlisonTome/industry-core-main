import { useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLocal, K, Notification, visibleNotificationsForUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Notificacoes() {
  const { user } = useAuth();
  const [list, setList] = useLocal<Notification[]>(K.notifications, []);
  const visibleList = visibleNotificationsForUser(list, user);

  useEffect(() => {
    if (visibleList.some((n) => !n.readAt)) {
      const now = new Date().toISOString();
      const visibleIds = new Set(visibleList.map((n) => n.id));
      setList(list.map((n) => (!n.readAt && visibleIds.has(n.id) ? { ...n, readAt: now } : n)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearVisibleNotifications() {
    const visibleIds = new Set(visibleList.map((n) => n.id));
    setList(list.filter((n) => !visibleIds.has(n.id)));
  }

  return (
    <>
      <PageHeader title="Notificações" description="Eventos da plataforma." actions={<Button variant="outline" onClick={clearVisibleNotifications}>Limpar tudo</Button>} />
      <section className="rounded-xl border border-border bg-surface divide-y divide-border">
        {visibleList.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Sem notificações.</div>}
        {visibleList.map((n) => {
          const Icon = n.type === "success" ? CheckCircle2 : n.type === "warning" ? Clock : FileText;
          const color = n.type === "success" ? "text-success" : n.type === "warning" ? "text-warning" : "text-accent";
          return (
            <div key={n.id} className="flex items-start gap-3 px-5 py-4">
              <Icon className={`h-4 w-4 mt-0.5 ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
