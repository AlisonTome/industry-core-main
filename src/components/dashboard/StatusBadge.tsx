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
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${map[status] ?? "bg-secondary text-foreground"}`}>
      {status}
    </span>
  );
}
