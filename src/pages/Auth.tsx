import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, Role } from "@/contexts/AuthContext";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});
const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  company: z.string().trim().min(2, "Informe a empresa").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
  role: z.enum(["buyer", "supplier"]),
});

export default function Auth() {
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const dest = loc.state?.from || "/dashboard";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-foreground font-bold">N</div>
          <span className="text-lg font-bold">NexForge</span>
        </Link>
        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Procurement industrial em uma única plataforma</h1>
          <p className="text-primary-foreground/75">RFQs auditadas, propostas comparáveis, contratos digitais e gestão de produção — do desenho técnico à entrega.</p>
          <div className="grid grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-6">
            <Metric value="RFQ" label="Cotação" />
            <Metric value="QA" label="Inspeção" />
            <Metric value="NDA" label="Acesso" />
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">© NexForge · ISO 9001</p>
      </aside>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">N</div>
              <span className="text-lg font-bold">NexForge</span>
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Acesse sua conta</h2>
          {import.meta.env.DEV && (
            <p className="mt-1 text-sm text-muted-foreground">Conta demo: <span className="font-mono">demo@nexforge.com</span> / <span className="font-mono">demo1234</span></p>
          )}

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm onSubmit={(email, password) => {
                const parsed = loginSchema.safeParse({ email, password });
                if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
                const r = login(email, password);
                if (!r.ok) { toast.error(r.error!); return; }
                toast.success("Bem-vinda de volta!");
                nav(dest, { replace: true });
              }} />
            </TabsContent>

            <TabsContent value="signup">
              <SignupForm onSubmit={(data) => {
                const parsed = signupSchema.safeParse(data);
                if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
                const r = signup(data);
                if (!r.ok) { toast.error(r.error!); return; }
                toast.success("Conta criada com sucesso!");
                nav("/dashboard", { replace: true });
              }} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-accent">{value}</p>
      <p className="text-xs text-primary-foreground/70 mt-1">{label}</p>
    </div>
  );
}

function LoginForm({ onSubmit }: { onSubmit: (email: string, password: string) => void }) {
  const [email, setEmail] = useState("demo@nexforge.com");
  const [password, setPassword] = useState("demo1234");
  return (
    <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(email, password); }}>
      <div className="space-y-2"><Label htmlFor="email">E-mail corporativo</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      <Button type="submit" variant="accent" className="w-full">Entrar</Button>
    </form>
  );
}

function SignupForm({ onSubmit }: { onSubmit: (d: { name: string; company: string; email: string; password: string; role: Role }) => void }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  return (
    <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ name, company, email, password, role }); }}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="company">Empresa</Label><Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="semail">E-mail corporativo</Label><Input id="semail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div className="space-y-2"><Label htmlFor="spassword">Senha</Label><Input id="spassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
      <div className="space-y-2">
        <Label>Perfil</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["buyer", "supplier"] as Role[]).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${role === r ? "border-accent bg-accent/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {r === "buyer" ? "Comprador" : "Fornecedor"}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" variant="accent" className="w-full">Criar conta</Button>
    </form>
  );
}
