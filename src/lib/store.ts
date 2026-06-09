import { useEffect, useState } from "react";

type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

function notify(key: string) {
  listeners[key]?.forEach((l) => l());
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  notify(key);
}

export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read<T>(key, initial));
  useEffect(() => {
    listeners[key] ??= new Set();
    const l = () => setValue(read<T>(key, initial));
    listeners[key].add(l);
    return () => {
      listeners[key].delete(l);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = (v: T | ((prev: T) => T)) => {
    const next = typeof v === "function" ? (v as (p: T) => T)(read<T>(key, initial)) : v;
    write(key, next);
  };
  return [value, set] as const;
}

// ===== Domain types =====
export type RfqStatus = "Aberta" | "Em análise" | "Adjudicada" | "Cancelada";
export type Rfq = {
  id: string;
  part: string;
  qty: number;
  due: string;
  process: string;
  material?: string;
  description?: string;
  status: RfqStatus;
  createdAt: string;
  ownerEmail: string;
};

export type ProposalStatus = "Recebida" | "Aprovada" | "Recusada";
export type Proposal = {
  id: string;
  rfqId: string;
  supplier: string;
  price: number;
  leadTimeDays: number;
  notes?: string;
  status: ProposalStatus;
  createdAt: string;
};

export type Contract = {
  id: string;
  rfqId: string;
  proposalId: string;
  supplier: string;
  value: number;
  startedAt: string;
  status: "Em execução" | "Concluído" | "Cancelado";
};

export type Project = {
  id: string;
  name: string;
  client: string;
  status: "Planejamento" | "Em andamento" | "Concluído";
  rfqs: number;
  startedAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  city: string;
  processes: string[];
  rating: number;
  verified: boolean;
};

export type Buyer = {
  id: string;
  name: string;
  sector: string;
  city: string;
  activeRfqs: number;
};

export type Notification = {
  id: string;
  title: string;
  body?: string;
  type: "info" | "success" | "warning";
  readAt?: string;
  createdAt: string;
};

// ===== Keys =====
export const K = {
  rfqs: "nf.rfqs",
  proposals: "nf.proposals",
  contracts: "nf.contracts",
  projects: "nf.projects",
  suppliers: "nf.suppliers",
  buyers: "nf.buyers",
  notifications: "nf.notifications",
  users: "nf.users",
  session: "nf.session",
} as const;

// ===== Seeding =====
function uid(prefix: string) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function seedIfEmpty() {
  if (!localStorage.getItem(K.rfqs)) {
    const rfqs: Rfq[] = [
      { id: "RFQ-2847", part: "Flange ASTM A350 LF2", qty: 120, due: "2026-06-10", process: "Usinagem CNC", material: "Aço carbono", status: "Em análise", createdAt: new Date().toISOString(), ownerEmail: "demo@nexforge.com" },
      { id: "RFQ-2846", part: "Suporte estrutural soldado", qty: 30, due: "2026-06-12", process: "Caldeiraria", material: "Aço A36", status: "Aberta", createdAt: new Date().toISOString(), ownerEmail: "demo@nexforge.com" },
      { id: "RFQ-2841", part: "Carcaça em alumínio fundido", qty: 500, due: "2026-06-18", process: "Fundição", material: "Alumínio", status: "Em análise", createdAt: new Date().toISOString(), ownerEmail: "demo@nexforge.com" },
      { id: "RFQ-2839", part: "Tampa chapa 3 mm", qty: 1000, due: "2026-06-20", process: "Corte a laser", material: "Aço inox 304", status: "Aberta", createdAt: new Date().toISOString(), ownerEmail: "demo@nexforge.com" },
      { id: "RFQ-2835", part: "Eixo de transmissão", qty: 80, due: "2026-06-27", process: "Usinagem CNC", material: "Aço 4140", status: "Adjudicada", createdAt: new Date().toISOString(), ownerEmail: "demo@nexforge.com" },
    ];
    write(K.rfqs, rfqs);
  }
  if (!localStorage.getItem(K.proposals)) {
    const proposals: Proposal[] = [
      { id: "PRP-001", rfqId: "RFQ-2847", supplier: "Usinagem Vidal", price: 18450, leadTimeDays: 22, status: "Recebida", createdAt: new Date().toISOString() },
      { id: "PRP-002", rfqId: "RFQ-2847", supplier: "MetalForge SA", price: 17900, leadTimeDays: 28, status: "Recebida", createdAt: new Date().toISOString() },
      { id: "PRP-003", rfqId: "RFQ-2835", supplier: "Usinagem Vidal", price: 32100, leadTimeDays: 30, status: "Aprovada", createdAt: new Date().toISOString() },
      { id: "PRP-004", rfqId: "RFQ-2846", supplier: "Caldeiraria Sul", price: 9800, leadTimeDays: 14, status: "Recebida", createdAt: new Date().toISOString() },
    ];
    write(K.proposals, proposals);
  }
  if (!localStorage.getItem(K.contracts)) {
    const contracts: Contract[] = [
      { id: "CT-1188", rfqId: "RFQ-2835", proposalId: "PRP-003", supplier: "Usinagem Vidal", value: 32100, startedAt: new Date().toISOString(), status: "Em execução" },
    ];
    write(K.contracts, contracts);
  }
  if (!localStorage.getItem(K.projects)) {
    const projects: Project[] = [
      { id: "PRJ-21", name: "Linha de envase 2026", client: "Indutec Manufatura", status: "Em andamento", rfqs: 6, startedAt: "2026-04-12" },
      { id: "PRJ-19", name: "Retrofit prensa hidráulica", client: "Indutec Manufatura", status: "Planejamento", rfqs: 2, startedAt: "2026-05-20" },
      { id: "PRJ-15", name: "Skid de bombeamento", client: "PetroSer", status: "Concluído", rfqs: 9, startedAt: "2026-01-08" },
    ];
    write(K.projects, projects);
  }
  if (!localStorage.getItem(K.suppliers)) {
    const suppliers: Supplier[] = [
      { id: "S-001", name: "Usinagem Vidal", city: "Caxias do Sul/RS", processes: ["Usinagem CNC", "Torneamento"], rating: 4.8, verified: true },
      { id: "S-002", name: "MetalForge SA", city: "Joinville/SC", processes: ["Fundição", "Usinagem CNC"], rating: 4.6, verified: true },
      { id: "S-003", name: "Caldeiraria Sul", city: "Porto Alegre/RS", processes: ["Caldeiraria", "Solda"], rating: 4.5, verified: true },
      { id: "S-004", name: "Laser Prime", city: "São Bernardo/SP", processes: ["Corte a laser", "Dobra"], rating: 4.7, verified: true },
      { id: "S-005", name: "Aditiva 3D", city: "Campinas/SP", processes: ["Manufatura aditiva"], rating: 4.4, verified: false },
    ];
    write(K.suppliers, suppliers);
  }
  if (!localStorage.getItem(K.buyers)) {
    const buyers: Buyer[] = [
      { id: "B-01", name: "Indutec Manufatura", sector: "Bens de capital", city: "São Paulo/SP", activeRfqs: 12 },
      { id: "B-02", name: "PetroSer Engenharia", sector: "Óleo & gás", city: "Macaé/RJ", activeRfqs: 5 },
      { id: "B-03", name: "AgroFort Equipamentos", sector: "Agro", city: "Cascavel/PR", activeRfqs: 3 },
    ];
    write(K.buyers, buyers);
  }
  if (!localStorage.getItem(K.notifications)) {
    const notifications: Notification[] = [
      { id: "N-1", title: "Proposta aprovada", body: "Usinagem Vidal — RFQ-2835", type: "success", createdAt: new Date(Date.now() - 12 * 60_000).toISOString() },
      { id: "N-2", title: "Nova cotação recebida", body: "RFQ-2847 (12ª proposta)", type: "info", createdAt: new Date(Date.now() - 60 * 60_000).toISOString() },
      { id: "N-3", title: "RFQ encerra em 36h", body: "RFQ-2839 — Tampa chapa 3 mm", type: "warning", createdAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString() },
    ];
    write(K.notifications, notifications);
  }
}

export function newId(prefix = "RFQ") {
  const all = read<Rfq[]>(K.rfqs, []);
  const max = all
    .map((r) => parseInt(r.id.replace(/\D/g, ""), 10) || 0)
    .reduce((a, b) => Math.max(a, b), 2847);
  return `${prefix}-${max + 1}`;
}

export function pushNotification(n: Omit<Notification, "id" | "createdAt">) {
  const list = read<Notification[]>(K.notifications, []);
  const next: Notification = { ...n, id: uid("N"), createdAt: new Date().toISOString() };
  write(K.notifications, [next, ...list]);
}
