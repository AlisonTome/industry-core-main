import { Upload, FileSearch, GitCompare, Factory, Truck } from "lucide-react";

const steps = [
  { icon: Upload, title: "Enviar Projeto", desc: "Suba desenho técnico (STEP, DWG, PDF), especificações de material e tolerâncias." },
  { icon: FileSearch, title: "Receber Cotações", desc: "Fornecedores qualificados enviam propostas em até 48h, com prazo e preço auditado." },
  { icon: GitCompare, title: "Comparar Fornecedores", desc: "Compare lado a lado: certificações ISO, histórico, capacidade fabril e avaliação." },
  { icon: Factory, title: "Fabricação", desc: "Acompanhe ordem de produção, milestones e fotos de inspeção em tempo real." },
  { icon: Truck, title: "Entrega", desc: "Logística integrada, nota fiscal eletrônica e liberação contra inspeção de qualidade." },
];

export function ProcessFlow() {
  return (
    <section id="processo" className="border-b border-border bg-background">
      <div className="container-page py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Como funciona</p>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Do desenho técnico à peça entregue</h2>
          <p className="mt-3 text-muted-foreground">Um fluxo de procurement projetado para engenharia e compras industriais.</p>
        </div>

        <ol className="mt-10 divide-y divide-border border-y border-border">
          {steps.map((s, i) => (
            <li key={s.title} className="grid gap-3 py-5 md:grid-cols-[80px_220px_1fr] md:items-start">
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex items-center gap-3">
                <s.icon className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
