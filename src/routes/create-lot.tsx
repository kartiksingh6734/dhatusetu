import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Camera, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Screen, Label } from "@/components/app-shell";
import {
  CONDITIONS,
  allMaterials,
  store,
  useStore,
  material,
  readableError,
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

const DRAFT_KEY = "dhatusetu.lot-draft";

type Draft = {
  materialKey: MaterialKey | null;
  weight: number;
  condition: Condition;
  photo?: string;
};

/** Downscale the picked photo so it can be stored as a small data URL. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the photo."));
      img.onload = () => {
        const scale = Math.min(1, 640 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not read the photo."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function CreateLot() {
  const navigate = useNavigate();
  const { online, loading, collector } = useStore();
  const materials = allMaterials();
  const [materialKey, setMaterialKey] = useState<MaterialKey | null>(null);
  const [weight, setWeight] = useState(10);
  const [condition, setCondition] = useState<Condition>(CONDITIONS[0]);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [restored, setRestored] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prototype offline support: bring back an unfinished form.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;
      if (d.materialKey) setMaterialKey(d.materialKey);
      if (d.weight) setWeight(d.weight);
      if (d.condition) setCondition(d.condition);
      if (d.photo) setPhoto(d.photo);
      setRestored(true);
    } catch {
      /* ignore a damaged draft */
    }
  }, []);

  useEffect(() => {
    if (!materialKey) return;
    const d: Draft = { materialKey, weight, condition, ...(photo ? { photo } : {}) };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      /* storage full — the form still works */
    }
  }, [materialKey, weight, condition, photo]);

  const ready = materialKey != null && weight > 0 && !saving && !loading && !!collector;

  async function save() {
    if (!materialKey) return;
    setSaving(true);
    try {
      const m = material(materialKey);
      const lot = await store.createLot({
        materialKey,
        weightKg: weight,
        condition,
        description: `${m.name} · ${condition}`,
        ...(photo ? { photo } : {}),
      });
      localStorage.removeItem(DRAFT_KEY);
      toast.success(`Lot ${lot.id} saved successfully.`);
      navigate({ to: "/estimate", search: { lot: lot.id } });
    } catch (e) {
      toast.error("Unable to save lot. Please try again.", {
        description: readableError(e),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Create Lot" back tabs={false}>
      <div className="space-y-6 px-4">
        {!online ? (
          <div className="rounded-xl bg-warn/10 px-4 py-3 ring-1 ring-warn/30">
            <p className="text-[13px] text-warn">
              You are offline. Your form is kept on this phone — press save again once
              you are back online.
            </p>
          </div>
        ) : restored ? (
          <div className="rounded-xl bg-lime/10 px-4 py-3 ring-1 ring-lime/30">
            <p className="text-[13px] text-lime">
              We brought back the lot you had started.
            </p>
          </div>
        ) : null}

        <section>
          <Label>1 · Material</Label>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {materials.map((m) => {
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
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setPhoto(await shrink(f));
              } catch {
                toast.error("Could not read that photo. Please try another.");
              }
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
          onClick={save}
          className={`flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim ${
            ready ? "" : "pointer-events-none opacity-40"
          }`}
        >
          {saving ? "Saving lot…" : "Create lot & see price"}
        </button>
      </div>
    </Screen>
  );
}
