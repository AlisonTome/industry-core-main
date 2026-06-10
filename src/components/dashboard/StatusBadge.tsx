const map: Record<string, string> = {
  "Aberta": "bg-accent/10 text-accent",
  "Em análise": "bg-warning/15 text-warning",
  "Adjudicada": "bg-success/10 text-success",
  "Cancelada": "bg-destructive/10 text-destructive",
  "Recebida": "bg-accent/10 text-accent",
  "Aprovada": "bg-success/10 text-success",
  "Recusada": "bg-destructive/10 text-destructive",
  "Em execução": "bg-warning/15 text-warning",
  "Concluído": "bg-success/10 text-success",
  "Em andamento": "bg-warning/15 text-warning",
  "Planejamento": "bg-secondary text-foreground",
  "Aguardando pagamento": "bg-warning/15 text-warning",
  "Pago em escrow": "bg-accent/10 text-accent",
  "Entrega informada": "bg-accent/10 text-accent",
  "Liberado": "bg-success/10 text-success",
  "Reembolso solicitado": "bg-warning/15 text-warning",
  "Reembolsado": "bg-secondary text-foreground",
  "Em disputa": "bg-destructive/10 text-destructive",
  "Cancelamento solicitado": "bg-warning/15 text-warning",
  "Cancelamento aceito": "bg-success/10 text-success",
  "Cancelamento recusado": "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${map[status] ?? "bg-secondary text-foreground"}`}>
      {status}
    </span>
  );
}
