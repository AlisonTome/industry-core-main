import { Link } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useLocal, K, Proposal, Rfq, visibleRfqsForUser } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

export default function Propostas() {
  const { user } = useAuth();
  const isSupplier = user?.role === "supplier";
  const [proposals] = useLocal<Proposal[]>(K.proposals, []);
  const [rfqs] = useLocal<Rfq[]>(K.rfqs, []);
  const visibleRfqs = visibleRfqsForUser(rfqs, user);
  const visibleRfqIds = new Set(visibleRfqs.map((r) => r.id));
  const visible = proposals.filter((p) => visibleRfqIds.has(p.rfqId) && (!isSupplier || p.supplier === user?.company));
  return (
    <>
      <PageHeader
        title={isSupplier ? "Minhas propostas" : "Propostas"}
        description={isSupplier ? "Propostas enviadas pela sua empresa e seus respectivos status." : "Todas as propostas recebidas em suas RFQs."}
      />
      <section className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">RFQ</th>
              <th className="px-5 py-3">Fornecedor</th>
              <th className="px-5 py-3">Preço</th>
              <th className="px-5 py-3">Lead time</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">Sem propostas.</td></tr>}
            {visible.map((p) => {
              const rfq = visibleRfqs.find((r) => r.id === p.rfqId);
              return (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs"><Link to={`/dashboard/cotacoes/${p.rfqId}`} className="text-muted-foreground hover:text-accent">{p.rfqId}</Link><div className="text-foreground text-sm font-medium">{rfq?.part ?? ""}</div></td>
                  <td className="px-5 py-3 font-medium">{p.supplier}</td>
                  <td className="px-5 py-3 tabular-nums">R$ {p.price.toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-3 tabular-nums">{p.leadTimeDays} dias</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
