import { PageHeader } from "@/components/dashboard/PageHeader";
import { MapPoint, MapPreview } from "@/components/dashboard/MapPreview";
import { useAuth } from "@/contexts/AuthContext";
import { AddressSettings, useLocal, K, Supplier } from "@/lib/store";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";

type RadiusFilter = "all" | "city" | "state";
type StoredUser = { email: string; company: string; role: "buyer" | "supplier" };

function splitCityState(value: string) {
  const [city = "", state = ""] = value.split("/");
  return { city: city.trim().toLowerCase(), state: state.trim().toLowerCase() };
}

function formatAddress(address?: AddressSettings) {
  if (!address?.city || !address?.state) return "";
  const street = [address.street, address.number].filter(Boolean).join(", ");
  const district = address.district ? ` - ${address.district}` : "";
  const zipCode = address.zipCode ? `, ${address.zipCode}` : "";
  return `${street || address.city}${district}, ${address.city}, ${address.state}${zipCode}, Brasil`;
}

export default function Fornecedores() {
  const { user } = useAuth();
  const [suppliers] = useLocal<Supplier[]>(K.suppliers, []);
  const [addresses] = useLocal<AddressSettings[]>(K.addresses, []);
  const [users] = useLocal<StoredUser[]>(K.users, []);
  const [q, setQ] = useState("");
  const [radius, setRadius] = useState<RadiusFilter>("all");
  const myAddress = addresses.find((a) => a.ownerEmail === user?.email);
  const myCity = myAddress?.city.trim().toLowerCase() ?? "";
  const myState = myAddress?.state.trim().toLowerCase() ?? "";
  const mapQuery = myAddress ? `${myAddress.street} ${myAddress.number}, ${myAddress.city}, ${myAddress.state}, Brasil` : "Brasil";

  const enrichedSuppliers = useMemo(
    () =>
      suppliers.map((supplier) => {
        const supplierUser = users.find((u) => u.role === "supplier" && u.company.toLowerCase() === supplier.name.toLowerCase());
        const address = supplierUser ? addresses.find((a) => a.ownerEmail.toLowerCase() === supplierUser.email.toLowerCase()) : undefined;
        const city = address?.city && address?.state ? `${address.city}/${address.state}` : supplier.city;
        const processes = supplier.processes.filter((process) => process !== "Cadastro pendente");
        return {
          ...supplier,
          city,
          mapLocation: formatAddress(address) || `${city}, Brasil`,
          processes: processes.length ? processes : ["Cadastro pendente"],
          hasAddress: Boolean(address?.city && address?.state),
        };
      }),
    [addresses, suppliers, users],
  );

  const list = useMemo(
    () =>
      enrichedSuppliers.filter((s) => {
        const place = splitCityState(s.city);
        if (radius === "city" && (!myCity || place.city !== myCity)) return false;
        if (radius === "state" && (!myState || place.state !== myState)) return false;
        return `${s.name} ${s.city} ${s.processes.join(" ")}`.toLowerCase().includes(q.toLowerCase());
      }),
    [enrichedSuppliers, myCity, myState, q, radius],
  );
  const mapPoints: MapPoint[] = list
    .filter((s) => s.city && s.city !== "Cadastro pendente")
    .map((s) => ({ id: s.id, label: s.name, location: s.mapLocation }));

  return (
    <>
      <PageHeader title="Fornecedores" description="Rede de fornecedores qualificados NexForge." />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
        <Input placeholder="Buscar por nome, cidade, processo..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="space-y-2">
          <Label className="text-xs">Proximidade</Label>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={radius} onChange={(e) => setRadius(e.target.value as RadiusFilter)}>
            <option value="all">Todos</option>
            <option value="city">Minha cidade</option>
            <option value="state">Meu estado</option>
          </select>
        </div>
      </div>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-semibold">Busca por proximidade</p>
              <p className="text-xs text-muted-foreground">{myAddress ? `${myAddress.city}/${myAddress.state}` : "Cadastre seu endereco em Configuracoes para usar filtros locais."}</p>
            </div>
          </div>
        </div>
        <MapPreview title="Fornecedores filtrados" emptyMessage="Nenhum fornecedor filtrado com endereco localizado." points={mapPoints.length ? mapPoints : [{ id: "me", label: "Seu endereco", location: mapQuery }]} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <article key={s.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-1.5">{s.name}{s.verified && <BadgeCheck className="h-4 w-4 text-accent" />}</h3>
                <p className="text-xs text-muted-foreground">{s.city}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-foreground"><Star className="h-3.5 w-3.5 fill-warning text-warning" />{s.rating}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.processes.map((p) => <span key={p} className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground">{p}</span>)}
              {s.hasAddress && <span className="rounded bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">Endereco cadastrado</span>}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
