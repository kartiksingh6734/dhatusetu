import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, Pane, Label } from "@/components/app-shell";
import { useLot, material, rupees, stamp } from "@/lib/store";

export const Route = createFileRoute("/estimate")({
  validateSearch: (s: Record<string, unknown>) => ({ lot: String(s["lot"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Price Estimate — DhatuSetu" },
      {
        name: "description",
        content:
          "Indicative price range and estimated total value for your e-waste lot, based on today's market rates.",
      },
      { property: "og:title", content: "Price Estimate — DhatuSetu" },
      {
        property: "og:description",
        content: "See the indicative value of your lot before contacting buyers.",
      },
    ],
  }),
  component: Estimate,
});

function Estimate() {
  const { lot: lotId } = Route.useSearch();
  const lot = useLot(lotId);

  if (!lot) {
    return (
      <Screen title="Price Estimate" back>
        <p className="px-4 text-faint">Lot not found.</p>
      </Screen>
    );
  }

  const m = material(lot.materialKey);
  const low = m.min * lot.weightKg;
  const high = m.max * lot.weightKg;

  return (
    <Screen title="Price Estimate" back tabs={false}>
      <div className="space-y-4 px-4">
        <Pane tone="lime">
          <div className="px-5 pb-4 pt-4">
            <Label>Estimated total value</Label>
            <p className="mt-1 font-display text-4xl font-semibold leading-none tabular-nums">
              {rupees(low)} – {rupees(high)}
            </p>
            <p className="mt-2 font-mono text-[12px] text-lime">
              ₹{m.min}–{m.max} per kg × {lot.weightKg} kg
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-ink2/70">
            <Cell k="Material" v={m.name} />
            <Cell k="Weight" v={`${lot.weightKg} kg`} />
            <Cell k="Condition" v={lot.condition} />
          </div>
        </Pane>

        <div className="rounded-xl bg-ink2 px-4 py-4 ring-1 ring-border">
          <Label>Lot</Label>
          <div className="mt-2 flex items-center gap-3">
            {lot.photo ? (
              <img
                src={lot.photo}
                alt={`${m.name} lot`}
                className="size-16 rounded-lg object-cover"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-lg bg-lime/12 text-2xl text-lime">
                {m.icon}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-mono text-[15px] font-semibold">{lot.id}</p>
              <p className="text-[12px] text-faint">{stamp(lot.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-warn/10 px-4 py-3.5 ring-1 ring-warn/30">
          <p className="text-[13px] leading-relaxed text-warn">
            This estimate is indicative only. The final price is decided by the
            recycler after weighing and inspecting the material.
          </p>
        </div>

        <Link
          to="/offers"
          search={{ lot: lot.id }}
          className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim"
        >
          Find recyclers
        </Link>
      </div>
    </Screen>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="px-3 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        {k}
      </p>
      <p className="mt-1 truncate text-[13px] font-semibold">{v}</p>
    </div>
  );
}
