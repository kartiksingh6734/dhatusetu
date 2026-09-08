import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, Pane, Label, StatusChip } from "@/components/app-shell";
import { useStore, totals, material, rupees, shortDate } from "@/lib/store";

export const Route = createFileRoute("/khata")({
  head: () => ({
    meta: [
      { title: "My Khata — DhatuSetu" },
      {
        name: "description",
        content:
          "Your khata: total earnings, paid amount, pending amount and every recent lot with its payment status.",
      },
      { property: "og:title", content: "My Khata — DhatuSetu" },
      {
        property: "og:description",
        content: "Track paid and pending earnings lot by lot.",
      },
    ],
  }),
  component: Khata,
});

function Khata() {
  const { lots } = useStore();
  const { total, paid, pending } = totals(lots);
  const recent = lots.filter((l) => l.amount != null).slice(0, 6);

  return (
    <Screen title="My Khata">
      <div className="px-4">
        <Pane tone="lime">
          <div className="px-5 pb-4 pt-4">
            <Label>Total earnings</Label>
            <p className="mt-1 font-display text-5xl font-semibold leading-none tabular-nums">
              {rupees(total)}
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border border-t border-border bg-ink2/70">
            <div className="px-5 py-3">
              <Label>Paid</Label>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums text-lime">
                {rupees(paid)}
              </p>
            </div>
            <div className="px-5 py-3">
              <Label>Pending</Label>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums text-warn">
                {rupees(pending)}
              </p>
            </div>
          </div>
        </Pane>
      </div>

      <div className="mt-6 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold tracking-tight">Recent transactions</h2>
        <Link to="/history" className="font-mono text-[12px] text-lime">
          History
        </Link>
      </div>

      <div className="mt-3 space-y-2 px-4">
        {recent.map((l) => (
          <Link
            key={l.id}
            to="/passport"
            search={{ lot: l.id }}
            className="flex items-center justify-between gap-3 rounded-xl bg-ink2 px-4 py-3.5 ring-1 ring-border"
          >
            <div className="min-w-0">
              <p className="font-mono text-[13px] font-semibold">{l.id}</p>
              <p className="truncate text-[13px] text-faint">
                {material(l.materialKey).name} · {shortDate(l.createdAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-lg font-semibold leading-none tabular-nums">
                {rupees(l.amount!)}
              </p>
              <span className="mt-1 inline-block">
                <StatusChip status={l.paymentStatus!} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
