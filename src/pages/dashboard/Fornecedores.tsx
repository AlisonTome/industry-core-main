import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLocal, K, Supplier } from "@/lib/store";
import { BadgeCheck, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Fornecedores() {
  const [suppliers] = useLocal<Supplier[]>(K.suppliers, []);
  const [q, setQ] = useState("");
  const list = suppliers.filter((s) => `${s.name} ${s.city} ${s.processes.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Fornecedores" description="Rede de fornecedores qualificados NexForge." />
      <Input className="mb-4 max-w-sm" placeholder="Buscar por nome, cidade, processo…" value={q} onChange={(e) => setQ(e.target.value)} />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <article key={s.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-1.5">{s.name}{s.verified && <BadgeCheck className="h-4 w-4 text-accent" />}</h3>
                <p className="text-xs text-muted-foreground">{s.city}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-foreground"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{s.rating}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.processes.map((p) => <span key={p} className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">{p}</span>)}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
