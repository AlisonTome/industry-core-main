import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { AddressSettings, BuyerPaymentSettings, K, Supplier, SupplierReceivingSettings, useLocal } from "@/lib/store";
import { CreditCard, Landmark, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fieldClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

function emptySupplierReceiving(ownerEmail: string): SupplierReceivingSettings {
  return {
    ownerEmail,
    bankName: "",
    agency: "",
    account: "",
    accountType: "Corrente",
    document: "",
    pixKey: "",
    payoutMethod: "Pix",
    verified: false,
  };
}

function emptyBuyerPayment(ownerEmail: string): BuyerPaymentSettings {
  return {
    ownerEmail,
    defaultMethod: "Cartao",
    cardLabel: "",
    billingDocument: "",
    billingAddress: "",
    pixEnabled: true,
    boletoEnabled: false,
  };
}

function emptyAddress(ownerEmail: string): AddressSettings {
  return {
    ownerEmail,
    label: "Principal",
    zipCode: "",
    street: "",
    number: "",
    district: "",
    city: "",
    state: "",
    complement: "",
  };
}

export default function Configuracoes() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [supplierSettings, setSupplierSettings] = useLocal<SupplierReceivingSettings[]>(K.supplierReceiving, []);
  const [buyerSettings, setBuyerSettings] = useLocal<BuyerPaymentSettings[]>(K.buyerPayments, []);
  const [addresses, setAddresses] = useLocal<AddressSettings[]>(K.addresses, []);
  const [suppliers, setSuppliers] = useLocal<Supplier[]>(K.suppliers, []);

  const supplierReceiving = supplierSettings.find((s) => s.ownerEmail === user?.email) ?? emptySupplierReceiving(user?.email ?? "");
  const buyerPayment = buyerSettings.find((s) => s.ownerEmail === user?.email) ?? emptyBuyerPayment(user?.email ?? "");
  const address = addresses.find((s) => s.ownerEmail === user?.email) ?? emptyAddress(user?.email ?? "");

  function saveProfile() {
    if (!user) return;
    const next = { ...user, name, company };
    localStorage.setItem(K.session, JSON.stringify(next));
    toast.success("Perfil atualizado. Atualize a pagina para refletir em todos os lugares.");
  }

  function saveSupplierReceiving(next: SupplierReceivingSettings) {
    if (!user) return;
    const payload = { ...next, ownerEmail: user.email, verified: Boolean(next.bankName && next.account && next.document), updatedAt: new Date().toISOString() };
    setSupplierSettings([payload, ...supplierSettings.filter((s) => s.ownerEmail !== user.email)]);
    toast.success("Dados de recebimento salvos");
  }

  function saveBuyerPayment(next: BuyerPaymentSettings) {
    if (!user) return;
    const payload = { ...next, ownerEmail: user.email, updatedAt: new Date().toISOString() };
    setBuyerSettings([payload, ...buyerSettings.filter((s) => s.ownerEmail !== user.email)]);
    toast.success("Forma de pagamento salva");
  }

  function saveAddress(next: AddressSettings) {
    if (!user) return;
    const payload = { ...next, ownerEmail: user.email, updatedAt: new Date().toISOString() };
    setAddresses([payload, ...addresses.filter((s) => s.ownerEmail !== user.email)]);
    if (user.role === "supplier" && payload.city && payload.state) {
      setSuppliers(
        suppliers.map((supplier) =>
          supplier.name.toLowerCase() === user.company.toLowerCase()
            ? { ...supplier, city: `${payload.city}/${payload.state}` }
            : supplier,
        ),
      );
    }
    toast.success("Endereco salvo");
  }

  return (
    <>
      <PageHeader title="Configuracoes" description="Conta, empresa e configuracoes financeiras." />

      <Tabs defaultValue="perfil" className="max-w-4xl">
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-secondary p-1 sm:w-fit">
          <TabsTrigger value="perfil" className="gap-2"><UserRound className="h-4 w-4" /> Perfil</TabsTrigger>
          <TabsTrigger value="endereco" className="gap-2"><MapPin className="h-4 w-4" /> Endereco</TabsTrigger>
          {user?.role === "supplier" ? (
            <TabsTrigger value="recebimento" className="gap-2"><Landmark className="h-4 w-4" /> Recebimento</TabsTrigger>
          ) : (
            <TabsTrigger value="pagamento" className="gap-2"><CreditCard className="h-4 w-4" /> Pagamento</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="perfil">
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail"><Input value={user?.email ?? ""} disabled /></Field>
              <Field label="Perfil"><Input value={user?.role === "buyer" ? "Cliente" : "Fornecedor"} disabled /></Field>
              <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></Field>
              <Field label="Empresa"><Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} /></Field>
            </div>
            <div className="mt-5 flex justify-end"><Button variant="accent" onClick={saveProfile}>Salvar alteracoes</Button></div>
          </section>
        </TabsContent>

        <TabsContent value="endereco">
          <AddressForm value={address} role={user?.role === "supplier" ? "supplier" : "buyer"} onSave={saveAddress} />
        </TabsContent>

        {user?.role === "supplier" ? (
          <TabsContent value="recebimento">
            <SupplierReceivingForm value={supplierReceiving} onSave={saveSupplierReceiving} />
          </TabsContent>
        ) : (
          <TabsContent value="pagamento">
            <BuyerPaymentForm value={buyerPayment} onSave={saveBuyerPayment} />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

function SupplierReceivingForm({ value, onSave }: { value: SupplierReceivingSettings; onSave: (value: SupplierReceivingSettings) => void }) {
  const [form, setForm] = useState(value);
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <header className="mb-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent/10 text-accent"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <h2 className="text-base font-semibold">Dados de recebimento</h2>
          <p className="text-sm text-muted-foreground">Configuracao mock para repasse quando o pagamento em escrow for liberado.</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Banco"><Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Ex.: Banco do Brasil" /></Field>
        <Field label="CPF/CNPJ do recebedor"><Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} placeholder="Somente para simulacao" /></Field>
        <Field label="Agencia"><Input value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} /></Field>
        <Field label="Conta"><Input value={form.account} onChange={(e) => setForm({ ...form, account: e.target.value })} /></Field>
        <Field label="Tipo de conta">
          <select className={fieldClass} value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value as SupplierReceivingSettings["accountType"] })}>
            <option>Corrente</option>
            <option>Poupanca</option>
            <option>Pagamento</option>
          </select>
        </Field>
        <Field label="Chave Pix"><Input value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} /></Field>
        <Field label="Receber preferencialmente por">
          <select className={fieldClass} value={form.payoutMethod} onChange={(e) => setForm({ ...form, payoutMethod: e.target.value as SupplierReceivingSettings["payoutMethod"] })}>
            <option>Pix</option>
            <option>Transferencia bancaria</option>
          </select>
        </Field>
        <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm">
          <p className="font-medium">{form.verified ? "Cadastro pronto para recebimento" : "Cadastro pendente"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Nesta fase, a verificacao e apenas visual e baseada nos campos preenchidos.</p>
        </div>
      </div>
      <div className="mt-5 flex justify-end"><Button variant="accent" onClick={() => onSave(form)}>Salvar recebimento</Button></div>
    </section>
  );
}

function BuyerPaymentForm({ value, onSave }: { value: BuyerPaymentSettings; onSave: (value: BuyerPaymentSettings) => void }) {
  const [form, setForm] = useState(value);
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <header className="mb-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent/10 text-accent"><CreditCard className="h-5 w-5" /></div>
        <div>
          <h2 className="text-base font-semibold">Formas de pagamento</h2>
          <p className="text-sm text-muted-foreground">Configuracao mock para pagamentos retidos em escrow ate a confirmacao da entrega.</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Metodo padrao">
          <select className={fieldClass} value={form.defaultMethod} onChange={(e) => setForm({ ...form, defaultMethod: e.target.value as BuyerPaymentSettings["defaultMethod"] })}>
            <option>Cartao</option>
            <option>Pix</option>
            <option>Boleto</option>
          </select>
        </Field>
        <Field label="Identificacao do cartao"><Input value={form.cardLabel} onChange={(e) => setForm({ ...form, cardLabel: e.target.value })} placeholder="Ex.: Visa final 4242" /></Field>
        <Field label="CPF/CNPJ de cobranca"><Input value={form.billingDocument} onChange={(e) => setForm({ ...form, billingDocument: e.target.value })} /></Field>
        <Field label="Endereco de cobranca"><Input value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} /></Field>
        <ToggleLine label="Permitir Pix" checked={form.pixEnabled} onCheckedChange={(pixEnabled) => setForm({ ...form, pixEnabled })} />
        <ToggleLine label="Permitir boleto" checked={form.boletoEnabled} onCheckedChange={(boletoEnabled) => setForm({ ...form, boletoEnabled })} />
      </div>
      <div className="mt-5 flex justify-end"><Button variant="accent" onClick={() => onSave(form)}>Salvar pagamento</Button></div>
    </section>
  );
}

function AddressForm({ value, role, onSave }: { value: AddressSettings; role: "buyer" | "supplier"; onSave: (value: AddressSettings) => void }) {
  const [form, setForm] = useState(value);
  const [loadingCep, setLoadingCep] = useState(false);

  async function lookupCep() {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) {
      toast.error("Informe um CEP com 8 digitos.");
      return;
    }
    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast.error("CEP nao encontrado.");
        return;
      }
      setForm((current) => ({
        ...current,
        zipCode: data.cep ?? current.zipCode,
        street: data.logradouro ?? current.street,
        district: data.bairro ?? current.district,
        city: data.localidade ?? current.city,
        state: data.uf ?? current.state,
        complement: current.complement || data.complemento || "",
      }));
      toast.success("Endereco preenchido pelo CEP");
    } catch {
      toast.error("Nao foi possivel buscar o CEP agora.");
    } finally {
      setLoadingCep(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <header className="mb-5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent/10 text-accent"><MapPin className="h-5 w-5" /></div>
        <div>
          <h2 className="text-base font-semibold">Endereco {role === "supplier" ? "de retirada" : "de entrega"}</h2>
          <p className="text-sm text-muted-foreground">{role === "supplier" ? "Local usado como referencia quando o cliente optar por retirada." : "Endereco sugerido quando uma RFQ precisar de envio."}</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do endereco"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Principal, fabrica, almoxarifado..." /></Field>
        <div className="space-y-2">
          <Label>CEP</Label>
          <div className="flex gap-2">
            <Input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} onBlur={() => { if (form.zipCode.replace(/\D/g, "").length === 8) void lookupCep(); }} />
            <Button type="button" variant="outline" onClick={lookupCep} disabled={loadingCep}>{loadingCep ? "..." : "Buscar"}</Button>
          </div>
        </div>
        <Field label="Rua / Logradouro"><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></Field>
        <Field label="Numero"><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
        <Field label="Bairro"><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></Field>
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="UF"><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Complemento"><Input value={form.complement ?? ""} onChange={(e) => setForm({ ...form, complement: e.target.value })} placeholder="Portao, doca, referencia interna..." /></Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end"><Button variant="accent" onClick={() => onSave(form)}>Salvar endereco</Button></div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function ToggleLine({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex h-10 items-center justify-between rounded-md border border-border bg-background px-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
