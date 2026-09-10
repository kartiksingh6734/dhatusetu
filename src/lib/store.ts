import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  unit: string;
  location: string;
  effectiveDate: string;
  trend: "up" | "down" | "flat";
};

/** Static presentation metadata. Prices come from the `prices` table. */
const MATERIAL_META: {
  key: MaterialKey;
  name: string;
  icon: string;
  trend: "up" | "down" | "flat";
}[] = [
  { key: "pcb", name: "PCB", icon: "▤", trend: "up" },
  { key: "cables", name: "Cables", icon: "〰", trend: "up" },
  { key: "batteries", name: "Batteries", icon: "▮", trend: "flat" },
  { key: "motors", name: "Motors", icon: "◎", trend: "down" },
  { key: "lcd", name: "LCD panels", icon: "▭", trend: "flat" },
  { key: "crt", name: "CRTs", icon: "▣", trend: "down" },
  { key: "plastics", name: "Mixed plastics", icon: "◇", trend: "flat" },
];

export const CONDITIONS = ["Clean sorted", "Mixed", "Damaged / burnt"] as const;
export type Condition = (typeof CONDITIONS)[number];

export type PriceRow = {
  min: number;
  max: number;
  unit: string;
  location: string;
  effectiveDate: string;
};

export type Recycler = {
  id: string;
  name: string;
  verified: boolean;
  authorisation: string;
  location: string;
  serviceArea: string;
  accepts: MaterialKey[];
  rateFactor: number;
  pickup: string;
  pickupAvailable: boolean;
};

export type PaymentMethod = "Cash" | "UPI";
export type PaymentStatus = "Paid" | "Pending";
export type LotStatus = "draft" | "accepted" | "handover" | "settled";

export type Lot = {
  uuid: string;
  id: string;
  materialKey: MaterialKey;
  description?: string;
  weightKg: number;
  condition: Condition;
  photo?: string;
  location?: string;
  createdAt: string;
  status: LotStatus;
  estMin?: number;
  estMax?: number;
  recyclerId?: string;
  ratePerKg?: number;
  quotedTotal?: number;
  handoverAt?: string;
  handoverLocation?: string;
  finalWeightKg?: number;
  finalRate?: number;
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
};

export type Collector = {
  id: string;
  name: string;
  location: string;
  language: string;
};

type State = {
  lang: Lang;
  online: boolean;
  loading: boolean;
  error: string | null;
  collector: Collector | null;
  prices: Partial<Record<MaterialKey, PriceRow>>;
  recyclers: Recycler[];
  lots: Lot[];
  activeLotId?: string;
};

const initial: State = {
  lang: "en",
  online: true,
  loading: true,
  error: null,
  collector: null,
  prices: {},
  recyclers: [],
  lots: [],
};

let state: State = initial;
const listeners = new Set<() => void>();
function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

function mapRecycler(r: Record<string, unknown>): Recycler {
  const status = String(r["authorization_status"] ?? "");
  const rawPickup = r["pickup_available"];
  const pickup =
    typeof rawPickup === "boolean"
      ? rawPickup
        ? "Pickup available"
        : "Self drop-off"
      : String(rawPickup ?? "");
  return {
    id: String(r["id"]),
    name: String(r["name"]),
    verified: !/pending|unverified/i.test(status),
    authorisation: status,
    location: String(r["location"] ?? ""),
    serviceArea: String(r["service_area"] ?? ""),
    accepts: ((r["materials_accepted"] as string[]) ?? []) as MaterialKey[],
    rateFactor: Number(r["offered_rate"] ?? 0.9),
    pickup,
    pickupAvailable: !/self drop/i.test(pickup),
  };
}

function mapLot(
  l: Record<string, unknown>,
  quote?: Record<string, unknown>,
  tx?: Record<string, unknown>,
): Lot {
  const lot: Lot = {
    uuid: String(l["id"]),
    id: String(l["lot_id"]),
    materialKey: String(l["material_category"]) as MaterialKey,
    weightKg: Number(l["approximate_weight"]),
    condition: String(l["condition"]) as Condition,
    createdAt: String(l["created_at"]),
    status: String(l["status"]) as LotStatus,
  };
  if (l["material_description"]) lot.description = String(l["material_description"]);
  if (l["image_url"]) lot.photo = String(l["image_url"]);
  if (l["collection_location"]) lot.location = String(l["collection_location"]);
  if (l["estimated_min_value"] != null) lot.estMin = Number(l["estimated_min_value"]);
  if (l["estimated_max_value"] != null) lot.estMax = Number(l["estimated_max_value"]);
  if (quote) {
    lot.recyclerId = String(quote["recycler_id"]);
    lot.ratePerKg = Number(quote["quoted_rate"]);
    lot.quotedTotal = Number(quote["estimated_total"]);
  }
  if (tx) {
    if (tx["recycler_id"]) lot.recyclerId = String(tx["recycler_id"]);
    if (tx["handover_timestamp"]) lot.handoverAt = String(tx["handover_timestamp"]);
    if (tx["handover_location"]) lot.handoverLocation = String(tx["handover_location"]);
    if (tx["final_weight"] != null) lot.finalWeightKg = Number(tx["final_weight"]);
    if (tx["final_price"] != null) lot.finalRate = Number(tx["final_price"]);
    if (tx["total_amount"] != null) lot.amount = Number(tx["total_amount"]);
    if (tx["payment_method"]) lot.paymentMethod = tx["payment_method"] as PaymentMethod;
    if (tx["payment_status"]) {
      lot.paymentStatus = /paid/i.test(String(tx["payment_status"])) ? "Paid" : "Pending";
    }
  }
  return lot;
}

let loadPromise: Promise<void> | null = null;

async function loadAll(): Promise<void> {
  set({ loading: true, error: null });
  try {
    const [collectorRes, priceRes, recyclerRes] = await Promise.all([
      supabase
        .from("collectors")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1),
      supabase.from("prices").select("*").order("effective_date", { ascending: false }),
      supabase.from("recyclers").select("*").order("name"),
    ]);

    if (collectorRes.error) throw collectorRes.error;
    if (priceRes.error) throw priceRes.error;
    if (recyclerRes.error) throw recyclerRes.error;

    const collectorRow = collectorRes.data?.[0];
    const collector: Collector | null = collectorRow
      ? {
          id: String(collectorRow.id),
          name: String(collectorRow.name),
          location: String(collectorRow.operating_location ?? ""),
          language: String(collectorRow.preferred_language ?? "en"),
        }
      : null;

    const prices: Partial<Record<MaterialKey, PriceRow>> = {};
    for (const p of priceRes.data ?? []) {
      const key = String(p.material_category) as MaterialKey;
      if (prices[key]) continue; // first row wins (most recent effective date)
      prices[key] = {
        min: Number(p.buying_price_min),
        max: Number(p.buying_price_max),
        unit: String(p.unit ?? "kg"),
        location: String(p.location ?? "General"),
        effectiveDate: String(p.effective_date),
      };
    }

    const recyclers = (recyclerRes.data ?? []).map((r) =>
      mapRecycler(r as unknown as Record<string, unknown>),
    );

    set({ collector, prices, recyclers, error: null });
    if (collector) await loadLots(collector.id);
    set({ loading: false });
  } catch (e) {
    set({ loading: false, error: readableError(e) });
  }
}

async function loadLots(collectorId: string) {
  const [lotRes, quoteRes, txRes] = await Promise.all([
    supabase
      .from("lots")
      .select("*")
      .eq("collector_id", collectorId)
      .order("created_at", { ascending: false }),
    supabase.from("quotes").select("*").eq("status", "accepted"),
    supabase.from("transactions").select("*").eq("collector_id", collectorId),
  ]);
  if (lotRes.error) throw lotRes.error;
  if (quoteRes.error) throw quoteRes.error;
  if (txRes.error) throw txRes.error;

  const quotes = new Map<string, Record<string, unknown>>();
  for (const q of quoteRes.data ?? [])
    quotes.set(String(q.lot_id), q as unknown as Record<string, unknown>);
  const txs = new Map<string, Record<string, unknown>>();
  for (const t of txRes.data ?? [])
    txs.set(String(t.lot_id), t as unknown as Record<string, unknown>);

  set({
    lots: (lotRes.data ?? []).map((l) =>
      mapLot(
        l as unknown as Record<string, unknown>,
        quotes.get(String(l.id)),
        txs.get(String(l.id)),
      ),
    ),
  });
}

export function readableError(e: unknown): string {
  if (typeof e === "object" && e && "message" in e) return String((e as Error).message);
  return "Something went wrong. Please try again.";
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export const store = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,
  setLang: (lang: Lang) => set({ lang }),
  setOnline: (online: boolean) => set({ online }),
  toggleOnline: () => set({ online: !state.online }),
  setActive: (id: string) => set({ activeLotId: id }),

  init() {
    if (!loadPromise) loadPromise = loadAll();
    return loadPromise;
  },
  async refresh() {
    loadPromise = loadAll();
    return loadPromise;
  },

  async createLot(input: {
    materialKey: MaterialKey;
    weightKg: number;
    condition: Condition;
    description?: string;
    photo?: string;
    location?: string;
  }): Promise<Lot> {
    const collector = state.collector;
    if (!collector) throw new Error("Collector profile is not loaded yet.");
    const m = material(input.materialKey);
    const { data, error } = await supabase
      .from("lots")
      .insert({
        lot_id: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
        collector_id: collector.id,
        material_category: input.materialKey,
        material_description: input.description ?? null,
        image_url: input.photo ?? null,
        approximate_weight: input.weightKg,
        condition: input.condition,
        estimated_min_value: Math.round(m.min * input.weightKg),
        estimated_max_value: Math.round(m.max * input.weightKg),
        status: "draft",
        collection_location: input.location ?? collector.location,
      })
      .select("*")
      .single();
    if (error) throw error;
    const lot = mapLot(data as unknown as Record<string, unknown>);
    set({ lots: [lot, ...state.lots], activeLotId: lot.id });
    return lot;
  },

  /** Accept a recycler offer. Safe to call twice — one accepted quote per lot+recycler. */
  async acceptOffer(lotUuid: string, recyclerId: string, rate: number, total: number) {
    const { data: existing, error: findErr } = await supabase
      .from("quotes")
      .select("id")
      .eq("lot_id", lotUuid)
      .eq("recycler_id", recyclerId)
      .maybeSingle();
    if (findErr) throw findErr;

    const row = {
      quoted_rate: rate,
      estimated_total: total,
      status: "accepted",
    };
    const { error: qErr } = existing
      ? await supabase.from("quotes").update(row).eq("id", existing.id)
      : await supabase
          .from("quotes")
          .insert({ ...row, lot_id: lotUuid, recycler_id: recyclerId });
    if (qErr) throw qErr;

    const { error: lErr } = await supabase
      .from("lots")
      .update({ status: "accepted" })
      .eq("id", lotUuid);
    if (lErr) throw lErr;

    patch(lotUuid, {
      recyclerId,
      ratePerKg: rate,
      quotedTotal: total,
      status: "accepted",
    });
  },

  /** Confirm handover. Idempotent — one transaction row per lot. */
  async confirmHandover(lotUuid: string) {
    const collector = state.collector;
    const lot = state.lots.find((l) => l.uuid === lotUuid);
    if (!collector || !lot) throw new Error("Lot not found.");
    const at = new Date().toISOString();
    await writeTransaction(lotUuid, {
      collector_id: collector.id,
      recycler_id: lot.recyclerId ?? null,
      final_weight: lot.weightKg,
      final_price: lot.ratePerKg ?? 0,
      total_amount: lot.quotedTotal ?? 0,
      payment_status: "Pending",
      handover_timestamp: at,
      handover_location: lot.location ?? collector.location,
    });

    const { error: lErr } = await supabase
      .from("lots")
      .update({ status: "handover" })
      .eq("id", lotUuid);
    if (lErr) throw lErr;

    patch(lotUuid, {
      status: "handover",
      handoverAt: at,
      handoverLocation: lot.location ?? collector.location,
    });
  },

  /** Record a prototype payment against the lot's single transaction row. */
  async savePayment(
    lotUuid: string,
    p: {
      weightKg: number;
      rate: number;
      method: PaymentMethod;
      status: PaymentStatus;
    },
  ) {
    const collector = state.collector;
    const lot = state.lots.find((l) => l.uuid === lotUuid);
    if (!collector || !lot) throw new Error("Lot not found.");
    const amount = Math.round(p.weightKg * p.rate);
    const at = lot.handoverAt ?? new Date().toISOString();
    await writeTransaction(lotUuid, {
      collector_id: collector.id,
      recycler_id: lot.recyclerId ?? null,
      final_weight: p.weightKg,
      final_price: p.rate,
      total_amount: amount,
      payment_method: p.method,
      payment_status: p.status,
      handover_timestamp: at,
      handover_location: lot.handoverLocation ?? lot.location ?? collector.location,
    });

    const { error: lErr } = await supabase
      .from("lots")
      .update({ status: "settled" })
      .eq("id", lotUuid);
    if (lErr) throw lErr;

    patch(lotUuid, {
      status: "settled",
      handoverAt: at,
      finalWeightKg: p.weightKg,
      finalRate: p.rate,
      amount,
      paymentMethod: p.method,
      paymentStatus: p.status,
    });
    await syncCollectorTotals();
  },
};

/**
 * Write the single transaction row for a lot. Repeated taps update the same
 * row instead of creating a duplicate.
 */
async function writeTransaction(
  lotUuid: string,
  row: {
    collector_id: string;
    recycler_id: string | null;
    final_weight: number;
    final_price: number;
    total_amount: number;
    payment_method?: string;
    payment_status: string;
    handover_timestamp: string;
    handover_location: string | null;
  },
) {
  const { data: existing, error: findErr } = await supabase
    .from("transactions")
    .select("id")
    .eq("lot_id", lotUuid)
    .maybeSingle();
  if (findErr) throw findErr;

  const { error } = existing
    ? await supabase.from("transactions").update(row).eq("id", existing.id)
    : await supabase.from("transactions").insert({ ...row, lot_id: lotUuid });
  if (error) throw error;
}

function patch(lotUuid: string, p: Partial<Lot>) {
  set({
    lots: state.lots.map((l) => (l.uuid === lotUuid ? { ...l, ...p } : l)),
  });
}

/** Keep the collector's cached totals in step with the transaction rows. */
async function syncCollectorTotals() {
  const collector = state.collector;
  if (!collector) return;
  const { total, paid, pending } = totals(state.lots);
  await supabase
    .from("collectors")
    .update({ total_earnings: total, paid_amount: paid, pending_amount: pending })
    .eq("id", collector.id);
}

/* ------------------------------------------------------------------ */
/* Selectors & helpers                                                 */
/* ------------------------------------------------------------------ */

export function material(key: MaterialKey): Material {
  const meta = MATERIAL_META.find((m) => m.key === key) ?? MATERIAL_META[0]!;
  const p = state.prices[key];
  return {
    ...meta,
    min: p?.min ?? 0,
    max: p?.max ?? 0,
    unit: p?.unit ?? "kg",
    location: p?.location ?? "General",
    effectiveDate: p?.effectiveDate ?? "",
  };
}

export function allMaterials(): Material[] {
  return MATERIAL_META.map((m) => material(m.key));
}

export function useStore() {
  return useSyncExternalStore(store.subscribe, store.get, () => initial);
}

export function useLot(id?: string) {
  const s = useStore();
  return s.lots.find((l) => l.id === (id ?? s.activeLotId));
}

export function recycler(id?: string) {
  return state.recyclers.find((r) => r.id === id);
}

export function offerFor(r: Recycler, m: Material, weight: number) {
  const rate = Math.round(((m.min + m.max) / 2) * r.rateFactor);
  return { rate, total: Math.round(rate * weight) };
}

/** Ranking: authorised first, then pickup, then rate. */
export function rankRecyclers(list: Recycler[], m: Material, weight: number) {
  return [...list].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a.pickupAvailable !== b.pickupAvailable) return a.pickupAvailable ? -1 : 1;
    return offerFor(b, m, weight).rate - offerFor(a, m, weight).rate;
  });
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
