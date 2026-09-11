import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RecyclerScreen, RPane, RLabel, useRecyclerGate } from "@/components/recycler-shell";
import {
  listAcceptedLots,
  setPickupStatus,
  recordHandover,
  recordPayment,
  PICKUP_STATUSES,
  type LotRow,
  type QuoteRow,
  type PickupStatus,
} from "@/lib/recycler";
import { material, rupees, readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/pickups")({
  head: () => ({
    meta: [
      { title: "Active Pickups — DhatuSetu" },
      {
        name: "description",
        content:
          "Lots you have won: update pickup status, record final weight and price at handover, and confirm payment.",
      },
      { property: "og:title", content: "Active Pickups — DhatuSetu" },
      {
        property: "og:description",
        content: "Move each accepted lot from pickup to handover to payment.",
      },
    ],
  }),
  component: Pickups,
});

const field =
  "min-h-[52px] w-full rounded-xl bg-ink3 px-4 text-base text-foreground ring-1 ring-border outline-none placeholder:text-faint focus:ring-lime/50";

function Pickups() {
  const { loading, facility } = useRecyclerGate({ requireFacility: true });
  const [rows, setRows] = useState<{ quote: QuoteRow; lot: LotRow }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!facility) return;
    let alive = true;
    listAcceptedLots(facility.id)
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setError(readableError(e)));
    return () => {
      alive = false;
    };
  }, [facility, nonce]);

  if (loading || !facility) {
    return (
      <RecyclerScreen title="Active Pickups">
        <p className="px-4 text-faint">Loading pickups…</p>
      </RecyclerScreen>
    );
  }

  return (
    <RecyclerScreen title="Active Pickups" facility={facility}>
      {error ? <p className="px-4 text-[13px] text-warn">{error}</p> : null}
      <div className="space-y-3 px-4">
        {rows?.length === 0 ? (
          <p className="text-[13px] text-faint">
            No accepted lots yet. Offers you win will appear here.
          </p>
        ) : null}
        {rows?.map(({ quote, lot }) => (
          <PickupCard
            key={quote.id}
            quote={quote}
            lot={lot}
            recyclerId={facility.id}
            onDone={() => setNonce((n) => n + 1)}
          />
        ))}
      </div>
    </RecyclerScreen>
  );
}

function PickupCard({
  quote,
  lot,
  recyclerId,
  onDone,
}: {
  quote: QuoteRow;
  lot: LotRow;
  recyclerId: string;
  onDone: () => void;
}) {
  const [weight, setWeight] = useState(String(lot.weightKg));
  const [rate, setRate] = useState(String(quote.rate));
  const [method, setMethod] = useState<"Cash" | "UPI">("Cash");
  const [busy, setBusy] = useState(false);
  const status = (lot.pickupStatus ?? "Offer Accepted") as PickupStatus;
  const total = Math.round((Number(weight) || 0) * (Number(rate) || 0));

  async function run(fn: () => Promise<void>, ok: string) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      onDone();
    } catch (e) {
      toast.error("Could not save.", { description: readableError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <RPane>
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">
              {material(lot.materialKey).name} · {lot.weightKg} kg
            </p>
            <p className="font-mono text-[11px] text-faint">
              {lot.lotId} · {lot.collectorName ?? "Collector"} ·{" "}
              {lot.location ?? "Area not given"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-lime/20 px-2.5 py-1 text-[10px] font-semibold text-lime">
            {status}
          </span>
        </div>

        <div>
          <RLabel>Pickup status</RLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {PICKUP_STATUSES.slice(0, 3).map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() =>
                  run(() => setPickupStatus(lot.uuid, s), `Status set to ${s}.`)
                }
                className={`min-h-[44px] rounded-full px-3.5 text-[12px] font-semibold ring-1 ${
                  status === s ? "bg-lime/15 text-lime ring-lime/50" : "bg-ink3 ring-border"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <RLabel>Final weight (kg)</RLabel>
            <input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`${field} mt-2`}
            />
          </div>
          <div>
            <RLabel>Final rate (₹/kg)</RLabel>
            <input
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className={`${field} mt-2`}
            />
          </div>
        </div>
        <p className="text-right text-[13px] text-faint">
          Total <span className="font-semibold text-lime">{rupees(total)}</span>
        </p>

        <button
          disabled={busy}
          onClick={() =>
            run(
              () =>
                recordHandover(lot, recyclerId, {
                  finalWeight: Number(weight) || 0,
                  finalPrice: Number(rate) || 0,
                }),
              "Handover recorded.",
            )
          }
          className="flex min-h-[56px] w-full items-center justify-center rounded-xl bg-ink3 text-[15px] font-semibold ring-1 ring-border disabled:opacity-50"
        >
          Confirm handover
        </button>

        <div className="flex gap-2">
          {(["Cash", "UPI"] as const).map((mth) => (
            <button
              key={mth}
              onClick={() => setMethod(mth)}
              className={`min-h-[52px] flex-1 rounded-xl text-[14px] font-semibold ring-1 ${
                method === mth ? "bg-lime/15 text-lime ring-lime/50" : "bg-ink3 ring-border"
              }`}
            >
              {mth}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  recordPayment(lot, recyclerId, {
                    finalWeight: Number(weight) || 0,
                    finalPrice: Number(rate) || 0,
                    method,
                    status: "Pending",
                  }),
                "Payment marked pending.",
              )
            }
            className="min-h-[56px] flex-1 rounded-xl bg-ink3 text-[15px] font-semibold ring-1 ring-border disabled:opacity-50"
          >
            Payment pending
          </button>
          <button
            disabled={busy}
            onClick={() =>
              run(
                () =>
                  recordPayment(lot, recyclerId, {
                    finalWeight: Number(weight) || 0,
                    finalPrice: Number(rate) || 0,
                    method,
                    status: "Paid",
                  }),
                "Payment recorded as paid.",
              )
            }
            className="min-h-[56px] flex-1 rounded-xl bg-lime text-[15px] font-semibold text-ink active:bg-lime-dim disabled:opacity-50"
          >
            Mark paid
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-faint">
          Prototype record only — no real payment is processed.
        </p>
      </div>
    </RPane>
  );
}
