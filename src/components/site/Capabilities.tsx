import { ArrowUpRight } from "lucide-react";
import cnc from "@/assets/cap-cnc.jpg";
import laser from "@/assets/cap-laser.jpg";
import sheet from "@/assets/cap-sheet.jpg";
import welding from "@/assets/cap-welding.jpg";
import foundry from "@/assets/cap-foundry.jpg";
import additive from "@/assets/cap-additive.jpg";
import heat from "@/assets/cap-heat.jpg";
import engineering from "@/assets/cap-engineering.jpg";

const items = [
  { img: cnc, title: "Usinagem CNC", desc: "Torno e fresa 3, 4 e 5 eixos · tolerância até ±0,005 mm" },
  { img: laser, title: "Corte a Laser", desc: "Fibra até 25 kW · chapas até 30 mm · aço, inox, alumínio" },
  { img: sheet, title: "Chapa Metálica", desc: "Dobra, calandragem, puncionamento, montagem soldada" },
  { img: welding, title: "Solda & Caldeiraria", desc: "MIG/MAG, TIG, eletrodo · qualificação ASME IX" },
  { img: foundry, title: "Fundição", desc: "Areia, cera perdida, sob pressão · ferro, alumínio, bronze" },
  { img: additive, title: "Manufatura Aditiva", desc: "FDM, SLA, SLS, DMLS · prototipagem e séries curtas" },
  { img: heat, title: "Tratamento Térmico", desc: "Têmpera, revenido, cementação, nitretação" },
  { img: engineering, title: "Engenharia & Inspeção", desc: "DFM, metrologia 3D, laudos dimensionais e END" },
];

export function Capabilities() {
  return (
    <section id="capacidades" className="border-b border-border bg-surface">
      <div className="container-page py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Capacidades de manufatura</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Toda cadeia produtiva em uma plataforma</h2>
            <p className="mt-3 text-muted-foreground">Mais de 30 processos de fabricação cobertos por fornecedores auditados.</p>
          </div>
          <a href="/auth" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">Ver capacidades disponíveis <ArrowUpRight className="h-4 w-4" /></a>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <article key={it.title} className="group overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-shadow hover:shadow-md">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={it.img} alt={it.title} loading="lazy" width={800} height={600} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground">{it.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{it.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
