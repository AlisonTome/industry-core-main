import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="bg-background">
      <div className="container-page py-16">
        <div className="border-y border-border bg-primary px-6 py-10 lg:px-10 lg:py-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">Pronto para reduzir o lead time da sua próxima peça?</h2>
            <p className="mt-3 text-primary-foreground/75">Envie seu desenho técnico agora e receba até 8 cotações qualificadas em 48 horas.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/auth"><Button variant="accent" size="lg">Solicitar Cotação</Button></Link>
            <Link to="/auth"><Button variant="outline" size="lg" className="bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:text-primary-foreground">Falar com especialista</Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
