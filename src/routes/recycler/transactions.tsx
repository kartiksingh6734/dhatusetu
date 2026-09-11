import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RecyclerScreen, RPane, RLabel, useRecyclerGate } from "@/components/recycler-shell";
import { listRecyclerTransactions, type TxRow } from "@/lib/recycler";
import { material, rupees, stamp, readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/transactions")({
  head: () => ({
    meta: [
      { title: "Recycler Transactions — DhatuSetu" },
      {
        name: "description",
        content:
          "Your facility's completed e-waste purchases: lot, collector, weight, amount and payment status.",
      },
      { property: "og:title", content: "Recycler Transactions — DhatuSetu" },
      {
        property: "og:description",
        content: "A simple ledger of material received and amounts paid.",
      },
    ],
  }),
  component: RecyclerTransactions,
});

function RecyclerTransactions() {
  const { loading, facility } = useRecyclerGate({ requireFacility: true });
  const [rows, setRows] = useState<TxRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facility) return;
    let alive = true;
    listRecyclerTransactions(facility.id)
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setError(readableError(e)));
    return () => {
      alive = false;
    };
  }, [facility]);

  if (loading || !facility) {
    return (
      <RecyclerScreen title="Transactions">
        <p className="px-4 text-faint">Loading ledger…</p>
      </RecyclerScreen>
    );
  }

  const weight = (rows ?? []).reduce((a, t) => a + t.finalWeight, 0);
  const paid = (rows ?? [])
    .filter((t) => /paid/i.test(t.paymentStatus))
    .reduce((a, t) => a + t.totalAmount, 0);
  const pending = (rows ?? [])
    .filter((t) => !/paid/i.test(t.paymentStatus))
    .reduce((a, t) => a + t.totalAmount, 0);

  return (
    <RecyclerScreen title="Transactions" facility={facility}>
      <div className="px-4">
        <RPane tone="lime">
          <div className="grid grid-cols-3 text-center">
            <Cell label="Material" value={`${weight} kg`} />
            <Cell label="Paid" value={rupees(paid)} />
            <Cell label="Pending" value={rupees(pending)} />
          </div>
        </RPane>
      </div>

      {error ? <p className="mt-3 px-4 text-[13px] text-warn">{error}</p> : null}

      <h2 className="mt-5 px-4 text-lg font-semibold tracking-tight">History</h2>
      <div className="mt-3 space-y-2 px-4">
        {rows?.length === 0 ? (
          <p className="text-[13px] text-faint">No completed transactions yet.</p>
        ) : null}
        {rows?.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-ink2 px-4 py-3.5 ring-1 ring-border"
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">
                {material(t.materialKey).name} · {t.finalWeight} kg
              </p>
              <p className="font-mono text-[11px] text-faint">
                {t.lotId} · {t.collectorName ?? "Collector"} · {stamp(t.handoverAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-base font-semibold tabular-nums">
                {rupees(t.totalAmount)}
              </p>
              <p
                className={`font-mono text-[10px] ${
                  /paid/i.test(t.paymentStatus) ? "text-lime" : "text-warn"
                }`}
              >
                {/paid/i.test(t.paymentStatus) ? "Paid" : "Pending"} · {t.paymentMethod}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-5">
        <RLabel>Note</RLabel>
        <p className="mt-1 text-[11px] leading-relaxed text-faint">
          Prototype records. No real payment processing is involved.
        </p>
      </div>
    </RecyclerScreen>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-4">
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
    </div>
  );
}
