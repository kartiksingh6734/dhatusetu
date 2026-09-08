import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Truck } from "lucide-react";
import { Screen } from "@/components/app-shell";
import {
  useLot,
  RECYCLERS,
  material,
  offerFor,
  rupees,
  store,
} from "@/lib/store";

export const Route = createFileRoute("/offers")({
  validateSearch: (s: Record<string, unknown>) => ({ lot: String(s["lot"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Recycler Offers — DhatuSetu" },
      {
        name: "description",
        content:
          "Compare offers from authorised recyclers near you: rate per kg, distance, materials accepted and pickup availability.",
      },
      { property: "og:title", content: "Recycler Offers — DhatuSetu" },
      {
        property: "og:description",
        content: "Compare authorised recyclers and accept the best offer.",
      },
    ],
  }),
  component: Offers,
});

function Offers() {
  const { lot: lotId } = Route.useSearch();
  const lot = useLot(lotId || undefined);
  const navigate = useNavigate();

  if (!lot) {
    return (
      <Screen title="Find Buyers">
        <div className="px-4">
          <p className="text-faint">Create a lot first to see recycler offers.</p>
          <Link
            to="/create-lot"
            className="mt-4 flex min-h-[60px] w-full items-center justify-center rounded-xl bg-lime font-semibold text-ink"
          >
            Create Lot
          </Link>
        </div>
      </Screen>
    );
  }

  const m = material(lot.materialKey);
  const list = RECYCLERS.filter((r) => r.accepts.includes(m.key)).sort(
    (a, b) => b.rateFactor - a.rateFactor,
  );

  return (
    <Screen title="Recycler Offers" back>
      <div className="flex items-center justify-between px-4">
        <p className="font-mono text-[12px] text-faint">
          {lot.id} · {m.name} · {lot.weightKg} kg
        </p>
        <span className="font-mono text-[12px] text-lime">{list.length} near you</span>
      </div>

      <div className="mt-3 space-y-3 px-4">
        {list.map((r) => {
          const { rate, total } = offerFor(r, m, lot.weightKg);
          return (
            <article
              key={r.id}
              className="pane overflow-hidden rounded-xl bg-ink2 ring-1 ring-border"
            >
              <div className="flex gap-4 px-4 pb-3 pt-4">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[15px] font-semibold">{r.name}</span>
                    {r.verified ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-semibold text-lime">
                        <BadgeCheck className="size-3" /> Verified
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-semibold text-warn">
                        Unverified
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-faint">
                    {r.authorisation}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-faint">
                    <MapPin className="size-4" /> {r.distanceKm} km
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-faint">
                    <Truck className="size-4" /> {r.pickup}
                  </p>
                  <p className="mt-1.5 text-[12px] text-faint">
                    Accepts{" "}
                    {r.accepts
                      .slice(0, 3)
                      .map((k) => material(k).name)
                      .join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                    Rate / kg
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold leading-none tabular-nums text-lime">
                    ₹{rate}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border bg-ink/60 px-4 py-2.5">
                <span className="text-[12px] text-faint">Est. total</span>
                <span className="font-display text-base font-semibold tabular-nums">
                  {rupees(total)}
                </span>
              </div>
              <button
                onClick={() => {
                  store.update(lot.id, {
                    recyclerId: r.id,
                    ratePerKg: rate,
                    quotedTotal: total,
                    status: "accepted",
                  });
                  store.setActive(lot.id);
                  navigate({ to: "/passport", search: { lot: lot.id } });
                }}
                className="min-h-[60px] w-full bg-lime text-[15px] font-semibold text-ink active:bg-lime-dim"
              >
                Accept offer · {rupees(total)}
              </button>
            </article>
          );
        })}
      </div>

      <p className="px-4 py-5 text-[11px] leading-relaxed text-faint">
        Estimates are indicative. Final price is set by the recycler at the weighing.
      </p>
    </Screen>
  );
}
