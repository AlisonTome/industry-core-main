import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRfqProjectId, projectOwnerKey, useLocal, K, Project, Rfq, Proposal, visibleProjectsForUser, visibleRfqsForUser } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const STATUSES = ["Todas", "Aberta", "Em análise", "Adjudicada", "Cancelada"] as const;

export default function ProjetoDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [projects] = useLocal<Project[]>(K.projects, []);
  const [rfqs, setRfqs] = useLocal<Rfq[]>(K.rfqs, []);
  const [proposals] = useLocal<Proposal[]>(K.proposals, []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [due, setDue] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Todas");

  const visibleProjects = visibleProjectsForUser(projects, user);
  const project = visibleProjects.find((p) => p.id === id);
  const visibleRfqs = visibleRfqsForUser(rfqs, user);
  const linkedRfqs = useMemo(
    () => visibleRfqs.filter((rfq) => getRfqProjectId(rfq, user) === project?.id),
    [visibleRfqs, project?.id, user],
  );
  const candidateRfqs = useMemo(
    () =>
      visibleRfqs.filter((rfq) => {
        if (query && !`${rfq.id} ${rfq.part} ${rfq.process}`.toLowerCase().includes(query.toLowerCase())) return false;
        if (due && rfq.due !== due) return false;
        if (status !== "Todas" && rfq.status !== status) return false;
        return true;
      }),
    [visibleRfqs, query, due, status],
  );

  function setProjectLink(rfqId: string, projectId?: string) {
    if (!user) return;
    const key = projectOwnerKey(user);
    setRfqs(rfqs.map((rfq) => {
      if (rfq.id !== rfqId) return rfq;
      if (user.role === "buyer") return { ...rfq, projectId };
      return { ...rfq, projectLinks: { ...(rfq.projectLinks ?? {}), [key]: projectId } };
    }));
  }

  function addRfq(rfq: Rfq) {
    if (!project) return;
    setProjectLink(rfq.id, project.id);
    toast.success(`${rfq.id} vinculada ao projeto`);
  }

  function removeRfq(rfq: Rfq) {
    setProjectLink(rfq.id, undefined);
    toast("RFQ removida do projeto");
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-muted-foreground">Projeto não encontrado para este perfil.</p>
        <Button className="mt-4" variant="outline" onClick={() => nav("/dashboard/projetos")}>Voltar para projetos</Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${project.id} · ${linkedRfqs.length} RFQ${linkedRfqs.length === 1 ? "" : "s"} vinculada${linkedRfqs.length === 1 ? "" : "s"}`}
        actions={<Button variant="accent" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Adicionar RFQ</Button>}
      />

      <section className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">RFQ</th>
              <th className="px-5 py-3">Peça</th>
              <th className="px-5 py-3 hidden md:table-cell">Processo</th>
              <th className="px-5 py-3 hidden lg:table-cell">Entrega</th>
              <th className="px-5 py-3">Propostas</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {linkedRfqs.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma RFQ vinculada a este projeto.</td></tr>
            )}
            {linkedRfqs.map((rfq) => {
              const proposalCount = proposals.filter((p) => p.rfqId === rfq.id).length;
              return (
                <tr key={rfq.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs"><Link to={`/dashboard/cotacoes/${rfq.id}`} className="text-muted-foreground hover:text-accent">{rfq.id}</Link></td>
                  <td className="px-5 py-3 font-medium text-foreground">{rfq.part}</td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{rfq.process}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">{rfq.due}</td>
                  <td className="px-5 py-3 tabular-nums">{proposalCount}</td>
                  <td className="px-5 py-3"><StatusBadge status={rfq.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => removeRfq(rfq)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remover
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar RFQ ao projeto</DialogTitle>
            <DialogDescription>Filtre as solicitações disponíveis e vincule ao projeto atual.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input placeholder="Buscar por título, ID ou processo" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-md border border-border">
            {candidateRfqs.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma RFQ encontrada.</div>}
            {candidateRfqs.map((rfq) => {
              const currentProjectId = getRfqProjectId(rfq, user);
              const linkedHere = currentProjectId === project.id;
              return (
                <div key={rfq.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{rfq.id} · {rfq.part}</p>
                    <p className="text-xs text-muted-foreground">{rfq.process} · entrega {rfq.due} · {rfq.status}</p>
                  </div>
                  <Button size="sm" variant={linkedHere ? "secondary" : "outline"} disabled={linkedHere} onClick={() => addRfq(rfq)}>
                    {linkedHere ? "Vinculada" : currentProjectId ? "Mover para este projeto" : "Adicionar"}
                  </Button>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="accent" onClick={() => setOpen(false)}>Concluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
