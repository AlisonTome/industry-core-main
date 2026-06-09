import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { label: "Capacidades", href: "#capacidades" },
  { label: "Como funciona", href: "#processo" },
  { label: "Para compradores", href: "#compradores" },
  { label: "Para fornecedores", href: "#fornecedores" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="NexForge">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">N</div>
          <span className="text-lg font-bold tracking-tight">NexForge</span>
          <span className="hidden sm:inline rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">B2B</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Principal">
          {nav.map(n => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{n.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link to="/auth"><Button variant="accent" size="sm">Solicitar Cotação</Button></Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="container-page py-4 flex flex-col gap-3">
            {nav.map(n => <a key={n.href} href={n.href} className="text-sm py-2">{n.label}</a>)}
            <div className="flex gap-2 pt-2">
              <Link to="/auth" className="flex-1"><Button variant="outline" className="w-full">Entrar</Button></Link>
              <Link to="/auth" className="flex-1"><Button variant="accent" className="w-full">Cotar</Button></Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
