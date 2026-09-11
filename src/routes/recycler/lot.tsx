import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RecyclerScreen, RPane, RLabel, useRecyclerGate } from "@/components/recycler-shell";
import {
  getLot,
  submitOffer,
  listMyQuotes,
  type LotRow,
  type QuoteRow,
} from "@/lib/recycler";
import { material, rupees, stamp, readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/lot")({
  validateSearch: (s: Record<string, unknown>) => ({ lot: String(s["lot"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Lot Details — DhatuSetu" },
      {
        name: "description",
        content:
          "Full lot details for recyclers: material, photo, approximate weight, condition, collection location and indicative price range.",
      },
      { property: "og:title", content: "Lot Details — DhatuSetu" },
      {
        property: "og:description",
        content: "Review a collector's lot and submit your offer.",
      },
    ],
  }),
  component: LotDetail,
});

const field =
  "min-h-[56px] w-full rounded-xl bg-ink2 px-4 text-base text-foreground ring-1 ring-border outline-none placeholder:text-faint focus:ring-lime/50";

function LotDetail() {
  const { lot: lotUuid } = Route.useSearch();
  const { loading, facility } = useRecyclerGate({ requireFacility: true });
  const navigate = useNavigate();
  const [lot, setLot] = useState<LotRow | null>(null);
  const [mine, setMine] = useState<QuoteRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rate, setRate] = useState("");
  const [pickup, setPickup] = useState(true);
  const [pickupAt, setPickupAt] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!facility || !lotUuid) return;
    let alive = true;
    Promise.all([getLot(lotUuid), listMyQuotes(facility.id)])
      .then(([l, qs]) => {
        if (!alive) return;
        setLot(l);
        const q = qs.find((x) => x.quote.lotUuid === lotUuid)?.quote ?? null;
        setMine(q);
        if (q) {
          setRate(String(q.rate));
          setPickup(q.pickupAvailable);
          setNote(q.note ?? "");
        }
      })
      .catch((e) => alive && setError(readableError(e)));
    return () => {
      alive = false;
    };
  }, [facility, lotUuid]);

  if (loading || !facility) {
    return (
      <RecyclerScreen title="Lot" back tabs={false}>
        <p className="px-4 text-faint">Loading…</p>
      </RecyclerScreen>
    );
  }

  if (!lot) {
    return (
      <RecyclerScreen title="Lot" back tabs={false}>
        <p className="px-4 text-faint">{error ?? "Lot not found."}</p>
      </RecyclerScreen>
    );
  }

  const m = material(lot.materialKey);
  const rateNum = Number(rate) || 0;
  const total = Math.round(rateNum * lot.weightKg);

  async function send() {
    if (!lot || !facility || busy) return;
    if (rateNum <= 0) {
      toast.error("Enter a rate per kg.");
      return;
    }
    setBusy(true);
    try {
      await submitOffer(lot.uuid, facility.id, lot.weightKg, {
        rate: rateNum,
        pickupAvailable: pickup,
        pickupAt: pickupAt ? new Date(pickupAt).toISOString() : undefined,
        note: note.trim() || undefined,
      });
      toast.success(mine ? "Offer updated." : "Offer submitted to the collector.");
      navigate({ to: "/recycler/offers" });
    } catch (e) {
      toast.error("Could not submit the offer.", { description: readableError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <RecyclerScreen title={lot.lotId} back facility={facility} tabs={false}>
      <div className="px-4">
        <RPane>
          {lot.photo ? (
            <img
              src={lot.photo}
              alt={`${m.name} lot ${lot.lotId}`}
              className="h-48 w-full object-cover"
            />
          ) : null}
          <div className="space-y-2 px-5 py-4">
            <Row k="Lot ID" v={lot.lotId} />
            <Row k="Material" v={m.name} />
            <Row k="Approx. weight" v={`${lot.weightKg} kg`} />
            <Row k="Condition" v={lot.condition} />
            <Row k="Collection area" v={lot.location ?? "—"} />
            <Row k="Created" v={stamp(lot.createdAt)} />
            <Row
              k="Indicative range"
              v={
                lot.estMin != null && lot.estMax != null
                  ? `${rupees(lot.estMin)} – ${rupees(lot.estMax)}`
                  : "—"
              }
            />
            <Row k="Collector" v={lot.collectorName ?? "—"} />
          </div>
        </RPane>
      </div>

      <h2 className="mt-6 px-4 text-lg font-semibold tracking-tight">
        {mine ? "Update your offer" : "Submit Offer"}
      </h2>

      <div className="mt-3 space-y-3 px-4">
        <div>
          <RLabel>Offered rate per kg (₹)</RLabel>
          <input
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g. 120"
            className={`${field} mt-2`}
          />
        </div>

        <RPane tone="lime">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-faint">Estimated total</span>
            <span className="font-display text-2xl font-semibold tabular-nums text-lime">
              {rupees(total)}
            </span>
          </div>
        </RPane>

        <button
          type="button"
          onClick={() => setPickup(!pickup)}
          className={`flex min-h-[56px] w-full items-center justify-between rounded-xl px-4 ring-1 ${
            pickup ? "bg-lime/12 ring-lime/50" : "bg-ink2 ring-border"
          }`}
        >
          <span className="text-[15px] font-semibold">Pickup available</span>
          <span
            className={`size-5 rounded-full ring-2 ${pickup ? "bg-lime ring-lime" : "ring-border"}`}
          />
        </button>

        <div>
          <RLabel>Pickup date & time (optional)</RLabel>
          <input
            type="datetime-local"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
            className={`${field} mt-2`}
          />
        </div>

        <div>
          <RLabel>Note (optional)</RLabel>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Anything the collector should know"
            className="mt-2 w-full rounded-xl bg-ink2 px-4 py-3 text-base text-foreground ring-1 ring-border outline-none placeholder:text-faint focus:ring-lime/50"
          />
        </div>

        <button
          onClick={send}
          disabled={busy}
          className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim disabled:opacity-50"
        >
          {busy ? "Sending…" : mine ? "Update offer" : "Submit Offer"}
        </button>

        {mine ? (
          <p className="text-center text-[12px] text-faint">
            Your current offer: ₹{mine.rate}/kg · {mine.status}
          </p>
        ) : null}
      </div>

      <p className="px-4 py-5 text-[11px] leading-relaxed text-faint">
        The collector chooses one offer. Submitting again replaces your existing offer for
        this lot.
      </p>
    </RecyclerScreen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] text-faint">{k}</span>
      <span className="text-right text-[14px] font-semibold">{v}</span>
    </div>
  );
}
