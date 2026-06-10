import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useLocal, K, Rfq, Proposal, Contract, pushNotification, isRfqVisibleToUser } from "@/lib/store";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function RfqDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const isSupplier = user?.role === "supplier";
  const [rfqs, setRfqs] = useLocal<Rfq[]>(K.rfqs, []);
  const [proposals, setProposals] = useLocal<Proposal[]>(K.proposals, []);
  const [contracts, setContracts] = useLocal<Contract[]>(K.contracts, []);
  const [open, setOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Proposal | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [responseTarget, setResponseTarget] = useState<Contract | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [chargeFreight, setChargeFreight] = useState(false);

  const rfq = rfqs.find((r) => r.id === id && isRfqVisibleToUser(r, user));
  if (!rfq) return (
    <div className="rounded-xl border border-border bg-surface p-10 text-center">
      <p className="text-sm text-muted-foreground">RFQ não encontrada.</p>
      <Button className="mt-4" variant="outline" onClick={() => nav("/dashboard/cotacoes")}>Voltar</Button>
    </div>
  );

  const list = proposals.filter((p) => p.rfqId === rfq.id && (!isSupplier || p.supplier === user?.company));
  const contractForProposal = (proposalId: string) => contracts.find((c) => c.proposalId === proposalId);

  function addProposal(data: { supplier: string; basePrice: number; freightValue: number; chargeFreight: boolean; leadTimeDays: number; notes?: string }) {
    const totalPrice = data.basePrice + (data.chargeFreight ? data.freightValue : 0);
    const p: Proposal = {
      id: `PRP-${Math.floor(1000 + Math.random() * 9000)}`,
      rfqId: rfq.id,
      supplier: isSupplier ? user?.company ?? data.supplier : data.supplier,
      price: totalPrice,
      basePrice: data.basePrice,
      freightValue: data.chargeFreight ? data.freightValue : 0,
      chargeFreight: data.chargeFreight,
      leadTimeDays: data.leadTimeDays,
      notes: data.notes,
      status: "Recebida",
      createdAt: new Date().toISOString(),
    };
    setProposals([p, ...proposals]);
    if (rfq.status === "Aberta") {
      setRfqs(rfqs.map((r) => (r.id === rfq.id ? { ...r, status: "Em análise" } : r)));
    }
    pushNotification({ title: "Nova proposta", body: `${data.supplier} — ${rfq.id}`, type: "info" });
    pushNotification({ title: "Nova proposta", body: `${p.supplier} - ${rfq.id}`, type: "info", recipientRole: "buyer", recipientEmail: rfq.ownerEmail });
    pushNotification({ title: "Proposta enviada", body: `${rfq.id} - ${rfq.part}`, type: "success", recipientRole: "supplier", recipientCompany: p.supplier });
    toast.success("Proposta registrada");
    setOpen(false);
  }

  function decide(p: Proposal, accept: boolean) {
    if (accept) {
      setProposals(
        proposals.map((x) =>
          x.rfqId === rfq.id ? { ...x, status: x.id === p.id ? "Aprovada" : "Recusada" } : x,
        ),
      );
      setRfqs(rfqs.map((r) => (r.id === rfq.id ? { ...r, status: "Adjudicada" } : r)));
      const ct: Contract = {
        id: `CT-${Math.floor(1000 + Math.random() * 9000)}`,
        rfqId: rfq.id,
        proposalId: p.id,
        buyerEmail: rfq.ownerEmail,
        supplier: p.supplier,
        value: p.price,
        startedAt: new Date().toISOString(),
        status: "Em execução",
        paymentStatus: "Aguardando pagamento",
      };
      setContracts([ct, ...contracts]);
      pushNotification({ title: "Contrato gerado", body: `${ct.id} — ${p.supplier}`, type: "success" });
      pushNotification({ title: "Contrato gerado", body: `${ct.id} - ${p.supplier}`, type: "success", recipientRole: "buyer", recipientEmail: rfq.ownerEmail });
      pushNotification({ title: "Proposta aprovada", body: `${ct.id} - ${rfq.id}`, type: "success", recipientRole: "supplier", recipientCompany: p.supplier });
      toast.success(`Adjudicada para ${p.supplier}. Contrato ${ct.id} criado.`);
    } else {
      setProposals(proposals.map((x) => (x.id === p.id ? { ...x, status: "Recusada" } : x)));
      toast("Proposta recusada");
    }
  }

  function cancelRfq() {
    setRfqs(rfqs.map((r) => (r.id === rfq.id ? { ...r, status: "Cancelada" } : r)));
    toast("RFQ cancelada");
  }

  function requestCancellation(proposal: Proposal, reason: string) {
    const contract = contractForProposal(proposal.id);
    if (!contract || !user) return;
    const message = {
      authorRole: "buyer" as const,
      authorName: user.name,
      body: reason,
      createdAt: new Date().toISOString(),
    };
    setContracts(
      contracts.map((c) =>
        c.id === contract.id
          ? {
              ...c,
              cancellationStatus: "Solicitado",
              cancellationRequestedAt: new Date().toISOString(),
              cancellationReason: reason,
              cancellationMessages: [...(c.cancellationMessages ?? []), message],
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    );
    pushNotification({ title: "Cancelamento solicitado", body: `${contract.id} - ${rfq.id}`, type: "warning", recipientRole: "supplier", recipientCompany: contract.supplier });
    toast.success("Solicitacao de cancelamento enviada ao fornecedor");
    setCancelTarget(null);
    setCancelReason("");
  }

  function respondCancellation(contract: Contract, accept: boolean) {
    if (!user) return;
    const body = responseMessage.trim() || (accept ? "Cancelamento aceito pelo fornecedor." : "Cancelamento recusado pelo fornecedor.");
    const message = {
      authorRole: "supplier" as const,
      authorName: user.name,
      body,
      createdAt: new Date().toISOString(),
    };
    setContracts(
      contracts.map((c) => {
        if (c.id !== contract.id) return c;
        const paymentStatus = accept && c.paymentStatus && c.paymentStatus !== "Aguardando pagamento" ? "Reembolso solicitado" : c.paymentStatus;
        return {
          ...c,
          status: accept ? "Cancelado" : c.status,
          paymentStatus,
          refundReason: accept && paymentStatus === "Reembolso solicitado" ? "Cancelamento aceito pelo fornecedor" : c.refundReason,
          cancellationStatus: accept ? "Aceito" : "Recusado",
          cancellationRespondedAt: new Date().toISOString(),
          cancellationMessages: [...(c.cancellationMessages ?? []), message],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
    pushNotification({
      title: accept ? "Cancelamento aceito" : "Cancelamento recusado",
      body: `${contract.id} - ${rfq.id}`,
      type: accept ? "success" : "warning",
      recipientRole: "buyer",
      recipientEmail: contract.buyerEmail,
    });
    toast.success(accept ? "Cancelamento aceito" : "Cancelamento recusado");
    setResponseTarget(null);
    setResponseMessage("");
  }

  return (
    <>
      <Link to="/dashboard/cotacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-3 w-3" /> Voltar para RFQs</Link>
      <PageHeader
        title={rfq.part}
        description={`${rfq.id} · ${rfq.process}`}
        actions={
          <>
            {!isSupplier && rfq.status !== "Cancelada" && rfq.status !== "Adjudicada" && (
              <Button variant="outline" onClick={cancelRfq}>Cancelar RFQ</Button>
            )}
            {isSupplier && rfq.status !== "Cancelada" && rfq.status !== "Adjudicada" && (
              <Button variant="accent" onClick={() => setOpen(true)}>Enviar proposta</Button>
            )}
          </>
        }
      />

      <section className="mb-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <Cell label="Quantidade" value={String(rfq.qty)} />
        <Cell label="Material" value={rfq.material ?? "—"} />
        <Cell label="Entrega" value={rfq.due} />
        <Cell label="Status" value={<StatusBadge status={rfq.status} />} />
      </section>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold mb-2">Logistica</h3>
        <p className="text-sm text-muted-foreground">
          {rfq.deliveryMode === "Envio" ? "Fornecedor deve enviar a entrega. O frete pode ser cobrado na proposta." : "Cliente retira no local do fornecedor. Frete nao sera considerado na proposta."}
        </p>
        {rfq.deliveryMode === "Envio" && rfq.deliveryAddress && (
          <p className="mt-2 text-sm text-foreground">{rfq.deliveryAddress}</p>
        )}
      </section>

      {rfq.description && (
        <section className="mb-6 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold mb-2">Observações técnicas</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rfq.description}</p>
        </section>
      )}

      <section className="min-w-0 rounded-xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Propostas ({list.length})</h2>
        </header>
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Fornecedor</th>
                <th className="px-5 py-3">Preço</th>
                <th className="px-5 py-3">Lead time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">Sem propostas ainda.</td></tr>}
              {list.map((p) => {
                const contract = contractForProposal(p.id);
                return (
                <Fragment key={p.id}>
                <tr className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{p.supplier}</td>
                  <td className="px-5 py-3 tabular-nums">
                    <div>R$ {p.price.toLocaleString("pt-BR")}</div>
                    {p.chargeFreight && <div className="text-[11px] text-muted-foreground">Inclui frete R$ {(p.freightValue ?? 0).toLocaleString("pt-BR")}</div>}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{p.leadTimeDays} dias</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={p.status} />
                      {contract?.cancellationStatus === "Solicitado" && <StatusBadge status="Cancelamento solicitado" />}
                      {contract?.cancellationStatus === "Aceito" && <StatusBadge status="Cancelamento aceito" />}
                      {contract?.cancellationStatus === "Recusado" && <StatusBadge status="Cancelamento recusado" />}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!isSupplier && p.status === "Recebida" && rfq.status !== "Adjudicada" && rfq.status !== "Cancelada" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => decide(p, false)}><X className="h-3 w-3 mr-1" /> Recusar</Button>
                        <Button size="sm" variant="accent" onClick={() => decide(p, true)}><Check className="h-3 w-3 mr-1" /> Aprovar</Button>
                      </div>
                    ) : !isSupplier && p.status === "Aprovada" && contract?.status !== "Cancelado" && contract?.cancellationStatus !== "Solicitado" ? (
                      <Button size="sm" variant="outline" onClick={() => setCancelTarget(p)}><MessageSquare className="mr-1 h-3 w-3" /> Solicitar cancelamento</Button>
                    ) : isSupplier && contract?.cancellationStatus === "Solicitado" ? (
                      <Button size="sm" variant="accent" onClick={() => setResponseTarget(contract)}>Responder</Button>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
                {contract?.cancellationMessages?.length ? (
                  <tr className="border-t border-border bg-secondary/20">
                    <td colSpan={5} className="px-5 py-4">
                      <div className="rounded-md border border-border bg-surface p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">Negociacao de cancelamento</p>
                          <span className="text-xs text-muted-foreground">{contract.id}</span>
                        </div>
                        <div className="space-y-2">
                          {contract.cancellationMessages.map((message, index) => (
                            <div key={`${message.createdAt}-${index}`} className="rounded-md bg-secondary/50 p-3">
                              <p className="text-xs font-semibold">{message.authorName} - {message.authorRole === "buyer" ? "Cliente" : "Fornecedor"}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{message.body}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isSupplier ? "Enviar proposta" : "Adicionar proposta"}</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const supplier = isSupplier ? user?.company ?? "" : String(fd.get("supplier") || "").trim();
              const basePrice = Number(fd.get("basePrice"));
              const freightValue = Number(fd.get("freightValue") || 0);
              const lt = Number(fd.get("leadTimeDays"));
              const shouldChargeFreight = rfq.deliveryMode === "Envio" && fd.get("chargeFreight") === "Sim";
              if (!supplier || !basePrice || !lt) { toast.error("Preencha todos os campos."); return; }
              if (shouldChargeFreight && freightValue <= 0) { toast.error("Informe o valor do frete."); return; }
              addProposal({ supplier, basePrice, freightValue, chargeFreight: shouldChargeFreight, leadTimeDays: lt, notes: String(fd.get("notes") || "") });
            }}
            className="space-y-4"
          >
            {!isSupplier && (
              <div className="space-y-2"><Label htmlFor="supplier">Fornecedor</Label><Input id="supplier" name="supplier" required maxLength={80} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="basePrice">Valor da produção (R$)</Label><Input id="basePrice" name="basePrice" type="number" min={1} step="0.01" required /></div>
              <div className="space-y-2"><Label htmlFor="leadTimeDays">Lead time (dias)</Label><Input id="leadTimeDays" name="leadTimeDays" type="number" min={1} required /></div>
            </div>
            {rfq.deliveryMode === "Envio" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="chargeFreight">Cobrar frete?</Label>
                  <select id="chargeFreight" name="chargeFreight" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={chargeFreight ? "Sim" : "Nao"} onChange={(e) => setChargeFreight(e.target.value === "Sim")}>
                    <option value="Nao">Nao</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                {chargeFreight && (
                  <div className="space-y-2"><Label htmlFor="freightValue">Valor do frete (R$)</Label><Input id="freightValue" name="freightValue" type="number" min={0} step="0.01" /></div>
                )}
              </div>
            )}
            <div className="space-y-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" name="notes" rows={3} maxLength={500} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="accent">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(value) => { if (!value) setCancelTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Solicitar cancelamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Envie uma manifestacao ao fornecedor explicando o motivo do cancelamento. O pedido so sera cancelado se o fornecedor aceitar.</p>
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Motivo</Label>
              <Textarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={4} maxLength={700} placeholder="Ex.: mudanca de escopo, necessidade interna cancelada, atraso critico, acordo comercial..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Cancelar</Button>
            <Button
              variant="accent"
              onClick={() => {
                if (!cancelTarget) return;
                if (cancelReason.trim().length < 10) { toast.error("Descreva o motivo com pelo menos 10 caracteres."); return; }
                requestCancellation(cancelTarget, cancelReason.trim());
              }}
            >
              Enviar solicitacao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(responseTarget)} onOpenChange={(value) => { if (!value) setResponseTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Responder cancelamento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Analise a solicitacao do cliente e registre sua resposta. A resposta ficara anexada na RFQ.</p>
            <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              {responseTarget?.cancellationReason}
            </div>
            <div className="space-y-2">
              <Label htmlFor="responseMessage">Mensagem ao cliente</Label>
              <Textarea id="responseMessage" value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)} rows={3} maxLength={700} placeholder="Opcional: detalhe condicoes, pendencias ou acordo combinado." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => responseTarget && respondCancellation(responseTarget, false)}>Recusar cancelamento</Button>
            <Button variant="accent" onClick={() => responseTarget && respondCancellation(responseTarget, true)}>Aceitar cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
