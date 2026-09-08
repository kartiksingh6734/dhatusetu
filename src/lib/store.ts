import { useSyncExternalStore } from "react";
import type { Lang } from "./i18n";

export type MaterialKey =
  | "pcb"
  | "cables"
  | "batteries"
  | "motors"
  | "lcd"
  | "crt"
  | "plastics";

export type Material = {
  key: MaterialKey;
  name: string;
  icon: string;
  min: number;
  max: number;
  trend: "up" | "down" | "flat";
};

export const MATERIALS: Material[] = [
  { key: "pcb", name: "PCB", icon: "▤", min: 320, max: 410, trend: "up" },
  { key: "cables", name: "Cables", icon: "〰", min: 180, max: 240, trend: "up" },
  { key: "batteries", name: "Batteries", icon: "▮", min: 60, max: 95, trend: "flat" },
  { key: "motors", name: "Motors", icon: "◎", min: 70, max: 110, trend: "down" },
  { key: "lcd", name: "LCD panels", icon: "▭", min: 90, max: 140, trend: "flat" },
  { key: "crt", name: "CRTs", icon: "▣", min: 15, max: 30, trend: "down" },
  { key: "plastics", name: "Mixed plastics", icon: "◇", min: 12, max: 22, trend: "flat" },
];

export const CONDITIONS = ["Clean sorted", "Mixed", "Damaged / burnt"] as const;
export type Condition = (typeof CONDITIONS)[number];

export function material(key: MaterialKey): Material {
  return MATERIALS.find((m) => m.key === key)!;
}

export type Recycler = {
  id: string;
  name: string;
  verified: boolean;
  authorisation: string;
  distanceKm: number;
  accepts: MaterialKey[];
  rateFactor: number;
  pickup: string;
};

export const RECYCLERS: Recycler[] = [
  {
    id: "greencore",
    name: "GreenCore E-Waste",
    verified: true,
    authorisation: "CPCB Reg. MH/EW/2231",
    distanceKm: 0.8,
    accepts: ["pcb", "cables", "lcd", "motors", "batteries"],
    rateFactor: 0.98,
    pickup: "Picks today 3–6 pm",
  },
  {
    id: "omni",
    name: "OmniRecycle",
    verified: true,
    authorisation: "CPCB Reg. MH/EW/1187",
    distanceKm: 2.4,
    accepts: ["pcb", "cables", "lcd", "crt", "plastics"],
    rateFactor: 0.92,
    pickup: "Picks tomorrow",
  },
  {
    id: "ravan",
    name: "Ravan Scrap Co.",
    verified: false,
    authorisation: "Authorisation pending",
    distanceKm: 3.1,
    accepts: ["pcb", "cables", "batteries", "motors", "crt", "plastics", "lcd"],
    rateFactor: 0.86,
    pickup: "Self drop-off only",
  },
];

export type PaymentMethod = "Cash" | "UPI";
export type PaymentStatus = "Paid" | "Pending";
export type LotStatus = "draft" | "accepted" | "handover" | "settled";

export type Lot = {
  id: string;
  materialKey: MaterialKey;
  weightKg: number;
  condition: Condition;
  photo?: string;
  createdAt: string;
  status: LotStatus;
  recyclerId?: string;
  ratePerKg?: number;
  quotedTotal?: number;
  handoverAt?: string;
  finalWeightKg?: number;
  finalRate?: number;
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
};

type State = {
  lang: Lang;
  online: boolean;
  collector: string;
  lots: Lot[];
  activeLotId?: string;
};

function seedLot(
  id: string,
  materialKey: MaterialKey,
  weight: number,
  recyclerId: string,
  rate: number,
  paymentStatus: PaymentStatus,
  method: PaymentMethod,
  daysAgo: number,
): Lot {
  const at = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id,
    materialKey,
    weightKg: weight,
    condition: "Clean sorted",
    createdAt: at,
    handoverAt: at,
    status: "settled",
    recyclerId,
    ratePerKg: rate,
    quotedTotal: Math.round(weight * rate),
    finalWeightKg: weight,
    finalRate: rate,
    amount: Math.round(weight * rate),
    paymentMethod: method,
    paymentStatus,
  };
}

let state: State = {
  lang: "en",
  online: true,
  collector: "Ravi Kadam",
  lots: [
    seedLot("K-4820", "cables", 12.5, "greencore", 226, "Paid", "UPI", 1),
    seedLot("K-4816", "pcb", 9.2, "omni", 372, "Pending", "Cash", 3),
    seedLot("K-4811", "motors", 21.0, "greencore", 96, "Paid", "Cash", 6),
    seedLot("K-4803", "lcd", 7.4, "omni", 118, "Paid", "UPI", 11),
    seedLot("K-4798", "plastics", 33.5, "ravan", 17, "Paid", "Cash", 15),
  ],
};

const listeners = new Set<() => void>();
function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,
  setLang: (lang: Lang) => set({ lang }),
  toggleOnline: () => set({ online: !state.online }),
  createLot(input: {
    materialKey: MaterialKey;
    weightKg: number;
    condition: Condition;
    photo?: string;
  }) {
    const id = `K-${4821 + state.lots.filter((l) => l.id.startsWith("K-48")).length}`;
    const lot: Lot = {
      id,
      ...input,
      createdAt: new Date().toISOString(),
      status: "draft",
    };
    set({ lots: [lot, ...state.lots], activeLotId: id });
    return lot;
  },
  update(id: string, patch: Partial<Lot>) {
    set({
      lots: state.lots.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  },
  setActive: (id: string) => set({ activeLotId: id }),
};

const server = state;
export function useStore() {
  return useSyncExternalStore(
    store.subscribe,
    store.get,
    () => server,
  );
}

export function useLot(id?: string) {
  const s = useStore();
  return s.lots.find((l) => l.id === (id ?? s.activeLotId));
}

export function recycler(id?: string) {
  return RECYCLERS.find((r) => r.id === id);
}

export function offerFor(r: Recycler, m: Material, weight: number) {
  const rate = Math.round(((m.min + m.max) / 2) * r.rateFactor);
  return { rate, total: Math.round(rate * weight) };
}

export const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function totals(lots: Lot[]) {
  const settled = lots.filter((l) => l.amount != null);
  const total = settled.reduce((a, l) => a + (l.amount ?? 0), 0);
  const paid = settled
    .filter((l) => l.paymentStatus === "Paid")
    .reduce((a, l) => a + (l.amount ?? 0), 0);
  return { total, paid, pending: total - paid };
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function stamp(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
