const stats = [
  { value: "RFQ", label: "Comparação estruturada", sub: "Preço, prazo, processo e documentação" },
  { value: "NDA", label: "Controle de acesso", sub: "Arquivos técnicos antes da cotação" },
  { value: "QA", label: "Inspeção registrada", sub: "Evidências por etapa de fabricação" },
  { value: "ERP", label: "Histórico exportável", sub: "Pedidos, propostas e contratos" },
];

export function TrustMetrics() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface p-6 lg:p-8">
              <p className="text-3xl font-bold text-foreground lg:text-4xl">{s.value}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{s.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Construído para compras técnicas em automotivo, óleo &amp; gás, aeroespacial, bens de capital e energia.
        </p>
      </div>
    </section>
  );
}
