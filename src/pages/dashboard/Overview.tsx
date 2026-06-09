import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, FileText, Package, FileSignature, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocal, K, Rfq, Proposal, Contract, Notification, visibleNotificationsForUser, visibleRfqsForUser } from "@/lib/store";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";

export default function Overview() {
  const { user } = useAuth();
  const [rfqs] = useLocal<Rfq[]>(K.rfqs, []);
  const [proposals] = useLocal<Proposal[]>(K.proposals, []);
  const [contracts] = useLocal<Contract[]>(K.contracts, []);
  const [notifications] = useLocal<Notification[]>(K.notifications, []);
  const isSupplier = user?.role === "supplier";
  const visibleRfqs = visibleRfqsForUser(rfqs, user);
  const visibleRfqIds = new Set(visibleRfqs.map((r) => r.id));
  const visibleNotifications = visibleNotificationsForUser(notifications, user);

  const activeRfqs = visibleRfqs.filter((r) => r.status !== "Cancelada").length;
  const scopedProposals = proposals.filter((p) => visibleRfqIds.has(p.rfqId));
  const supplierProposals = scopedProposals.filter((p) => p.supplier === user?.company);
  const visibleProposals = isSupplier ? supplierProposals : scopedProposals;
  const visibleContracts = contracts.filter((c) => visibleRfqIds.has(c.rfqId) && (!isSupplier || c.supplier === user?.company));
  const volume = visibleContracts.reduce((s, c) => s + c.value, 0);
  const escrow = visibleContracts.filter((c) => c.status === "Em execução").reduce((s, c) => s + c.value * 0.3, 0);
  const net = visibleContracts.filter((c) => c.status === "Concluído").reduce((s, c) => s + c.value * 0.95, 0);

  const kpis = isSupplier
    ? [
        { label: "RFQs disponíveis", value: String(activeRfqs), delta: "Aberto", up: true, sub: "para análise", icon: FileText },
        { label: "Propostas enviadas", value: String(visibleProposals.length), delta: "Atual", up: true, sub: "sua empresa", icon: Package },
        { label: "Em escrow", value: `R$ ${(escrow / 1000).toFixed(1)}k`, delta: "30%", up: true, sub: "contratos ativos", icon: FileSignature },
        { label: "Líquido recebido", value: `R$ ${(net / 1000).toFixed(1)}k`, delta: "Taxa 5%", up: true, sub: "após plataforma", icon: TrendingUp },
      ]
    : [
        { label: "RFQs ativas", value: String(activeRfqs), delta: "Atual", up: true, sub: "base local", icon: FileText },
        { label: "Propostas recebidas", value: String(visibleProposals.length), delta: `+${visibleProposals.length}`, up: true, sub: "totais", icon: Package },
        { label: "Contratos em execução", value: String(visibleContracts.filter((c) => c.status === "Em execução").length), delta: "OPs ativas", up: true, sub: "ordens de produção", icon: FileSignature },
        { label: "Valor contratado", value: `R$ ${(volume / 1000).toFixed(1)}k`, delta: "Resumo", up: true, sub: "contratos", icon: TrendingUp },
      ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, {user?.name.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">{isSupplier ? "Resumo comercial e financeiro da sua operação" : "Resumo de projetos, RFQs e propostas recebidas"}</p>
        </div>
        {!isSupplier && <Link to="/dashboard/cotacoes?new=1"><Button variant="accent" size="sm">Nova RFQ</Button></Link>}
      </div>

      <section className="mb-8">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
                <k.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{k.value}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {k.delta} <span className="text-muted-foreground font-normal">· {k.sub}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-border bg-surface">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">RFQs recentes</h2>
              <p className="text-xs text-muted-foreground">Cotações criadas recentemente</p>
            </div>
            <Link to="/dashboard/cotacoes"><Button variant="ghost" size="sm">Ver todas</Button></Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Peça</th>
                  <th className="px-5 py-3">Qtd</th>
                  <th className="px-5 py-3 hidden md:table-cell">Processo</th>
                  <th className="px-5 py-3">Cotações</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleRfqs.slice(0, 6).map((r) => {
                  const count = visibleProposals.filter((p) => p.rfqId === r.id).length;
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/40 cursor-pointer">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        <Link to={`/dashboard/cotacoes/${r.id}`} className="hover:text-foreground">{r.id}</Link>
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        <Link to={`/dashboard/cotacoes/${r.id}`}>{r.part}</Link>
                      </td>
                      <td className="px-5 py-3 tabular-nums">{r.qty}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{r.process}</td>
                      <td className="px-5 py-3 tabular-nums">{count}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-surface">
            <header className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Atividade</h2>
              <p className="text-xs text-muted-foreground">Eventos da plataforma</p>
            </header>
            <ul className="divide-y divide-border">
              {visibleNotifications.slice(0, 5).map((a) => {
                const Icon = a.type === "success" ? CheckCircle2 : a.type === "warning" ? Clock : FileText;
                const color = a.type === "success" ? "text-success" : a.type === "warning" ? "text-warning" : "text-accent";
                return (
                  <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                    <Icon className={`h-4 w-4 mt-0.5 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
