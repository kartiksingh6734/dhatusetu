import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Camera, Minus, Plus } from "lucide-react";
import { Screen, Label } from "@/components/app-shell";
import {
  MATERIALS,
  CONDITIONS,
  store,
  type MaterialKey,
  type Condition,
} from "@/lib/store";

export const Route = createFileRoute("/create-lot")({
  head: () => ({
    meta: [
      { title: "Create Lot — DhatuSetu" },
      {
        name: "description",
        content:
          "Create a new e-waste lot: pick the material, add a photo, enter the approximate weight and select the condition.",
      },
      { property: "og:title", content: "Create Lot — DhatuSetu" },
      {
        property: "og:description",
        content: "Pick material, add a photo, enter weight and condition.",
      },
    ],
  }),
  component: CreateLot,
});

function CreateLot() {
  const navigate = useNavigate();
  const [materialKey, setMaterialKey] = useState<MaterialKey | null>(null);
  const [weight, setWeight] = useState(10);
  const [condition, setCondition] = useState<Condition>(CONDITIONS[0]);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = materialKey != null && weight > 0;

  return (
    <Screen title="Create Lot" back tabs={false}>
      <div className="space-y-6 px-4">
        <section>
          <Label>1 · Material</Label>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {MATERIALS.map((m) => {
              const on = m.key === materialKey;
              return (
                <button
                  key={m.key}
                  onClick={() => setMaterialKey(m.key)}
                  className={`flex min-h-[84px] flex-col items-start justify-center gap-1.5 rounded-xl px-4 ring-1 ${
                    on ? "bg-lime/12 ring-lime/50" : "bg-ink2 ring-border"
                  }`}
                >
                  <span
                    className={`text-2xl leading-none ${on ? "text-lime" : "text-faint"}`}
                  >
                    {m.icon}
                  </span>
                  <span className="text-[15px] font-semibold">{m.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Label>2 · Photo</Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPhoto(URL.createObjectURL(f));
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-3 flex min-h-[112px] w-full items-center gap-4 overflow-hidden rounded-xl bg-ink2 px-4 ring-1 ring-border"
          >
            {photo ? (
              <img
                src={photo}
                alt="Lot material"
                className="h-[88px] w-[88px] rounded-lg object-cover"
              />
            ) : (
              <span className="grid size-[72px] shrink-0 place-items-center rounded-xl bg-lime/12 text-lime ring-1 ring-lime/30">
                <Camera className="size-8" />
              </span>
            )}
            <span className="text-left text-[15px] font-semibold">
              {photo ? "Change photo" : "Add photo"}
            </span>
          </button>
        </section>

        <section>
          <Label>3 · Weight (kg)</Label>
          <div className="mt-3 flex items-center gap-3">
            <button
              aria-label="Decrease weight"
              onClick={() => setWeight((w) => Math.max(0.5, +(w - 0.5).toFixed(1)))}
              className="grid size-[64px] shrink-0 place-items-center rounded-xl bg-ink2 ring-1 ring-border active:bg-ink3"
            >
              <Minus className="size-7" />
            </button>
            <input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value) || 0)}
              className="h-[64px] min-w-0 flex-1 rounded-xl bg-ink2 text-center font-display text-3xl font-semibold tabular-nums ring-1 ring-border outline-none focus:ring-lime/60"
            />
            <button
              aria-label="Increase weight"
              onClick={() => setWeight((w) => +(w + 0.5).toFixed(1))}
              className="grid size-[64px] shrink-0 place-items-center rounded-xl bg-ink2 ring-1 ring-border active:bg-ink3"
            >
              <Plus className="size-7" />
            </button>
          </div>
        </section>

        <section>
          <Label>4 · Condition</Label>
          <div className="mt-3 space-y-2.5">
            {CONDITIONS.map((c) => {
              const on = c === condition;
              return (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`flex min-h-[60px] w-full items-center justify-between rounded-xl px-4 text-left ring-1 ${
                    on ? "bg-lime/12 ring-lime/50" : "bg-ink2 ring-border"
                  }`}
                >
                  <span className="text-[15px] font-semibold">{c}</span>
                  <span
                    className={`size-5 rounded-full ring-2 ${
                      on ? "bg-lime ring-lime" : "ring-border"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        <button
          disabled={!ready}
          onClick={() => {
            const lot = store.createLot({
              materialKey: materialKey!,
              weightKg: weight,
              condition,
              ...(photo ? { photo } : {}),
            });
            navigate({ to: "/estimate", search: { lot: lot.id } });
          }}
          className={`flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim ${
            ready ? "" : "pointer-events-none opacity-40"
          }`}
        >
          Create lot & see price
        </button>
      </div>
    </Screen>
  );
}
