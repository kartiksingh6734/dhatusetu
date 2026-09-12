import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeCheck, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { Screen } from "@/components/app-shell";
import {
  useLot,
  useStore,
  material,
  offerFor,
  rankRecyclers,
  rupees,
  store,
  readableError,
  listLotOffers,
  stamp,
  type LotOffer,
} from "@/lib/store";


export const Route = createFileRoute("/offers")({
  validateSearch: (s: Record<string, unknown>) => ({ lot: String(s["lot"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Recycler Offers — DhatuSetu" },
      {
        name: "description",
        content:
          "Compare offers from authorised recyclers near you: rate per kg, location, materials accepted and pickup availability.",
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
  const { loading, recyclers, collector } = useStore();
  const lot = useLot(lotId || undefined);
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) {
    return (
      <Screen title="Recycler Offers" back>
        <p className="px-4 text-faint">Loading offers…</p>
      </Screen>
    );
  }

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
  const area = collector?.location ?? "";
  const matching = recyclers.filter((r) => r.accepts.includes(m.key));
  const inArea = matching.filter(
    (r) => !area || !r.serviceArea || r.serviceArea === area,
  );
  const list = rankRecyclers(inArea.length ? inArea : matching, m, lot.weightKg);

  async function accept(recyclerId: string, rate: number, total: number) {
    if (busy || !lot) return;
    setBusy(recyclerId);
    try {
      await store.acceptOffer(lot.uuid, recyclerId, rate, total);
      store.setActive(lot.id);
      toast.success("Offer accepted.");
      navigate({ to: "/passport", search: { lot: lot.id } });
    } catch (e) {
      toast.error("Unable to accept the offer. Please try again.", {
        description: readableError(e),
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen title="Recycler Offers" back>
      <div className="flex items-center justify-between px-4">
        <p className="font-mono text-[12px] text-faint">
          {lot.id} · {m.name} · {lot.weightKg} kg
        </p>
        <span className="font-mono text-[12px] text-lime">{list.length} near you</span>
      </div>
      <p className="mt-1 px-4 text-[11px] text-faint">
        Authorised buyers with pickup are shown first.
      </p>

      <div className="mt-3 space-y-3 px-4">
        {list.length === 0 ? (
          <p className="text-[13px] text-faint">
            No recycler is accepting {m.name} right now.
          </p>
        ) : null}
        {list.map((r) => {
          const { rate, total } = offerFor(r, m, lot.weightKg);
          const isBusy = busy === r.id;
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
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-faint">
                    {r.authorisation}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-faint">
                    <MapPin className="size-4" /> {r.location}
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
                disabled={busy != null}
                onClick={() => accept(r.id, rate, total)}
                className={`min-h-[60px] w-full bg-lime text-[15px] font-semibold text-ink active:bg-lime-dim ${
                  busy != null && !isBusy ? "opacity-40" : ""
                }`}
              >
                {isBusy ? "Accepting…" : `Accept offer · ${rupees(total)}`}
              </button>
            </article>
          );
        })}
      </div>

      <p className="px-4 py-5 text-[11px] leading-relaxed text-faint">
        Recycler details are demonstration data. Estimates are indicative — the final
        price is set by the recycler at the weighing.
      </p>
    </Screen>
  );
}
