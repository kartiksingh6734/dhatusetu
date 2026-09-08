import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, BarChart3, Search, Wallet } from "lucide-react";
import { Screen, Pane, Label, StatusChip } from "@/components/app-shell";
import { useStore, totals, material, rupees, shortDate } from "@/lib/store";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Collector Home — DhatuSetu" },
      {
        name: "description",
        content:
          "Your collector home: create a lot, check today's rates, find nearby authorised buyers and track total earnings.",
      },
      { property: "og:title", content: "Collector Home — DhatuSetu" },
      {
        property: "og:description",
        content: "Create lots, check rates, find buyers and track earnings.",
      },
    ],
  }),
  component: HomeScreen,
});

const ACTIONS = [
  { to: "/create-lot", label: "Create Lot", Icon: Plus, key: "a" },
  { to: "/price-board", label: "Price Board", Icon: BarChart3, key: "b" },
  { to: "/offers", label: "Find Buyers", Icon: Search, key: "c" },
  { to: "/khata", label: "My Khata", Icon: Wallet, key: "d" },
] as const;

function HomeScreen() {
  const { lots } = useStore();
  const { total, paid } = totals(lots);
  const latest = lots.find((l) => l.amount != null);

  return (
    <Screen>
      <div className="px-4">
        <Pane tone="lime">
          <div className="px-5 pb-3 pt-4">
            <Label>Total earnings</Label>
            <p className="mt-1 font-display text-5xl font-semibold leading-none tabular-nums">
              {rupees(total)}
            </p>
            <p className="mt-2 text-sm font-medium text-lime">
              Paid {rupees(paid)}
            </p>
          </div>
          {latest ? (
            <div className="flex items-center justify-between border-t border-border bg-ink2/70 px-5 py-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
                  Latest · {latest.id}
                </p>
                <p className="mt-1 truncate text-[13px] font-medium">
                  {material(latest.materialKey).name} · {latest.finalWeightKg} kg
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-lg font-semibold leading-none tabular-nums text-lime">
                  {rupees(latest.amount!)}
                </p>
                <span className="mt-1 inline-block">
                  <StatusChip status={latest.paymentStatus!} />
                </span>
              </div>
            </div>
          ) : null}
        </Pane>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 px-4">
        {ACTIONS.map(({ to, label, Icon, key }) => (
          <Link
            key={key}
            to={to}
            className="pane flex min-h-[128px] flex-col items-start gap-3 rounded-xl bg-ink2 px-4 pb-3 pt-4 ring-1 ring-border active:bg-ink3"
          >
            <span className="grid size-14 place-items-center rounded-xl bg-lime/15 text-lime ring-1 ring-lime/40">
              <Icon className="size-7" />
            </span>
            <span className="text-[15px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold tracking-tight">Recent lots</h2>
        <Link to="/history" className="font-mono text-[12px] text-lime">
          See all
        </Link>
      </div>

      <div className="mt-3 space-y-2 px-4">
        {lots.slice(0, 3).map((l) => (
          <Link
            key={l.id}
            to="/passport"
            search={{ lot: l.id }}
            className="flex items-center justify-between rounded-xl bg-ink2 px-4 py-3.5 ring-1 ring-border"
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">
                {material(l.materialKey).name} · {l.weightKg} kg
              </p>
              <p className="font-mono text-[11px] text-faint">
                {l.id} · {shortDate(l.createdAt)}
              </p>
            </div>
            <p className="shrink-0 font-display text-base font-semibold tabular-nums">
              {l.amount ? rupees(l.amount) : "—"}
            </p>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
