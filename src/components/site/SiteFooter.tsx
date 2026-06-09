import { Link } from "react-router-dom";

const cols = [
  { title: "Plataforma", links: [{ label: "Como funciona", href: "/#processo" }, { label: "Capacidades", href: "/#capacidades" }, { label: "Cotações", href: "/auth" }, { label: "Contratos", href: "/auth" }] },
  { title: "Operação", links: [{ label: "Compradores", href: "/#compradores" }, { label: "Fornecedores", href: "/#fornecedores" }, { label: "RFQs", href: "/auth" }, { label: "Suporte", href: "/auth" }] },
  { title: "Recursos", links: [{ label: "Central de ajuda", href: "/auth" }, { label: "Documentação", href: "/auth" }, { label: "Blog técnico", href: "/auth" }, { label: "Status", href: "/auth" }] },
  { title: "Legal", links: [{ label: "Termos", href: "/auth" }, { label: "Privacidade", href: "/auth" }, { label: "LGPD", href: "/auth" }, { label: "Compliance", href: "/auth" }] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">N</div>
              <span className="text-lg font-bold">NexForge</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">Marketplace industrial para procurement técnico de peças e serviços de fabricação.</p>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
              <ul className="mt-3 space-y-2">
                {c.links.map(l => <li key={l.label}><a href={l.href} className="text-sm text-muted-foreground hover:text-foreground">{l.label}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} NexForge. Todos os direitos reservados.</p>
          <p>Curitiba · São Paulo · Belo Horizonte</p>
        </div>
      </div>
    </footer>
  );
}
