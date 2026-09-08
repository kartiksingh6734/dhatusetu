import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Banknote, Smartphone } from "lucide-react";
import { Screen, Label } from "@/components/app-shell";
import {
  useLot,
  material,
  recycler,
  rupees,
  store,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/store";

export const Route = createFileRoute("/payment")({
  validateSearch: (s: Record<string, unknown>) => ({ lot: String(s["lot"] ?? "") }),
  head: () => ({
    meta: [
      { title: "Payment — DhatuSetu" },
      {
        name: "description",
        content:
          "Record the final weight, final rate, total amount, payment method and payment status after handover.",
      },
      { property: "og:title", content: "Payment — DhatuSetu" },
      {
        property: "og:description",
        content: "Record cash or UPI payment for a handed-over lot.",
      },
    ],
  }),
  component: Payment,
});

function Payment() {
  const { lot: lotId } = Route.useSearch();
  const lot = useLot(lotId || undefined);
  const navigate = useNavigate();
  const [weight, setWeight] = useState(lot?.weightKg ?? 0);
  const [rate, setRate] = useState(lot?.ratePerKg ?? 0);
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [status, setStatus] = useState<PaymentStatus>("Paid");

  if (!lot) {
    return (
      <Screen title="Payment" back>
        <p className="px-4 text-faint">Lot not found.</p>
      </Screen>
    );
  }

  const m = material(lot.materialKey);
  const r = recycler(lot.recyclerId);
  const amount = Math.round(weight * rate);
  const done = lot.status === "settled";

  return (
    <Screen title="Payment" back tabs={false}>
      <div className="space-y-4 px-4">
        <div className="rounded-xl bg-ink2 px-4 py-3.5 ring-1 ring-border">
          <Label>Handover complete</Label>
          <p className="mt-1 text-[15px] font-semibold">
            {lot.id} · {m.name}
          </p>
          <p className="font-mono text-[12px] text-faint">{r?.name}</p>
        </div>

        <div className="space-y-3">
          <NumField label="Final weight (kg)" value={weight} onChange={setWeight} />
          <NumField label="Final rate (₹/kg)" value={rate} onChange={setRate} />
        </div>

        <div className="pane rounded-xl bg-lime/10 px-5 py-4 ring-1 ring-lime/40">
          <Label>Total amount</Label>
          <p className="mt-1 font-display text-5xl font-semibold leading-none tabular-nums text-lime">
            {rupees(amount)}
          </p>
        </div>

        <div>
          <Label>Payment method</Label>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Toggle
              on={method === "Cash"}
              onClick={() => setMethod("Cash")}
              icon={<Banknote className="size-7" />}
              label="Cash"
            />
            <Toggle
              on={method === "UPI"}
              onClick={() => setMethod("UPI")}
              icon={<Smartphone className="size-7" />}
              label="UPI"
            />
          </div>
        </div>

        <div>
          <Label>Payment status</Label>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Toggle
              on={status === "Paid"}
              onClick={() => setStatus("Paid")}
              icon={<Check className="size-7" />}
              label="Paid"
            />
            <Toggle
              on={status === "Pending"}
              onClick={() => setStatus("Pending")}
              label="Pending"
            />
          </div>
        </div>

        <p className="font-mono text-[11px] leading-relaxed text-faint">
          Demo only — no money moves through the app. UPI is recorded, not processed.
        </p>

        <button
          onClick={() => {
            store.update(lot.id, {
              status: "settled",
              finalWeightKg: weight,
              finalRate: rate,
              amount,
              paymentMethod: method,
              paymentStatus: status,
            });
            navigate({ to: "/khata" });
          }}
          className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim"
        >
          {done ? "Update payment" : "Save payment"}
        </button>
      </div>
    </Screen>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-ink2 px-4 py-3 ring-1 ring-border">
      <span className="min-w-0 flex-1 text-[15px] font-semibold">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-[52px] w-28 shrink-0 rounded-lg bg-ink text-center font-display text-2xl font-semibold tabular-nums ring-1 ring-border outline-none focus:ring-lime/60"
      />
    </label>
  );
}

function Toggle({
  on,
  onClick,
  icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[72px] items-center justify-center gap-2 rounded-xl text-[15px] font-semibold ring-1 ${
        on ? "bg-lime/12 text-lime ring-lime/50" : "bg-ink2 text-foreground ring-border"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
