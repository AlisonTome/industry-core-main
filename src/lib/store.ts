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
  projectId?: string;
  projectLinks?: Record<string, string | undefined>;
  part: string;
  qty: number;
  due: string;
  process: string;
  material?: string;
  description?: string;
  deliveryMode?: "Retirada" | "Envio";
  deliveryAddress?: string;
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
  basePrice?: number;
  freightValue?: number;
  chargeFreight?: boolean;
  leadTimeDays: number;
  notes?: string;
  status: ProposalStatus;
  createdAt: string;
};

export type Contract = {
  id: string;
  rfqId: string;
  proposalId: string;
  buyerEmail?: string;
  supplier: string;
  value: number;
  startedAt: string;
  status: "Em execução" | "Concluído" | "Cancelado";
  paymentStatus?: PaymentStatus;
  paidAt?: string;
  deliveryReportedAt?: string;
  releasedAt?: string;
  refundRequestedAt?: string;
  refundedAt?: string;
  disputedAt?: string;
  refundReason?: string;
  disputeReason?: string;
  cancellationStatus?: "Solicitado" | "Aceito" | "Recusado";
  cancellationRequestedAt?: string;
  cancellationRespondedAt?: string;
  cancellationReason?: string;
  cancellationMessages?: ContractMessage[];
  updatedAt?: string;
};

export type ContractMessage = {
  authorRole: "buyer" | "supplier";
  authorName: string;
  body: string;
  createdAt: string;
};

export type PaymentStatus = "Aguardando pagamento" | "Pago em escrow" | "Entrega informada" | "Liberado" | "Reembolso solicitado" | "Reembolsado" | "Em disputa";

export type SupplierReceivingSettings = {
  ownerEmail: string;
  bankName: string;
  agency: string;
  account: string;
  accountType: "Corrente" | "Poupanca" | "Pagamento";
  document: string;
  pixKey: string;
  payoutMethod: "Pix" | "Transferencia bancaria";
  verified: boolean;
  updatedAt?: string;
};

export type BuyerPaymentSettings = {
  ownerEmail: string;
  defaultMethod: "Cartao" | "Pix" | "Boleto";
  cardLabel: string;
  billingDocument: string;
  billingAddress: string;
  pixEnabled: boolean;
  boletoEnabled: boolean;
  updatedAt?: string;
};

export type AddressSettings = {
  ownerEmail: string;
  label: string;
  zipCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string;
  updatedAt?: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  ownerEmail?: string;
  ownerCompany?: string;
  ownerRole?: "buyer" | "supplier";
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
  createdAt?: string;
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
  recipientRole?: "buyer" | "supplier";
  recipientEmail?: string;
  recipientCompany?: string;
  readAt?: string;
  createdAt: string;
};

export type StoreUser = {
  email: string;
  company: string;
  role: "buyer" | "supplier";
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
  supplierReceiving: "nf.supplierReceiving",
  buyerPayments: "nf.buyerPayments",
  addresses: "nf.addresses",
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
      { id: "CT-1188", rfqId: "RFQ-2835", proposalId: "PRP-003", buyerEmail: "demo@nexforge.com", supplier: "Usinagem Vidal", value: 32100, startedAt: new Date().toISOString(), status: "Em execução", paymentStatus: "Pago em escrow", paidAt: new Date().toISOString() },
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
  const seededNotifications = read<Notification[]>(K.notifications, []);
  if (seededNotifications.some((n) => !n.recipientRole && !n.recipientEmail && !n.recipientCompany)) {
    write(
      K.notifications,
      seededNotifications.map((n) => {
        if (n.id === "N-1") return { ...n, recipientRole: "supplier", recipientCompany: "Usinagem Vidal" };
        if (n.id === "N-2") return { ...n, recipientRole: "buyer", recipientEmail: "demo@nexforge.com" };
        if (n.id === "N-3") return { ...n, recipientRole: "supplier" };
        return { ...n, recipientRole: "buyer" };
      }),
    );
  }
  const seededRfqs = read<Rfq[]>(K.rfqs, []);
  if (seededRfqs.some((r) => !r.projectId)) {
    write(
      K.rfqs,
      seededRfqs.map((r, index) => ({
        ...r,
        projectId: r.projectId ?? inferProjectId(r, index),
      })),
    );
  }
  const rfqsWithDelivery = read<Rfq[]>(K.rfqs, []);
  if (rfqsWithDelivery.some((r) => !r.deliveryMode)) {
    write(
      K.rfqs,
      rfqsWithDelivery.map((r) => ({
        ...r,
        deliveryMode: r.deliveryMode ?? "Retirada",
      })),
    );
  }
  const seededProjects = read<Project[]>(K.projects, []);
  if (seededProjects.some((p) => !p.ownerEmail || !p.ownerCompany || !p.ownerRole)) {
    write(
      K.projects,
      seededProjects.map((p) => ({
        ...p,
        ownerEmail: p.ownerEmail ?? "demo@nexforge.com",
        ownerCompany: p.ownerCompany ?? "NexForge Demo",
        ownerRole: p.ownerRole ?? "buyer",
      })),
    );
  }
  const seededContracts = read<Contract[]>(K.contracts, []);
  if (seededContracts.some((c) => !c.paymentStatus || !c.buyerEmail)) {
    const rfqs = read<Rfq[]>(K.rfqs, []);
    write(
      K.contracts,
      seededContracts.map((c) => {
        const rfq = rfqs.find((r) => r.id === c.rfqId);
        return {
          ...c,
          buyerEmail: c.buyerEmail ?? rfq?.ownerEmail ?? "demo@nexforge.com",
          paymentStatus: c.paymentStatus ?? (c.status === "Concluído" ? "Liberado" : "Aguardando pagamento"),
        };
      }),
    );
  }
}

function inferProjectId(rfq: Rfq, index: number) {
  if (rfq.id === "RFQ-2847" || rfq.id === "RFQ-2846" || rfq.id === "RFQ-2841") return "PRJ-21";
  if (rfq.id === "RFQ-2839") return "PRJ-19";
  if (rfq.id === "RFQ-2835") return "PRJ-15";
  const projects = ["PRJ-21", "PRJ-19", "PRJ-15"];
  return projects[index % projects.length];
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

export function ensureSupplierProfile(company: string) {
  const name = company.trim();
  if (!name) return;
  const suppliers = read<Supplier[]>(K.suppliers, []);
  if (suppliers.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;

  const next: Supplier = {
    id: uid("S"),
    name,
    city: "Cadastro pendente",
    processes: ["Cadastro pendente"],
    rating: 0,
    verified: false,
    createdAt: new Date().toISOString(),
  };
  write(K.suppliers, [next, ...suppliers]);
}

export function getSupplierCreatedAt(user?: StoreUser | null) {
  if (user?.role !== "supplier") return undefined;
  const suppliers = read<Supplier[]>(K.suppliers, []);
  return suppliers.find((s) => s.name.toLowerCase() === user.company.toLowerCase())?.createdAt;
}

export function isRfqVisibleToUser(rfq: Rfq, user?: StoreUser | null) {
  if (!user) return false;
  if (user.role === "buyer") return rfq.ownerEmail.toLowerCase() === user.email.toLowerCase();

  const supplierCreatedAt = getSupplierCreatedAt(user);
  if (!supplierCreatedAt) return true;
  return new Date(rfq.createdAt).getTime() >= new Date(supplierCreatedAt).getTime();
}

export function visibleRfqsForUser(rfqs: Rfq[], user?: StoreUser | null) {
  return rfqs.filter((rfq) => isRfqVisibleToUser(rfq, user));
}

export function projectOwnerKey(user?: StoreUser | null) {
  if (!user) return "";
  return `${user.role}:${user.role === "buyer" ? user.email.toLowerCase() : user.company.toLowerCase()}`;
}

export function getRfqProjectId(rfq: Rfq, user?: StoreUser | null) {
  if (!user) return rfq.projectId;
  const key = projectOwnerKey(user);
  return rfq.projectLinks?.[key] ?? (user.role === "buyer" ? rfq.projectId : undefined);
}

export function isProjectVisibleToUser(project: Project, user?: StoreUser | null) {
  if (!user) return false;
  if (!project.ownerEmail && !project.ownerCompany && !project.ownerRole) return true;
  if (project.ownerRole && project.ownerRole !== user.role) return false;
  if (project.ownerEmail && project.ownerEmail.toLowerCase() === user.email.toLowerCase()) return true;
  if (project.ownerCompany && project.ownerCompany.toLowerCase() === user.company.toLowerCase()) return true;
  return false;
}

export function visibleProjectsForUser(projects: Project[], user?: StoreUser | null) {
  return projects.filter((project) => isProjectVisibleToUser(project, user));
}

export function isNotificationVisibleToUser(notification: Notification, user?: StoreUser | null) {
  if (!user) return false;
  if (notification.recipientRole && notification.recipientRole !== user.role) return false;
  if (notification.recipientEmail && notification.recipientEmail.toLowerCase() !== user.email.toLowerCase()) return false;
  if (notification.recipientCompany && notification.recipientCompany.toLowerCase() !== user.company.toLowerCase()) return false;

  if (user.role === "supplier" && notification.recipientRole === "supplier" && !notification.recipientCompany) {
    const supplierCreatedAt = getSupplierCreatedAt(user);
    if (supplierCreatedAt && new Date(notification.createdAt).getTime() < new Date(supplierCreatedAt).getTime()) return false;
  }

  return Boolean(notification.recipientRole || notification.recipientEmail || notification.recipientCompany);
}

export function visibleNotificationsForUser(notifications: Notification[], user?: StoreUser | null) {
  return notifications.filter((notification) => isNotificationVisibleToUser(notification, user));
}
