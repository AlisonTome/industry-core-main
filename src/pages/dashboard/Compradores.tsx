import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLocal, K, Buyer } from "@/lib/store";

export default function Compradores() {
  const [buyers] = useLocal<Buyer[]>(K.buyers, []);
  return (
    <>
      <PageHeader title="Compradores" description="Empresas industriais ativas na plataforma." />
      <section className="rounded-xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Empresa</th>
              <th className="px-5 py-3">Setor</th>
              <th className="px-5 py-3">Cidade</th>
              <th className="px-5 py-3">RFQs ativas</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((b) => (
              <tr key={b.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-5 py-3 font-medium">{b.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.sector}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.city}</td>
                <td className="px-5 py-3 tabular-nums">{b.activeRfqs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
