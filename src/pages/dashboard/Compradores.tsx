import { PageHeader } from "@/components/dashboard/PageHeader";
import { MapPoint, MapPreview } from "@/components/dashboard/MapPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AddressSettings, Buyer, K, useLocal } from "@/lib/store";
import { MapPin } from "lucide-react";
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

export default function Compradores() {
  const { user } = useAuth();
  const [buyers] = useLocal<Buyer[]>(K.buyers, []);
  const [addresses] = useLocal<AddressSettings[]>(K.addresses, []);
  const [users] = useLocal<StoredUser[]>(K.users, []);
  const [q, setQ] = useState("");
  const [radius, setRadius] = useState<RadiusFilter>("all");
  const myAddress = addresses.find((a) => a.ownerEmail === user?.email);
  const myCity = myAddress?.city.trim().toLowerCase() ?? "";
  const myState = myAddress?.state.trim().toLowerCase() ?? "";
  const mapQuery = myAddress ? `${myAddress.street} ${myAddress.number}, ${myAddress.city}, ${myAddress.state}, Brasil` : "Brasil";

  const enrichedBuyers = useMemo(() => {
    const localBuyers = users
      .filter((u) => u.role === "buyer")
      .map((u) => {
        const address = addresses.find((a) => a.ownerEmail.toLowerCase() === u.email.toLowerCase());
        const existing = buyers.find((b) => b.name.toLowerCase() === u.company.toLowerCase());
        return {
          id: existing?.id ?? `LOCAL-${u.email}`,
          name: u.company,
          sector: existing?.sector ?? "Cadastro local",
          city: address?.city && address?.state ? `${address.city}/${address.state}` : existing?.city ?? "Cadastro pendente",
          mapLocation: formatAddress(address) || `${existing?.city ?? "Brasil"}, Brasil`,
          activeRfqs: existing?.activeRfqs ?? 0,
          hasAddress: Boolean(address?.city && address?.state),
        };
      });
    const seededOnly = buyers
      .filter((b) => !localBuyers.some((local) => local.name.toLowerCase() === b.name.toLowerCase()))
      .map((b) => ({ ...b, mapLocation: `${b.city}, Brasil`, hasAddress: false }));
    return [...localBuyers, ...seededOnly];
  }, [addresses, buyers, users]);

  const list = useMemo(
    () =>
      enrichedBuyers.filter((b) => {
        const place = splitCityState(b.city);
        if (radius === "city" && (!myCity || place.city !== myCity)) return false;
        if (radius === "state" && (!myState || place.state !== myState)) return false;
        return `${b.name} ${b.sector} ${b.city}`.toLowerCase().includes(q.toLowerCase());
      }),
    [enrichedBuyers, myCity, myState, q, radius],
  );
  const mapPoints: MapPoint[] = list
    .filter((b) => b.city && b.city !== "Cadastro pendente")
    .map((b) => ({ id: b.id, label: b.name, location: b.mapLocation }));

  return (
    <>
      <PageHeader title="Compradores" description="Empresas industriais ativas na plataforma." />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
        <Input placeholder="Buscar por empresa, setor, cidade..." value={q} onChange={(e) => setQ(e.target.value)} />
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
        <MapPreview title="Compradores filtrados" emptyMessage="Nenhum comprador filtrado com endereco localizado." points={mapPoints.length ? mapPoints : [{ id: "me", label: "Seu endereco", location: mapQuery }]} />
      </section>

      <section className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Empresa</th>
              <th className="px-5 py-3">Setor</th>
              <th className="px-5 py-3">Cidade</th>
              <th className="px-5 py-3">RFQs ativas</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum comprador encontrado.</td></tr>}
            {list.map((b) => (
              <tr key={b.id} className="border-t border-border hover:bg-secondary/40">
                <td className="px-5 py-3 font-medium">{b.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{b.sector}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  <div>{b.city}</div>
                  {b.hasAddress && <span className="mt-1 inline-flex rounded bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">Endereco cadastrado</span>}
                </td>
                <td className="px-5 py-3 tabular-nums">{b.activeRfqs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
