import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useLocal, K, Rfq, Proposal, Project, newId, pushNotification, visibleRfqsForUser } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const PROCESSES = ["Usinagem CNC", "Caldeiraria", "Fundição", "Corte a laser", "Manufatura aditiva", "Tratamento térmico", "Solda"];
const STATUSES = ["Todas", "Aberta", "Em análise", "Adjudicada", "Cancelada"] as const;

const rfqSchema = z.object({
  part: z.string().trim().min(3, "Descreva a peça").max(120),
  qty: z.coerce.number().int().positive("Quantidade inválida"),
  process: z.string().min(1, "Selecione o processo"),
  material: z.string().max(80).optional(),
  due: z.string().min(1, "Informe data de entrega"),
  description: z.string().max(1000).optional(),
});

export default function Rfqs() {
  const { user } = useAuth();
  const isSupplier = user?.role === "supplier";
  const [rfqs, setRfqs] = useLocal<Rfq[]>(K.rfqs, []);
  const [proposals] = useLocal<Proposal[]>(K.proposals, []);
  const [projects] = useLocal<Project[]>(K.projects, []);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Todas");
  const projectId = params.get("project") || "";
  const selectedProject = projects.find((p) => p.id === projectId);
  const visibleRfqs = useMemo(() => visibleRfqsForUser(rfqs, user), [rfqs, user]);

  useEffect(() => {
    if (!isSupplier && params.get("new") === "1") {
      setOpen(true);
      params.delete("new");
      setParams(params, { replace: true });
    }
  }, [isSupplier, params, setParams]);

  const filtered = useMemo(
    () =>
      visibleRfqs.filter((r) => {
        if (projectId && r.projectId !== projectId) return false;
        if (status !== "Todas" && r.status !== status) return false;
        if (query && !`${r.id} ${r.part} ${r.process}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [visibleRfqs, projectId, query, status],
  );

  function clearProjectFilter() {
    params.delete("project");
    setParams(params, { replace: true });
  }

  function createRfq(data: Record<string, FormDataEntryValue>) {
    const parsed = rfqSchema.safeParse(data);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const id = newId("RFQ");
    const next: Rfq = {
      id,
      projectId: projectId || undefined,
      part: parsed.data.part,
      qty: parsed.data.qty,
      process: parsed.data.process,
      material: parsed.data.material,
      due: parsed.data.due,
      description: parsed.data.description,
      status: "Aberta",
      createdAt: new Date().toISOString(),
      ownerEmail: user!.email,
    };
    setRfqs([next, ...rfqs]);
    pushNotification({ title: "RFQ criada", body: `${id} - ${next.part}`, type: "info", recipientRole: "buyer", recipientEmail: user!.email });
    pushNotification({ title: "Nova RFQ disponível", body: `${id} - ${next.part}`, type: "info", recipientRole: "supplier" });
    toast.success(`RFQ ${id} criada`);
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title={selectedProject ? `RFQs - ${selectedProject.name}` : isSupplier ? "RFQs abertas" : "Cotações (RFQ)"}
        description={selectedProject ? `${selectedProject.id} · ${filtered.length} RFQ${filtered.length === 1 ? "" : "s"} vinculada${filtered.length === 1 ? "" : "s"} ao projeto.` : isSupplier ? "Consulte solicitações compatíveis e envie propostas técnicas." : "Crie, acompanhe e adjudique solicitações de cotação."}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input placeholder="Buscar por ID, peça, processo..." value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-sm" />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        {selectedProject && <Button type="button" variant="outline" onClick={clearProjectFilter}>Ver todas</Button>}
      </div>

      <section className="rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Peça</th>
              <th className="px-5 py-3">Qtd</th>
              <th className="px-5 py-3 hidden md:table-cell">Processo</th>
              <th className="px-5 py-3 hidden lg:table-cell">Entrega</th>
              <th className="px-5 py-3">Cotações</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma RFQ encontrada.</td></tr>
            )}
            {filtered.map((r) => {
              const count = proposals.filter((p) => p.rfqId === r.id && (!isSupplier || p.supplier === user?.company)).length;
              return (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs"><Link to={`/dashboard/cotacoes/${r.id}`} className="text-muted-foreground hover:text-accent">{r.id}</Link></td>
                  <td className="px-5 py-3 font-medium text-foreground"><Link to={`/dashboard/cotacoes/${r.id}`}>{r.part}</Link></td>
                  <td className="px-5 py-3 tabular-nums">{r.qty}</td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{r.process}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">{r.due}</td>
                  <td className="px-5 py-3 tabular-nums">{count}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova solicitação de cotação</DialogTitle>
            <DialogDescription>{selectedProject ? `Esta RFQ será vinculada ao projeto ${selectedProject.id}.` : "Preencha os dados técnicos. Você poderá anexar desenhos depois."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); createRfq(Object.fromEntries(fd)); }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="part">Peça</Label><Input id="part" name="part" placeholder="Ex.: Flange ASTM A350 LF2" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="qty">Quantidade</Label><Input id="qty" name="qty" type="number" min={1} required /></div>
              <div className="space-y-2"><Label htmlFor="due">Entrega</Label><Input id="due" name="due" type="date" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="process">Processo</Label>
                <Select name="process">
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{PROCESSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="material">Material</Label><Input id="material" name="material" placeholder="Ex.: Aço 4140" /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Observações</Label><Textarea id="description" name="description" rows={3} maxLength={1000} placeholder="Tolerâncias, acabamento, certificações..." /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" variant="accent">Criar RFQ</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
