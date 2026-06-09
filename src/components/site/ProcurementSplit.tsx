import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const buyer = [
  "Cotações auditadas em até 48h",
  "Comparativo técnico e comercial lado a lado",
  "Contratos digitais com NDA padrão",
  "Inspeção de qualidade e logística integrada",
];

const supplier = [
  "RFQs qualificadas e compatíveis com sua capacidade",
  "Pagamento garantido contra entrega",
  "Painel de produção e gestão de pedidos",
  "Selo de fornecedor verificado NexForge",
];

export function ProcurementSplit() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container-page py-20 grid gap-6 lg:grid-cols-2">
        <Card id="compradores" tag="Para compradores industriais" title="Procurement técnico, sem ruído"
          desc="Centralize cotações, contratos e inspeções. Reduza ciclo de compras e aumente cobertura de fornecedores qualificados."
          items={buyer} cta="Solicitar Cotação" />
        <Card id="fornecedores" tag="Para fornecedores" title="Cresça com demanda recorrente"
          desc="Receba RFQs alinhadas à sua capacidade fabril. Foque na produção — a plataforma cuida de contrato, faturamento e logística."
          items={supplier} cta="Cadastrar Fornecedor" variant="dark" />
      </div>
    </section>
  );
}

function Card({ id, tag, title, desc, items, cta, variant = "light" }: {
  id: string; tag: string; title: string; desc: string; items: string[]; cta: string; variant?: "light" | "dark";
}) {
  const dark = variant === "dark";
  return (
    <article id={id} className={`rounded-2xl border p-8 lg:p-10 ${dark ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-accent" : "text-accent"}`}>{tag}</p>
      <h3 className={`mt-3 text-2xl font-bold ${dark ? "text-primary-foreground" : "text-foreground"}`}>{title}</h3>
      <p className={`mt-2 text-sm ${dark ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{desc}</p>
      <ul className="mt-6 space-y-3">
        {items.map(i => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-accent" : "text-accent"}`} />
            <span className={dark ? "text-primary-foreground/90" : "text-foreground"}>{i}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link to="/auth">
          <Button variant={dark ? "accent" : "default"} size="lg">{cta}</Button>
        </Link>
      </div>
    </article>
  );
}
