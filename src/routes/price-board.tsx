import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Screen, Label } from "@/components/app-shell";
import { useStore, allMaterials, shortDate } from "@/lib/store";

export const Route = createFileRoute("/price-board")({
  head: () => ({
    meta: [
      { title: "Price Board — DhatuSetu" },
      {
        name: "description",
        content:
          "Today's indicative scrap rates per kilogram for PCB, cables, batteries, motors, LCD panels, CRTs and mixed plastics.",
      },
      { property: "og:title", content: "Price Board — DhatuSetu" },
      {
        property: "og:description",
        content: "Indicative per-kilogram rates for every e-waste material.",
      },
    ],
  }),
  component: PriceBoard,
});

function PriceBoard() {
  const { loading, error } = useStore();
  const list = allMaterials().filter((m) => m.max > 0);

  return (
    <Screen title="Price Board" back>
      <div className="px-4">
        <Label>Today · indicative rate per kg</Label>

        {loading ? (
          <p className="mt-4 text-[13px] text-faint">Loading rates…</p>
        ) : error ? (
          <p className="mt-4 text-[13px] text-warn">
            Unable to load rates. Please try again.
          </p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-[13px] text-faint">No rates available yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl bg-ink2 ring-1 ring-border">
            {list.map((m) => {
              const Icon =
                m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
              return (
                <div key={m.key} className="flex items-center gap-3 px-4 py-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime/12 text-xl text-lime ring-1 ring-lime/30">
                    {m.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{m.name}</p>
                    <p className="truncate font-mono text-[10px] text-faint">
                      {m.location} · updated {shortDate(m.effectiveDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-right font-display text-lg font-semibold tabular-nums">
                    ₹{m.min}–{m.max}
                    <span className="block font-sans text-[10px] font-medium text-faint">
                      per {m.unit}
                    </span>
                  </p>
                  <Icon
                    className={`size-5 shrink-0 ${
                      m.trend === "down" ? "text-warn" : "text-lime"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-[12px] leading-relaxed text-faint">
          Rates are indicative demonstration data and change daily. The final price is
          decided by the recycler after weighing.
        </p>
      </div>
    </Screen>
  );
}
