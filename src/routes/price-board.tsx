import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Screen, Label } from "@/components/app-shell";
import { MATERIALS } from "@/lib/store";

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
  return (
    <Screen title="Price Board" back>
      <div className="px-4">
        <Label>Today · indicative rate per kg</Label>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl bg-ink2 ring-1 ring-border">
          {MATERIALS.map((m) => {
            const Icon =
              m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
            return (
              <div key={m.key} className="flex items-center gap-3 px-4 py-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime/12 text-xl text-lime ring-1 ring-lime/30">
                  {m.icon}
                </span>
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                  {m.name}
                </p>
                <p className="shrink-0 font-display text-lg font-semibold tabular-nums">
                  ₹{m.min}–{m.max}
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
        <p className="mt-4 text-[12px] leading-relaxed text-faint">
          Rates are indicative and change daily. The final price is decided by the
          recycler after weighing.
        </p>
      </div>
    </Screen>
  );
}
