import { Link } from "react-router-dom";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getRfqProjectId, useLocal, K, Project, Rfq, visibleProjectsForUser, visibleRfqsForUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ListChecks } from "lucide-react";

export default function Projetos() {
  const [projects, setProjects] = useLocal<Project[]>(K.projects, []);
  const [rfqs] = useLocal<Rfq[]>(K.rfqs, []);
  const { user } = useAuth();
  const isSupplier = user?.role === "supplier";
  const [open, setOpen] = useState(false);
  const visibleRfqs = visibleRfqsForUser(rfqs, user);
  const visibleProjects = useMemo(() => visibleProjectsForUser(projects, user), [projects, user]);

  function createProject(name: string) {
    if (!user) return;
    const np: Project = {
      id: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      client: user.company,
      ownerEmail: user.email,
      ownerCompany: user.company,
      ownerRole: user.role,
      status: "Planejamento",
      rfqs: 0,
      startedAt: new Date().toISOString().slice(0, 10),
    };
    setProjects([np, ...projects]);
    toast.success("Projeto criado");
    setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Projetos"
        description={isSupplier ? "Projetos vinculados às RFQs em que sua empresa participa." : "Organize RFQs e contratos por programa industrial."}
        actions={<Button variant="accent" onClick={() => setOpen(true)}>Novo projeto</Button>}
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Nenhum projeto cadastrado para este perfil.
          </div>
        )}
        {visibleProjects.map((p) => {
          const rfqCount = visibleRfqs.filter((r) => getRfqProjectId(r, user) === p.id).length;
          return (
            <article key={p.id} className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-secondary/30">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                <StatusBadge status={p.status} />
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.client}</p>
              <dl className="mt-4 flex items-end justify-between text-xs text-muted-foreground">
                <div><dt className="uppercase tracking-widest text-[10px]">RFQs</dt><dd className="text-foreground font-semibold mt-0.5">{rfqCount}</dd></div>
                <div><dt className="uppercase tracking-widest text-[10px]">Início</dt><dd className="text-foreground font-semibold mt-0.5">{p.startedAt}</dd></div>
              </dl>
              <Button asChild size="sm" variant="outline" className="mt-4">
                <Link to={`/dashboard/projetos/${encodeURIComponent(p.id)}`}>
                  <ListChecks className="mr-1.5 h-3.5 w-3.5" /> Gerenciar
                </Link>
              </Button>
            </article>
          );
        })}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name") || "").trim();
              if (name.length < 3) { toast.error("Informe um nome válido."); return; }
              createProject(name);
            }}
            className="space-y-4"
          >
            <div className="space-y-2"><Label htmlFor="name">Nome do projeto</Label><Input id="name" name="name" required maxLength={100} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" variant="accent">Criar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
