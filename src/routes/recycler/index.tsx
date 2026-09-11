import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layers, Tag, Truck, Receipt, Factory, BadgeCheck } from "lucide-react";
import {
  RecyclerScreen,
  RPane,
  RLabel,
  VerificationChip,
  useRecyclerGate,
} from "@/components/recycler-shell";
import {
  listAvailableLots,
  listMyQuotes,
  listAcceptedLots,
  listRecyclerTransactions,
  type Facility,
} from "@/lib/recycler";
import { rupees, readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/")({
  head: () => ({
    meta: [
      { title: "Recycler Home — DhatuSetu" },
      {
        name: "description",
        content:
          "Recycler dashboard: new lot requests, active pickups, accepted lots, material received and pending payments.",
      },
      { property: "og:title", content: "Recycler Home — DhatuSetu" },
      {
        property: "og:description",
        content: "See new lot requests, active pickups and payments in one place.",
      },
    ],
  }),
  component: RecyclerHome,
});

const ACTIONS = [
  { to: "/recycler/lots", label: "Available Lots", Icon: Layers },
  { to: "/recycler/offers", label: "My Offers", Icon: Tag },
  { to: "/recycler/pickups", label: "Active Pickups", Icon: Truck },
  { to: "/recycler/transactions", label: "Transactions", Icon: Receipt },
  { to: "/recycler/facility", label: "My Facility", Icon: Factory },
  { to: "/recycler/facility", label: "Verification", Icon: BadgeCheck },
] as const;

type Stats = {
  newLots: number;
  activeOffers: number;
  accepted: number;
  completed: number;
  weight: number;
  pendingPayments: number;
};

function useStats(facility: Facility | null) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facility) return;
    let alive = true;
    Promise.all([
      listAvailableLots(facility),
      listMyQuotes(facility.id),
      listAcceptedLots(facility.id),
      listRecyclerTransactions(facility.id),
    ])
      .then(([lots, quotes, accepted, txs]) => {
        if (!alive) return;
        setStats({
          newLots: lots.length,
          activeOffers: quotes.filter((q) => q.quote.status === "pending").length,
          accepted: accepted.length,
          completed: txs.filter((t) => /paid/i.test(t.paymentStatus)).length,
          weight: txs.reduce((a, t) => a + t.finalWeight, 0),
          pendingPayments: txs
            .filter((t) => !/paid/i.test(t.paymentStatus))
            .reduce((a, t) => a + t.totalAmount, 0),
        });
      })
      .catch((e) => alive && setError(readableError(e)));
    return () => {
      alive = false;
    };
  }, [facility]);

  return { stats, error };
}

function RecyclerHome() {
  const { loading, facility, error } = useRecyclerGate();
  const { stats, error: statsError } = useStats(facility);

  if (loading) {
    return (
      <RecyclerScreen title="Recycler Home">
        <p className="px-4 text-faint">Loading your facility…</p>
      </RecyclerScreen>
    );
  }

  if (!facility) {
    return (
      <RecyclerScreen title="Recycler Home" tabs={false}>
        <div className="px-4">
          <RPane>
            <div className="px-5 py-4">
              <RLabel>Status</RLabel>
              <p className="mt-2 text-lg font-semibold text-warn">Registration Required</p>
              <p className="mt-2 text-[13px] leading-relaxed text-faint">
                Add your facility details to start receiving e-waste lots. DhatuSetu shows
                your registration information and review status only — formal
                authorisation must be obtained through the appropriate official process.
              </p>
            </div>
          </RPane>
          <Link
            to="/recycler/register"
            className="mt-4 flex min-h-[64px] items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim"
          >
            Register facility
          </Link>
        </div>
      </RecyclerScreen>
    );
  }

  const msg = error ?? statsError;

  return (
    <RecyclerScreen title="Recycler Home" facility={facility}>
      <div className="px-4">
        <RPane tone="lime">
          <div className="px-5 pb-3 pt-4">
            <RLabel>New lot requests</RLabel>
            <p className="mt-1 font-display text-5xl font-semibold leading-none tabular-nums">
              {stats ? stats.newLots : "…"}
            </p>
            <div className="mt-2">
              <VerificationChip status={facility.verificationStatus} />
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-border bg-ink2/70 text-center">
            <Stat label="Active" value={stats ? String(stats.activeOffers) : "…"} />
            <Stat label="Accepted" value={stats ? String(stats.accepted) : "…"} />
            <Stat label="Completed" value={stats ? String(stats.completed) : "…"} />
          </div>
        </RPane>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5 px-4">
        <RPane>
          <div className="px-4 py-3">
            <RLabel>Material received</RLabel>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {stats ? `${stats.weight} kg` : "…"}
            </p>
          </div>
        </RPane>
        <RPane>
          <div className="px-4 py-3">
            <RLabel>Pending payments</RLabel>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-warn">
              {stats ? rupees(stats.pendingPayments) : "…"}
            </p>
          </div>
        </RPane>
      </div>

      {msg ? <p className="mt-3 px-4 text-[13px] text-warn">{msg}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-2.5 px-4">
        {ACTIONS.map(({ to, label, Icon }) => (
          <Link
            key={label}
            to={to}
            className="pane flex min-h-[120px] flex-col items-start gap-3 rounded-xl bg-ink2 px-4 pb-3 pt-4 ring-1 ring-border active:bg-ink3"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-lime/15 text-lime ring-1 ring-lime/40">
              <Icon className="size-6" />
            </span>
            <span className="text-[15px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <p className="px-4 py-5 text-[11px] leading-relaxed text-faint">
        Demo / Prototype Data. DhatuSetu does not authorise recyclers.
      </p>
    </RecyclerScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-3">
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        {label}
      </p>
    </div>
  );
}
