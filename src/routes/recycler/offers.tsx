import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RecyclerScreen, useRecyclerGate } from "@/components/recycler-shell";
import { listMyQuotes, type LotRow, type QuoteRow } from "@/lib/recycler";
import { material, rupees, shortDate, readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/offers")({
  head: () => ({
    meta: [
      { title: "My Offers — DhatuSetu" },
      {
        name: "description",
        content:
          "Every offer your facility has submitted on DhatuSetu, with rate, estimated total and current status.",
      },
      { property: "og:title", content: "My Offers — DhatuSetu" },
      {
        property: "og:description",
        content: "Track which of your offers are pending, accepted or rejected.",
      },
    ],
  }),
  component: MyOffers;
});

function statusTone(s: string) {
  if (s === "accepted") return "bg-lime/20 text-lime";
  if (s === "rejected" || s === "expired") return "bg-warn/25 text-warn";
  return "bg-warn/15 text-warn";
}

function MyOffers() {
  const { loading, facility } = useRecyclerGate({ requireFacility: true });
  const [rows, setRows] = useState<{ quote: QuoteRow; lot: LotRow | null }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facility) return;
    let alive = true;
    listMyQuotes(facility.id)
      .then((r) => alive && setRows(r))
      .catch((e) => alive && setError(readableError(e)));
    return () => {
      alive = false;
    };
  }, [facility]);

  if (loading || !facility) {
    return (
      <RecyclerScreen title="My Offers">
        <p className="px-4 text-faint">Loading offers…</p>
      </RecyclerScreen>
    );
  }

  return (
    <RecyclerScreen title="My Offers" facility={facility}>
      {error ? <p className="px-4 text-[13px] text-warn">{error}</p> : null}
      <div className="space-y-2 px-4">
        {rows?.length === 0 ? (
          <p className="text-[13px] text-faint">
            You have not submitted any offers yet.{" "}
            <Link to="/recycler/lots" className="text-lime">
              See available lots
            </Link>
            .
          </p>
        ) : null}
        {rows?.map(({ quote, lot }) => (
          <div
            key={quote.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-ink2 px-4 py-3.5 ring-1 ring-border"
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">
                {lot ? `${material(lot.materialKey).name} · ${lot.weightKg} kg` : "Lot"}
              </p>
              <p className="font-mono text-[11px] text-faint">
                {lot?.lotId ?? "—"} · {shortDate(quote.createdAt)} · ₹{quote.rate}/kg
              </p>
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(
                  quote.status,
                )}`}
              >
                {quote.status === "pending"
                  ? "Awaiting collector"
                  : quote.status === "accepted"
                    ? "Offer accepted"
                    : quote.status}
              </span>
            </div>
            <p className="shrink-0 font-display text-base font-semibold tabular-nums">
              {rupees(quote.total)}
            </p>
          </div>
        ))}
      </div>
    </RecyclerScreen>
  );
}
