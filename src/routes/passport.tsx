import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, Pane, Label } from "@/components/app-shell";
import {
  useLot,
  useStore,
  material,
  recycler,
  rupees,
  stamp,
  store,
  readableError,
} from "@/lib/store";


export const Route = createFileRoute("/passport")({
  validateSearch: (s: Record<string, unknown>) => ({ lot: String(s["lot"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Lot Passport — DhatuSetu" },
      {
        name: "description",
        content:
          "The lot passport records the lot ID, material, photo, weight, quoted price, selected recycler and handover status.",
      },
      { property: "og:title", content: "Lot Passport — DhatuSetu" },
      {
        property: "og:description",
        content: "A traceable record of every lot handed over to a recycler.",
      },
    ],
  }),
  component: Passport,
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Awaiting buyer",
  accepted: "Ready for handover",
  handover: "Handed over",
  settled: "Completed",
};

function Passport() {
  const { lot: lotId } = Route.useSearch();
  const { loading } = useStore();
  const lot = useLot(lotId || undefined);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!lot) {
    return (
      <Screen title="Lot Passport" back>
        <p className="px-4 text-faint">{loading ? "Loading lot…" : "Lot not found."}</p>
      </Screen>
    );
  }

  async function handover() {
    if (!lot || busy) return;
    setBusy(true);
    try {
      await store.confirmHandover(lot.uuid);
      toast.success("Handover confirmed.");
      navigate({ to: "/payment", search: { lot: lot.id } });
    } catch (e) {
      toast.error("Unable to confirm handover. Please try again.", {
        description: readableError(e),
      });
    } finally {
      setBusy(false);
    }
  }


  const m = material(lot.materialKey);
  const r = recycler(lot.recyclerId);

  return (
    <Screen title="Lot Passport" back>
      <div className="space-y-4 px-4">
        <Pane tone="lime">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <div>
              <Label>Lot ID</Label>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight">
                {lot.id}
              </p>
            </div>
            <span className="rounded-full bg-lime/20 px-3 py-1.5 text-[12px] font-semibold text-lime">
              {STATUS_LABEL[lot.status]}
            </span>
          </div>
          {lot.photo ? (
            <img
              src={lot.photo}
              alt={`${m.name} lot ${lot.id}`}
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="grid h-32 place-items-center border-t border-border bg-ink2/70 text-5xl text-lime/60">
              {m.icon}
            </div>
          )}
          <dl className="divide-y divide-border border-t border-border bg-ink2/70">
            <Row k="Material" v={m.name} />
            <Row k="Condition" v={lot.condition} />
            <Row k="Weight" v={`${lot.weightKg} kg`} />
            <Row
              k="Quoted price"
              v={lot.ratePerKg ? `₹${lot.ratePerKg} / kg` : "Not quoted"}
            />
            <Row
              k="Quoted total"
              v={lot.quotedTotal ? rupees(lot.quotedTotal) : "—"}
            />
            <Row k="Recycler" v={r ? r.name : "Not selected"} />
            <Row k="Collected" v={stamp(lot.createdAt)} />
            {lot.handoverAt ? <Row k="Handover" v={stamp(lot.handoverAt)} /> : null}
          </dl>
        </Pane>

        {lot.status === "draft" ? (
          <Link
            to="/offers"
            search={{ lot: lot.id }}
            className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim"
          >
            Find recyclers
          </Link>
        ) : null}

        {lot.status === "accepted" ? (
          <button
            onClick={() => {
              store.update(lot.id, {
                status: "handover",
                handoverAt: new Date().toISOString(),
              });
              navigate({ to: "/payment", search: { lot: lot.id } });
            }}
            className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim"
          >
            Confirm handover
          </button>
        ) : null}

        {lot.status === "handover" ? (
          <Link
            to="/payment"
            search={{ lot: lot.id }}
            className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim"
          >
            Record payment
          </Link>
        ) : null}

        {lot.status === "settled" ? (
          <Link
            to="/khata"
            className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-ink2 text-lg font-semibold ring-1 ring-border"
          >
            Open Khata
          </Link>
        ) : null}
      </div>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
        {k}
      </dt>
      <dd className="text-[15px] font-semibold">{v}</dd>
    </div>
  );
}
