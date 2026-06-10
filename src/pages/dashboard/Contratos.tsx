import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { useLocal, K, Contract, PaymentStatus, pushNotification } from "@/lib/store";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, CheckCircle2, CreditCard, PackageCheck, RotateCcw } from "lucide-react";
import { useState } from "react";

const PLATFORM_FEE = 0.05;

function money(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isEscrowHeld(status?: PaymentStatus) {
  return status === "Pago em escrow" || status === "Entrega informada" || status === "Reembolso solicitado" || status === "Em disputa";
}

function paymentNote(c: Contract) {
  if (c.paymentStatus === "Reembolso solicitado") return c.refundReason ? `Reembolso: ${c.refundReason}` : "Reembolso solicitado pelo cliente";
  if (c.paymentStatus === "Em disputa") return c.disputeReason ? `Disputa: ${c.disputeReason}` : "Disputa aberta pelo cliente";
  if (c.paymentStatus === "Entrega informada") return "Entrega aguardando confirmacao do cliente";
  if (c.paymentStatus === "Liberado") return "Pagamento liberado ao fornecedor";
  if (c.paymentStatus === "Pago em escrow") return "Valor retido ate confirmacao";
  return "Aguardando acao";
}

export default function Contratos() {
  const { user } = useAuth();
  const isSupplier = user?.role === "supplier";
  const [contracts, setContracts] = useLocal<Contract[]>(K.contracts, []);
  const [refundTarget, setRefundTarget] = useState<Contract | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<Contract | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const visible = contracts.filter((c) => (isSupplier ? c.supplier === user?.company : c.buyerEmail === user?.email));
  const gross = visible.reduce((sum, c) => sum + c.value, 0);
  const escrow = visible.filter((c) => isEscrowHeld(c.paymentStatus)).reduce((sum, c) => sum + c.value, 0);
  const awaitingPayment = visible.filter((c) => c.paymentStatus === "Aguardando pagamento").reduce((sum, c) => sum + c.value, 0);
  const released = visible.filter((c) => c.paymentStatus === "Liberado").reduce((sum, c) => sum + c.value, 0);
  const platformFee = released * PLATFORM_FEE;
  const netReleased = released * (1 - PLATFORM_FEE);

  function updatePayment(id: string, paymentStatus: PaymentStatus, extra: Partial<Contract> = {}) {
    const now = new Date().toISOString();
    setContracts(
      contracts.map((c) => {
        if (c.id !== id) return c;
        const status = paymentStatus === "Liberado" ? "Concluído" : paymentStatus === "Reembolsado" ? "Cancelado" : c.status;
        return { ...c, ...extra, status, paymentStatus, updatedAt: now } as Contract;
      }),
    );
  }

  function pay(c: Contract) {
    updatePayment(c.id, "Pago em escrow", { paidAt: new Date().toISOString() });
    pushNotification({ title: "Pagamento em escrow", body: `${c.id} - ${money(c.value)}`, type: "success", recipientRole: "supplier", recipientCompany: c.supplier });
    toast.success("Pagamento mock registrado em escrow");
  }

  function reportDelivery(c: Contract) {
    updatePayment(c.id, "Entrega informada", { deliveryReportedAt: new Date().toISOString() });
    pushNotification({ title: "Entrega informada", body: `${c.id} aguarda confirmacao`, type: "info", recipientRole: "buyer", recipientEmail: c.buyerEmail });
    toast.success("Entrega informada ao cliente");
  }

  function release(c: Contract) {
    updatePayment(c.id, "Liberado", { releasedAt: new Date().toISOString() });
    pushNotification({ title: "Pagamento liberado", body: `${c.id} - ${money(c.value * (1 - PLATFORM_FEE))}`, type: "success", recipientRole: "supplier", recipientCompany: c.supplier });
    toast.success("Entrega confirmada e pagamento liberado");
  }

  function requestRefund(c: Contract, reason: string) {
    updatePayment(c.id, "Reembolso solicitado", { refundRequestedAt: new Date().toISOString(), refundReason: reason });
    pushNotification({ title: "Reembolso solicitado", body: `${c.id} - ${reason}`, type: "warning", recipientRole: "supplier", recipientCompany: c.supplier });
    toast.success("Solicitacao de reembolso registrada para analise");
    setRefundTarget(null);
    setRefundReason("");
  }

  function dispute(c: Contract, reason: string) {
    updatePayment(c.id, "Em disputa", { disputedAt: new Date().toISOString(), disputeReason: reason });
    pushNotification({ title: "Disputa aberta", body: `${c.id} - ${reason}`, type: "warning", recipientRole: "supplier", recipientCompany: c.supplier });
    toast("Disputa aberta para analise");
    setDisputeTarget(null);
    setDisputeReason("");
  }

  return (
    <>
      <PageHeader
        title="Financeiro"
        description={isSupplier ? "Recebiveis, escrow e liberacao de pagamentos por contrato." : "Pagamentos em escrow, confirmacao de entrega e liberacao ao fornecedor."}
      />

      <section className="mb-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-5">
        <FinanceCell label={isSupplier ? "Bruto contratado" : "Total contratado"} value={money(gross)} />
        <FinanceCell label="Aguardando pagamento" value={money(awaitingPayment)} />
        <FinanceCell label="Retido em escrow" value={money(escrow)} />
        <FinanceCell label={isSupplier ? "Liquido liberado" : "Pago e liberado"} value={money(isSupplier ? netReleased : released)} />
        <FinanceCell label="Taxa plataforma" value={money(platformFee)} sub="5% sobre valores liberados" />
      </section>

      <section className="mb-6 grid gap-3 lg:grid-cols-4">
        <StepCard icon={CreditCard} title="1. Cliente paga" description="O valor entra como pagamento mock e fica retido em escrow." />
        <StepCard icon={PackageCheck} title="2. Fornecedor entrega" description="O fornecedor informa a entrega pelo contrato." />
        <StepCard icon={CheckCircle2} title="3. Cliente confirma" description="A confirmacao libera o pagamento para o fornecedor." />
        <StepCard icon={AlertTriangle} title="4. Excecoes" description="Reembolso e disputa exigem motivo e ficam registrados para analise." />
      </section>

      <section className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Contrato</th>
              <th className="px-5 py-3">RFQ</th>
              <th className="px-5 py-3">Fornecedor</th>
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Liquido fornecedor</th>
              <th className="px-5 py-3">Contrato</th>
              <th className="px-5 py-3">Pagamento</th>
              <th className="px-5 py-3">Ultimo evento</th>
              <th className="px-5 py-3 text-right">Acao</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">Sem contratos ainda.</td></tr>}
            {visible.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="px-5 py-3 font-mono text-xs"><Link to={`/dashboard/cotacoes/${c.rfqId}`} className="hover:text-accent">{c.rfqId}</Link></td>
                <td className="px-5 py-3 font-medium">{c.supplier}</td>
                <td className="px-5 py-3 tabular-nums">{money(c.value)}</td>
                <td className="px-5 py-3 tabular-nums">{money(c.value * (1 - PLATFORM_FEE))}</td>
                <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3"><StatusBadge status={c.paymentStatus ?? "Aguardando pagamento"} /></td>
                <td className="max-w-[260px] px-5 py-3 text-xs text-muted-foreground">
                  <span className="line-clamp-2">{paymentNote(c)}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <ActionArea contract={c} isSupplier={Boolean(isSupplier)} onPay={pay} onReportDelivery={reportDelivery} onRelease={release} onRefund={() => setRefundTarget(c)} onDispute={() => setDisputeTarget(c)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Dialog open={Boolean(refundTarget)} onOpenChange={(open) => { if (!open) setRefundTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicitar reembolso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Explique o motivo da solicitacao. O valor continua retido em escrow ate a analise do caso.</p>
            <div className="space-y-2">
              <Label htmlFor="refundReason">Motivo</Label>
              <Textarea id="refundReason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={4} maxLength={600} placeholder="Ex.: entrega atrasada, divergencia tecnica, cancelamento acordado..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Cancelar</Button>
            <Button
              variant="accent"
              onClick={() => {
                if (!refundTarget) return;
                if (refundReason.trim().length < 10) { toast.error("Descreva o motivo com pelo menos 10 caracteres."); return; }
                requestRefund(refundTarget, refundReason.trim());
              }}
            >
              Registrar solicitacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(disputeTarget)} onOpenChange={(open) => { if (!open) setDisputeTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir disputa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe o que precisa ser analisado antes da liberacao ou reembolso do pagamento.</p>
            <div className="space-y-2">
              <Label htmlFor="disputeReason">Justificativa</Label>
              <Textarea id="disputeReason" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={4} maxLength={600} placeholder="Ex.: item entregue fora da especificacao, documentacao pendente, volume divergente..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeTarget(null)}>Cancelar</Button>
            <Button
              variant="accent"
              onClick={() => {
                if (!disputeTarget) return;
                if (disputeReason.trim().length < 10) { toast.error("Descreva a justificativa com pelo menos 10 caracteres."); return; }
                dispute(disputeTarget, disputeReason.trim());
              }}
            >
              Abrir disputa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionArea({
  contract,
  isSupplier,
  onPay,
  onReportDelivery,
  onRelease,
  onRefund,
  onDispute,
}: {
  contract: Contract;
  isSupplier: boolean;
  onPay: (contract: Contract) => void;
  onReportDelivery: (contract: Contract) => void;
  onRelease: (contract: Contract) => void;
  onRefund: () => void;
  onDispute: () => void;
}) {
  const status = contract.paymentStatus ?? "Aguardando pagamento";
  if (!isSupplier && status === "Aguardando pagamento") return <Button size="sm" variant="accent" onClick={() => onPay(contract)}>Liberar pagamento</Button>;
  if (isSupplier && status === "Pago em escrow") return <Button size="sm" variant="outline" onClick={() => onReportDelivery(contract)}>Informar entrega</Button>;
  if (!isSupplier && status === "Entrega informada") {
    return (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onDispute}>Disputa</Button>
        <Button size="sm" variant="accent" onClick={() => onRelease(contract)}>Liberar</Button>
      </div>
    );
  }
  if (!isSupplier && status === "Pago em escrow") return <Button size="sm" variant="outline" onClick={onRefund}><RotateCcw className="mr-1 h-3 w-3" /> Reembolso</Button>;
  if (status === "Reembolso solicitado") return <span className="text-xs text-muted-foreground">Em analise</span>;
  if (status === "Em disputa") return <span className="text-xs text-muted-foreground">Em analise</span>;
  return <span className="text-xs text-muted-foreground">Sem acao</span>;
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

function StepCard({ icon: Icon, title, description }: { icon: typeof CreditCard; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <Icon className="mb-3 h-5 w-5 text-accent" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
