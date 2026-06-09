import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { K } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

export default function Configuracoes() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  function save() {
    if (!user) return;
    const next = { ...user, name, company };
    localStorage.setItem(K.session, JSON.stringify(next));
    toast.success("Perfil atualizado. Atualize a página para refletir em todos os lugares.");
  }
  return (
    <>
      <PageHeader title="Configurações" description="Conta, empresa e preferências." />
      <section className="max-w-xl rounded-xl border border-border bg-surface p-6 space-y-4">
        <div className="space-y-2"><Label>E-mail</Label><Input value={user?.email ?? ""} disabled /></div>
        <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></div>
        <div className="space-y-2"><Label>Empresa</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} /></div>
        <div className="space-y-2"><Label>Perfil</Label><Input value={user?.role === "buyer" ? "Comprador" : "Fornecedor"} disabled /></div>
        <div className="flex justify-end"><Button variant="accent" onClick={save}>Salvar alterações</Button></div>
      </section>
    </>
  );
}
