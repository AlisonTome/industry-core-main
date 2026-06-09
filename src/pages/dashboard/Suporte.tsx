import { PageHeader } from "@/components/dashboard/PageHeader";
import { Mail, MessageSquare, Phone } from "lucide-react";

export default function Suporte() {
  return (
    <>
      <PageHeader title="Suporte" description="Fale com o time NexForge." />
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, title: "E-mail", desc: "suporte@nexforge.com" },
          { icon: Phone, title: "Telefone", desc: "0800 940 1234" },
          { icon: MessageSquare, title: "Chat", desc: "Seg. a sex., 8h às 20h" },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-surface p-5">
            <c.icon className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-semibold">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </section>
    </>
  );
}
