import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { RecyclerScreen, useRecyclerGate } from "@/components/recycler-shell";
import { listAvailableLots, listMyQuotes, type LotRow } from "@/lib/recycler";
import { material, shortDate, readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/lots")({
  head: () => ({
    meta: [
      { title: "Available Lots — DhatuSetu" },
      {
        name: "description",
        content:
          "E-waste lots that match your accepted materials and service area, with weight, condition and collection area.",
      },
      { property: "og:title", content: "Available Lots — DhatuSetu" },
      {
        property: "og:description",
        content: "Browse collector lots suitable for your facility and submit an offer.",
      },
    ],
  }),
  component: AvailableLots,
});

function AvailableLots() {
  const { loading, facility } = useRecyclerGate({ requireFacility: true });
  const [lots, setLots] = useState<LotRow[] | null>(null);
  const [quoted, setQuoted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facility) return;
    let alive = true;
    Promise.all([listAvailableLots(facility), listMyQuotes(facility.id)])
      .then(([l, q]) => {
        if (!alive) return;
        setLots(l);
        setQuoted(new Set(q.map((x) => x.quote.lotUuid)));
      })
      .catch((e) => alive && setError(readableError(e)));
    return () => {
      alive = false;
    };
  }, [facility]);

  if (loading || !facility) {
    return (
      <RecyclerScreen title="Available Lots">
        <p className="px-4 text-faint">Loading lots…</p>
      </RecyclerScreen>
    );
  }

  return (
    <RecyclerScreen title="Available Lots" facility={facility}>
      <p className="px-4 font-mono text-[12px] text-faint">
        Matching {facility.materials.map((k) => material(k).name).join(" · ")}
        {facility.serviceArea ? ` · ${facility.serviceArea}` : ""}
      </p>
      {error ? <p className="mt-2 px-4 text-[13px] text-warn">{error}</p> : null}

      <div className="mt-3 space-y-3 px-4">
        {lots == null ? <p className="text-faint">Loading…</p> : null}
        {lots?.length === 0 ? (
          <p className="text-[13px] text-faint">
            No open lots match your materials and service area right now.
          </p>
        ) : null}
        {lots?.map((l) => (
          <Link
            key={l.uuid}
            to="/recycler/lot"
            search={{ lot: l.uuid }}
            className="pane flex gap-3 overflow-hidden rounded-xl bg-ink2 p-3 ring-1 ring-border active:bg-ink3"
          >
            {l.photo ? (
              <img
                src={l.photo}
                alt={`${material(l.materialKey).name} lot ${l.lotId}`}
                className="size-20 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
            ) : (
              <div className="grid size-20 shrink-0 place-items-center rounded-lg bg-ink3 text-2xl text-lime">
                {material(l.materialKey).icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">
                {material(l.materialKey).name} · {l.weightKg} kg
              </p>
              <p className="font-mono text-[11px] text-faint">
                {l.lotId} · {shortDate(l.createdAt)}
              </p>
              <p className="mt-1 text-[12px] text-faint">{l.condition}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-faint">
                <MapPin className="size-3.5" /> {l.location ?? "Area not given"}
              </p>
              {quoted.has(l.uuid) ? (
                <span className="mt-1.5 inline-block rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-semibold text-lime">
                  Offer submitted
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </RecyclerScreen>
  );
}
