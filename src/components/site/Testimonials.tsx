import { ClipboardCheck } from "lucide-react";

const items = [
  {
    title: "Compra técnica com desenho e tolerância",
    detail: "Centralize arquivos STEP, PDF técnico, material, prazo desejado e requisitos de inspeção antes de abrir a cotação.",
  },
  {
    title: "Comparação sem planilha paralela",
    detail: "Organize propostas por preço, lead time, capacidade, observações técnicas e histórico do fornecedor.",
  },
  {
    title: "Pedido acompanhado até a entrega",
    detail: "Registre contrato, ordem de produção, evidências de inspeção e eventos de entrega no mesmo fluxo.",
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-page py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Cenários de uso</p>
          <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Onde a plataforma entra na rotina industrial</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((t) => (
            <article key={t.title} className="flex flex-col border border-border bg-surface p-6 shadow-xs">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">{t.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
