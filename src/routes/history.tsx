import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, StatusChip } from "@/components/app-shell";
import { useStore, material, recycler, rupees, stamp } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Transaction History — DhatuSetu" },
      {
        name: "description",
        content:
          "Every completed lot handover with material, weight, recycler, amount and payment status.",
      },
      { property: "og:title", content: "Transaction History — DhatuSetu" },
      {
        property: "og:description",
        content: "A full record of completed e-waste transactions.",
      },
    ],
  }),
  component: History,
});

function History() {
  const { lots } = useStore();
  const done = lots.filter((l) => l.status === "settled");

  return (
    <Screen title="History" back>
      <div className="space-y-2.5 px-4">
        {done.map((l) => (
          <Link
            key={l.id}
            to="/passport"
            search={{ lot: l.id }}
            className="block rounded-xl bg-ink2 px-4 py-4 ring-1 ring-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">
                  {material(l.materialKey).name} · {l.finalWeightKg} kg
                </p>
                <p className="font-mono text-[11px] text-faint">
                  {l.id} · {stamp(l.handoverAt ?? l.createdAt)}
                </p>
                <p className="mt-1 text-[13px] text-faint">
                  {recycler(l.recyclerId)?.name} · {l.paymentMethod}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-xl font-semibold leading-none tabular-nums">
                  {rupees(l.amount!)}
                </p>
                <span className="mt-1.5 inline-block">
                  <StatusChip status={l.paymentStatus!} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Screen>
  );
}
