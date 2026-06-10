import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useLocal, K, Contract } from "@/lib/store";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const PLATFORM_FEE = 0.05;
const ESCROW_RATE = 0.3;

function money(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Contratos() {
  const { user } = useAuth();
  const isSupplier = user?.role === "supplier";
  const [contracts, setContracts] = useLocal<Contract[]>(K.contracts, []);
  const visible = isSupplier ? contracts.filter((c) => c.supplier === user?.company) : contracts;
  const gross = visible.reduce((sum, c) => sum + c.value, 0);
  const escrow = visible.filter((c) => c.status === "Em execução").reduce((sum, c) => sum + c.value * ESCROW_RATE, 0);
  const receivable = visible.filter((c) => c.status === "Em execução").reduce((sum, c) => sum + c.value * (1 - ESCROW_RATE), 0);
  const platformFee = gross * PLATFORM_FEE;
  const netReceived = visible.filter((c) => c.status === "Concluído").reduce((sum, c) => sum + c.value * (1 - PLATFORM_FEE), 0);

  function conclude(id: string) {
    setContracts(contracts.map((c) => (c.id === id ? { ...c, status: "Concluído" } : c)));
    toast.success("Contrato concluído");
  }

  return (
    <>
      <PageHeader
        title={isSupplier ? "Financeiro" : "Financeiro"}
        description={isSupplier ? "Valores em escrow, taxas da plataforma e recebíveis por contrato." : "Resumo simples dos contratos e valores contratados."}
      />

      {isSupplier ? (
        <section className="mb-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-5">
          <FinanceCell label="Em escrow" value={money(escrow)} />
          <FinanceCell label="Taxa da plataforma" value={money(platformFee)} sub="5% sobre o bruto" />
          <FinanceCell label="Bruto faturado" value={money(gross)} />
          <FinanceCell label="A receber" value={money(receivable)} />
          <FinanceCell label="Líquido recebido" value={money(netReceived)} />
        </section>
      ) : (
        <section className="mb-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <FinanceCell label="Contratos ativos" value={String(visible.filter((c) => c.status === "Em execução").length)} />
          <FinanceCell label="Valor contratado" value={money(gross)} />
          <FinanceCell label="Concluídos" value={String(visible.filter((c) => c.status === "Concluído").length)} />
        </section>
      )}

      <section className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Contrato</th>
              <th className="px-5 py-3">RFQ</th>
              <th className="px-5 py-3">Fornecedor</th>
              <th className="px-5 py-3">{isSupplier ? "Bruto" : "Valor"}</th>
              {isSupplier && <th className="px-5 py-3">Taxa 5%</th>}
              {isSupplier && <th className="px-5 py-3">Líquido</th>}
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={isSupplier ? 8 : 6} className="px-5 py-10 text-center text-sm text-muted-foreground">Sem contratos ainda.</td></tr>}
            {visible.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="px-5 py-3 font-mono text-xs"><Link to={`/dashboard/cotacoes/${c.rfqId}`} className="hover:text-accent">{c.rfqId}</Link></td>
                <td className="px-5 py-3 font-medium">{c.supplier}</td>
                <td className="px-5 py-3 tabular-nums">{money(c.value)}</td>
                {isSupplier && <td className="px-5 py-3 tabular-nums text-muted-foreground">{money(c.value * PLATFORM_FEE)}</td>}
                {isSupplier && <td className="px-5 py-3 tabular-nums font-medium">{money(c.value * (1 - PLATFORM_FEE))}</td>}
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3 text-right">
                  {!isSupplier && c.status === "Em execução" ? <Button size="sm" variant="outline" onClick={() => conclude(c.id)}>Concluir</Button> : <span className="text-xs text-muted-foreground">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function FinanceCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
