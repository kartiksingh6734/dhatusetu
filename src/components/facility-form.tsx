import { useState } from "react";
import { RLabel } from "@/components/recycler-shell";
import { allMaterials, type MaterialKey } from "@/lib/store";
import type { Facility, FacilityInput } from "@/lib/recycler";

const field =
  "min-h-[56px] w-full rounded-xl bg-ink2 px-4 text-base text-foreground ring-1 ring-border outline-none placeholder:text-faint focus:ring-lime/50";

export function FacilityForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Facility | null;
  submitLabel: string;
  onSubmit: (input: FacilityInput) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [serviceArea, setServiceArea] = useState(initial?.serviceArea ?? "");
  const [materials, setMaterials] = useState<MaterialKey[]>(initial?.materials ?? []);
  const [pickup, setPickup] = useState(initial?.pickupAvailable ?? true);
  const [reference, setReference] = useState(initial?.registrationReference ?? "");
  const [busy, setBusy] = useState(false);

  function toggle(k: MaterialKey) {
    setMaterials((m) => (m.includes(k) ? m.filter((x) => x !== k) : [...m, k]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        location: location.trim(),
        serviceArea: serviceArea.trim(),
        materials,
        pickupAvailable: pickup,
        registrationReference: reference.trim(),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-4">
      <div className="space-y-2">
        <RLabel>Facility</RLabel>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Facility name"
          className={field}
        />
        <input
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          placeholder="Contact person"
          className={field}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className={field}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={field}
        />
      </div>

      <div className="space-y-2">
        <RLabel>Coverage</RLabel>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Facility location (e.g. Pune)"
          className={field}
        />
        <input
          value={serviceArea}
          onChange={(e) => setServiceArea(e.target.value)}
          placeholder="Service area (e.g. Pune)"
          className={field}
        />
      </div>

      <div>
        <RLabel>Materials accepted</RLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {allMaterials().map((m) => {
            const on = materials.includes(m.key);
            return (
              <button
                type="button"
                key={m.key}
                onClick={() => toggle(m.key)}
                className={`flex min-h-[56px] items-center gap-2 rounded-xl px-3 text-left text-[14px] font-semibold ring-1 ${
                  on ? "bg-lime/12 text-lime ring-lime/50" : "bg-ink2 text-foreground ring-border"
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPickup(!pickup)}
        className={`flex min-h-[56px] w-full items-center justify-between rounded-xl px-4 ring-1 ${
          pickup ? "bg-lime/12 ring-lime/50" : "bg-ink2 ring-border"
        }`}
      >
        <span className="text-[15px] font-semibold">Pickup available</span>
        <span
          className={`size-5 rounded-full ring-2 ${pickup ? "bg-lime ring-lime" : "ring-border"}`}
        />
      </button>

      <div>
        <RLabel>Registration / authorisation reference</RLabel>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Your official registration number (optional)"
          className={`${field} mt-2`}
        />
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          DhatuSetu does not authorise recyclers. Formal registration and authorisation
          must be completed through the appropriate official process. What you enter here
          is displayed as provided information only, and your verification status is set
          by DhatuSetu's review — you cannot set it yourself.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy || materials.length === 0}
        className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim disabled:opacity-40"
      >
        {busy ? "Saving…" : submitLabel}
      </button>
      {materials.length === 0 ? (
        <p className="pb-2 text-center text-[12px] text-warn">
          Select at least one material you accept.
        </p>
      ) : null}
    </form>
  );
}
