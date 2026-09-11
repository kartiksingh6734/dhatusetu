import { supabase } from "@/integrations/supabase/client";
import type { MaterialKey } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type VerificationStatus =
  | "pending"
  | "verification_required"
  | "verified"
  | "rejected";

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  pending: "Pending Verification",
  verification_required: "Verification Required",
  verified: "Verified",
  rejected: "Rejected",
};

export type Facility = {
  id: string;
  userId: string | null;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  serviceArea: string | null;
  materials: MaterialKey[];
  pickupAvailable: boolean;
  registrationReference: string | null;
  verificationStatus: VerificationStatus;
  offeredRate: number;
};

export type LotRow = {
  uuid: string;
  lotId: string;
  materialKey: MaterialKey;
  description: string | null;
  photo: string | null;
  weightKg: number;
  condition: string;
  location: string | null;
  createdAt: string;
  status: string;
  pickupStatus: string | null;
  estMin: number | null;
  estMax: number | null;
  collectorName: string | null;
  collectorId: string | null;
};

export type QuoteRow = {
  id: string;
  lotUuid: string;
  recyclerId: string;
  rate: number;
  total: number;
  status: string;
  pickupAvailable: boolean;
  pickupAt: string | null;
  note: string | null;
  createdAt: string;
};

export type TxRow = {
  id: string;
  lotUuid: string;
  lotId: string;
  materialKey: MaterialKey;
  finalWeight: number;
  finalPrice: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  handoverAt: string;
  collectorName: string | null;
};

export const PICKUP_STATUSES = [
  "Offer Accepted",
  "Pickup Scheduled",
  "Ready for Handover",
  "Handover Completed",
  "Payment Pending",
  "Completed",
] as const;
export type PickupStatus = (typeof PICKUP_STATUSES)[number];

/* ------------------------------------------------------------------ */
/* Mapping                                                             */
/* ------------------------------------------------------------------ */

type Row = Record<string, any>;

export function mapFacility(r: Row): Facility {
  return {
    id: String(r["id"]),
    userId: r["user_id"] ? String(r["user_id"]) : null,
    name: String(r["name"]),
    contactPerson: r["contact_person"] ?? null,
    phone: r["phone"] ?? null,
    email: r["email"] ?? null,
    location: r["location"] ?? null,
    serviceArea: r["service_area"] ?? null,
    materials: ((r["materials_accepted"] as string[]) ?? []) as MaterialKey[],
    pickupAvailable: Boolean(r["pickup_available"]),
    registrationReference: r["registration_reference"] ?? null,
    verificationStatus: (r["verification_status"] ?? "pending") as VerificationStatus,
    offeredRate: Number(r["offered_rate"] ?? 0.9),
  };
}

function mapLot(r: Row): LotRow {
  const c = r["collectors"] as Row | null | undefined;
  return {
    uuid: String(r["id"]),
    lotId: String(r["lot_id"]),
    materialKey: String(r["material_category"]) as MaterialKey,
    description: r["material_description"] ?? null,
    photo: r["image_url"] ?? null,
    weightKg: Number(r["approximate_weight"]),
    condition: String(r["condition"] ?? ""),
    location: r["collection_location"] ?? null,
    createdAt: String(r["created_at"]),
    status: String(r["status"]),
    pickupStatus: r["pickup_status"] ?? null,
    estMin: r["estimated_min_value"] != null ? Number(r["estimated_min_value"]) : null,
    estMax: r["estimated_max_value"] != null ? Number(r["estimated_max_value"]) : null,
    collectorName: c?.["name"] ? String(c["name"]) : null,
    collectorId: r["collector_id"] ? String(r["collector_id"]) : null,
  };
}

function mapQuote(r: Row): QuoteRow {
  return {
    id: String(r["id"]),
    lotUuid: String(r["lot_id"]),
    recyclerId: String(r["recycler_id"]),
    rate: Number(r["quoted_rate"]),
    total: Number(r["estimated_total"]),
    status: String(r["status"]),
    pickupAvailable: r["pickup_available"] !== false,
    pickupAt: r["pickup_at"] ?? null,
    note: r["note"] ?? null,
    createdAt: String(r["created_at"]),
  };
}

/* ------------------------------------------------------------------ */
/* Facility                                                            */
/* ------------------------------------------------------------------ */

export async function getMyFacility(userId: string): Promise<Facility | null> {
  const { data, error } = await supabase
    .from("recyclers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFacility(data as Row) : null;
}

export type FacilityInput = {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  serviceArea: string;
  materials: MaterialKey[];
  pickupAvailable: boolean;
  registrationReference: string;
};

export async function createFacility(userId: string, input: FacilityInput) {
  const { data, error } = await supabase
    .from("recyclers")
    .insert({
      user_id: userId,
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      email: input.email,
      location: input.location,
      service_area: input.serviceArea,
      materials_accepted: input.materials,
      pickup_available: input.pickupAvailable,
      registration_reference: input.registrationReference || null,
      authorization_status: input.registrationReference
        ? "Registration reference provided — not verified by DhatuSetu"
        : "Registration Required",
      verification_status: input.registrationReference ? "pending" : "verification_required",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapFacility(data as Row);
}

export async function updateFacility(id: string, input: FacilityInput) {
  const { data, error } = await supabase
    .from("recyclers")
    .update({
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      email: input.email,
      location: input.location,
      service_area: input.serviceArea,
      materials_accepted: input.materials,
      pickup_available: input.pickupAvailable,
      registration_reference: input.registrationReference || null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapFacility(data as Row);
}

/* ------------------------------------------------------------------ */
/* Lots and offers                                                     */
/* ------------------------------------------------------------------ */

/** Open lots that match the facility's materials, filtered by service area. */
export async function listAvailableLots(f: Facility): Promise<LotRow[]> {
  if (f.materials.length === 0) return [];
  const { data, error } = await supabase
    .from("lots")
    .select("*, collectors(name)")
    .in("status", ["draft", "created"])
    .in("material_category", f.materials)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const lots = (data ?? []).map((r) => mapLot(r as Row));
  if (!f.serviceArea) return lots;
  const inArea = lots.filter(
    (l) => !l.location || l.location.toLowerCase() === f.serviceArea!.toLowerCase(),
  );
  return inArea.length ? inArea : lots;
}

export async function getLot(lotUuid: string): Promise<LotRow | null> {
  const { data, error } = await supabase
    .from("lots")
    .select("*, collectors(name)")
    .eq("id", lotUuid)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLot(data as Row) : null;
}

export async function listMyQuotes(recyclerId: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, lots(*, collectors(name))")
    .eq("recycler_id", recyclerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    quote: mapQuote(r as Row),
    lot: (r as Row)["lots"] ? mapLot((r as Row)["lots"] as Row) : null,
  }));
}

export type OfferInput = {
  rate: number;
  pickupAvailable: boolean;
  pickupAt?: string | undefined;
  note?: string | undefined;
};

/** One quote per recycler + lot: repeated submissions update the same row. */
export async function submitOffer(
  lotUuid: string,
  recyclerId: string,
  weightKg: number,
  input: OfferInput,
) {
  const total = Math.round(input.rate * weightKg);
  const row = {
    quoted_rate: input.rate,
    estimated_total: total,
    pickup_available: input.pickupAvailable,
    pickup_at: input.pickupAt ?? null,
    note: input.note ?? null,
    status: "pending",
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: findErr } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("lot_id", lotUuid)
    .eq("recycler_id", recyclerId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing && existing.status === "accepted") {
    throw new Error("This offer has already been accepted and cannot be changed.");
  }
  const { error } = existing
    ? await supabase.from("quotes").update(row).eq("id", existing.id)
    : await supabase
        .from("quotes")
        .insert({ ...row, lot_id: lotUuid, recycler_id: recyclerId });
  if (error) throw error;
  return total;
}

/* ------------------------------------------------------------------ */
/* Pickups, handover, payment                                          */
/* ------------------------------------------------------------------ */

export async function listAcceptedLots(recyclerId: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, lots(*, collectors(name))")
    .eq("recycler_id", recyclerId)
    .eq("status", "accepted")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((r) => ({
      quote: mapQuote(r as Row),
      lot: (r as Row)["lots"] ? mapLot((r as Row)["lots"] as Row) : null,
    }))
    .filter((x): x is { quote: QuoteRow; lot: LotRow } => x.lot != null);
}

export async function setPickupStatus(lotUuid: string, status: PickupStatus) {
  const { error } = await supabase
    .from("lots")
    .update({ pickup_status: status })
    .eq("id", lotUuid);
  if (error) throw error;
}

async function writeTransaction(lotUuid: string, row: Record<string, unknown>) {
  const { data: existing, error: findErr } = await supabase
    .from("transactions")
    .select("id")
    .eq("lot_id", lotUuid)
    .maybeSingle();
  if (findErr) throw findErr;
  const { error } = existing
    ? await supabase.from("transactions").update(row).eq("id", existing.id)
    : await supabase.from("transactions").insert({ ...row, lot_id: lotUuid } as never);
  if (error) throw error;
}

export async function recordHandover(
  lot: LotRow,
  recyclerId: string,
  input: { finalWeight: number; finalPrice: number },
) {
  const at = new Date().toISOString();
  await writeTransaction(lot.uuid, {
    collector_id: lot.collectorId,
    recycler_id: recyclerId,
    final_weight: input.finalWeight,
    final_price: input.finalPrice,
    total_amount: Math.round(input.finalWeight * input.finalPrice),
    payment_status: "Pending",
    handover_timestamp: at,
    handover_location: lot.location,
  });
  const { error } = await supabase
    .from("lots")
    .update({ status: "handover", pickup_status: "Handover Completed" })
    .eq("id", lot.uuid);
  if (error) throw error;
}

export async function recordPayment(
  lot: LotRow,
  recyclerId: string,
  input: {
    finalWeight: number;
    finalPrice: number;
    method: "Cash" | "UPI";
    status: "Paid" | "Pending";
  },
) {
  const at = new Date().toISOString();
  await writeTransaction(lot.uuid, {
    collector_id: lot.collectorId,
    recycler_id: recyclerId,
    final_weight: input.finalWeight,
    final_price: input.finalPrice,
    total_amount: Math.round(input.finalWeight * input.finalPrice),
    payment_method: input.method,
    payment_status: input.status,
    handover_timestamp: at,
    handover_location: lot.location,
  });
  const { error } = await supabase
    .from("lots")
    .update({
      status: "settled",
      pickup_status: input.status === "Paid" ? "Completed" : "Payment Pending",
    })
    .eq("id", lot.uuid);
  if (error) throw error;
}

export async function listRecyclerTransactions(recyclerId: string): Promise<TxRow[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*, lots(lot_id, material_category), collectors(name)")
    .eq("recycler_id", recyclerId)
    .order("handover_timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as Row;
    const l = row["lots"] as Row | null;
    const c = row["collectors"] as Row | null;
    return {
      id: String(row["id"]),
      lotUuid: String(row["lot_id"]),
      lotId: l?.["lot_id"] ? String(l["lot_id"]) : "—",
      materialKey: String(l?.["material_category"] ?? "pcb") as MaterialKey,
      finalWeight: Number(row["final_weight"]),
      finalPrice: Number(row["final_price"]),
      totalAmount: Number(row["total_amount"]),
      paymentMethod: String(row["payment_method"] ?? "cash"),
      paymentStatus: String(row["payment_status"] ?? "Pending"),
      handoverAt: String(row["handover_timestamp"]),
      collectorName: c?.["name"] ? String(c["name"]) : null,
    };
  });
}
