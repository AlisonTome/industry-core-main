import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useLocal, K, Rfq, Proposal, Contract, pushNotification, isRfqVisibleToUser } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
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

  const rfq = rfqs.find((r) => r.id === id && isRfqVisibleToUser(r, user));
  if (!rfq) return (
    <div className="rounded-xl border border-border bg-surface p-10 text-center">
      <p className="text-sm text-muted-foreground">RFQ não encontrada.</p>
      <Button className="mt-4" variant="outline" onClick={() => nav("/dashboard/cotacoes")}>Voltar</Button>
    </div>
  );

  const list = proposals.filter((p) => p.rfqId === rfq.id && (!isSupplier || p.supplier === user?.company));

  function addProposal(data: { supplier: string; price: number; leadTimeDays: number; notes?: string }) {
    const p: Proposal = {
      id: `PRP-${Math.floor(1000 + Math.random() * 9000)}`,
      rfqId: rfq.id,
      supplier: isSupplier ? user?.company ?? data.supplier : data.supplier,
      price: data.price,
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
        supplier: p.supplier,
        value: p.price,
        startedAt: new Date().toISOString(),
        status: "Em execução",
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

      {rfq.description && (
        <section className="mb-6 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold mb-2">Observações técnicas</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rfq.description}</p>
        </section>
      )}

      <section className="rounded-xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Propostas ({list.length})</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{p.supplier}</td>
                  <td className="px-5 py-3 tabular-nums">R$ {p.price.toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-3 tabular-nums">{p.leadTimeDays} dias</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {!isSupplier && p.status === "Recebida" && rfq.status !== "Adjudicada" && rfq.status !== "Cancelada" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => decide(p, false)}><X className="h-3 w-3 mr-1" /> Recusar</Button>
                        <Button size="sm" variant="accent" onClick={() => decide(p, true)}><Check className="h-3 w-3 mr-1" /> Aprovar</Button>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
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
              const price = Number(fd.get("price"));
              const lt = Number(fd.get("leadTimeDays"));
              if (!supplier || !price || !lt) { toast.error("Preencha todos os campos."); return; }
              addProposal({ supplier, price, leadTimeDays: lt, notes: String(fd.get("notes") || "") });
            }}
            className="space-y-4"
          >
            {!isSupplier && (
              <div className="space-y-2"><Label htmlFor="supplier">Fornecedor</Label><Input id="supplier" name="supplier" required maxLength={80} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="price">Preço total (R$)</Label><Input id="price" name="price" type="number" min={1} step="0.01" required /></div>
              <div className="space-y-2"><Label htmlFor="leadTimeDays">Lead time (dias)</Label><Input id="leadTimeDays" name="leadTimeDays" type="number" min={1} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" name="notes" rows={3} maxLength={500} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="accent">Salvar</Button>
            </DialogFooter>
          </form>
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
