import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useLocal, K, Project } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Projetos() {
  const [projects, setProjects] = useLocal<Project[]>(K.projects, []);
  const { user } = useAuth();
  const isSupplier = user?.role === "supplier";
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        title="Projetos"
        description={isSupplier ? "Projetos vinculados às RFQs e contratos em que sua empresa participa." : "Organize RFQs e contratos por programa industrial."}
        actions={!isSupplier && <Button variant="accent" onClick={() => setOpen(true)}>Novo projeto</Button>}
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
              <StatusBadge status={p.status} />
            </div>
            <h3 className="mt-2 text-base font-semibold text-foreground">{p.name}</h3>
            <p className="text-sm text-muted-foreground">{p.client}</p>
            <dl className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div><dt className="uppercase tracking-widest text-[10px]">RFQs</dt><dd className="text-foreground font-semibold mt-0.5">{p.rfqs}</dd></div>
              <div><dt className="uppercase tracking-widest text-[10px]">Início</dt><dd className="text-foreground font-semibold mt-0.5">{p.startedAt}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      {!isSupplier && <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name") || "").trim();
              if (name.length < 3) { toast.error("Informe um nome válido."); return; }
              const np: Project = {
                id: `PRJ-${Math.floor(10 + Math.random() * 90)}`,
                name,
                client: user?.company ?? "—",
                status: "Planejamento",
                rfqs: 0,
                startedAt: new Date().toISOString().slice(0, 10),
              };
              setProjects([np, ...projects]);
              toast.success("Projeto criado");
              setOpen(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2"><Label htmlFor="name">Nome do projeto</Label><Input id="name" name="name" required maxLength={100} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" variant="accent">Criar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>}
    </>
  );
}
