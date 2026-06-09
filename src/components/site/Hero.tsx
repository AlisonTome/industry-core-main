import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-cnc.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-12 lg:gap-10 lg:py-24">
        <div className="flex flex-col justify-center lg:col-span-6">
          <p className="text-sm font-medium text-muted-foreground">
            Procurement para peças usinadas, caldeiraria e processos especiais
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Encontre fornecedores industriais qualificados para fabricar sua peça
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            NexForge conecta engenharia, compras e manufatura. Envie seu desenho técnico, receba cotações auditadas e gerencie todo o ciclo de fabricação em uma única plataforma.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth"><Button variant="hero" size="lg" className="w-full sm:w-auto">Solicitar Cotação</Button></Link>
            <Link to="/auth"><Button variant="outline" size="lg" className="w-full sm:w-auto">Cadastrar Fornecedor</Button></Link>
          </div>
          <div className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
            <p>Fluxo usado para RFQs com desenho técnico, especificação de material, tolerâncias e documentação de inspeção.</p>
          </div>
        </div>

        <div className="lg:col-span-6 relative">
          <div className="relative overflow-hidden border border-border bg-surface shadow-md">
            <img
              src={heroImg}
              alt="Centro de usinagem CNC operando na fabricação de uma peça industrial em aço"
              width={1536}
              height={1024}
              className="h-full w-full object-cover aspect-[4/3]"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-primary/80 px-4 py-3 text-xs text-primary-foreground">
              Exemplo de RFQ técnico com material, prazo, processo e documentação anexada.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
