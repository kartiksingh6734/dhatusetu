import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  RecyclerScreen,
  RPane,
  RLabel,
  VerificationChip,
  useRecyclerGate,
} from "@/components/recycler-shell";
import { FacilityForm } from "@/components/facility-form";
import { updateFacility, type FacilityInput } from "@/lib/recycler";
import { material, readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/facility")({
  head: () => ({
    meta: [
      { title: "My Facility — DhatuSetu" },
      {
        name: "description",
        content:
          "Your recycling facility profile on DhatuSetu: location, service area, materials accepted, pickup and verification status.",
      },
      { property: "og:title", content: "My Facility — DhatuSetu" },
      {
        property: "og:description",
        content: "Keep your facility details and service area up to date.",
      },
    ],
  }),
  component: FacilityScreen,
});

function FacilityScreen() {
  const { loading, facility, error, reload } = useRecyclerGate({ requireFacility: true });

  async function save(input: FacilityInput) {
    if (!facility) return;
    try {
      await updateFacility(facility.id, input);
      toast.success("Facility updated.");
      reload();
    } catch (e) {
      toast.error("Could not update your facility.", { description: readableError(e) });
    }
  }

  if (loading) {
    return (
      <RecyclerScreen title="My Facility">
        <p className="px-4 text-faint">Loading facility…</p>
      </RecyclerScreen>
    );
  }
  if (error) {
    return (
      <RecyclerScreen title="My Facility">
        <p className="px-4 text-warn">{error}</p>
      </RecyclerScreen>
    );
  }
  if (!facility) {
    return (
      <RecyclerScreen title="My Facility">
        <div className="px-4">
          <p className="text-faint">Registration Required.</p>
          <Link
            to="/recycler/register"
            className="mt-4 flex min-h-[60px] items-center justify-center rounded-xl bg-lime font-semibold text-ink"
          >
            Register facility
          </Link>
        </div>
      </RecyclerScreen>
    );
  }

  return (
    <RecyclerScreen title="My Facility" facility={facility}>
      <div className="px-4">
        <RPane tone="lime">
          <div className="px-5 py-4">
            <RLabel>Verification</RLabel>
            <div className="mt-2">
              <VerificationChip status={facility.verificationStatus} />
            </div>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-faint">
              {facility.registrationReference
                ? `Reference provided: ${facility.registrationReference}`
                : "No registration reference provided."}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              DhatuSetu displays the status of the information you provide. It does not
              itself authorise recyclers; official authorisation is granted through the
              appropriate government process.
            </p>
            <p className="mt-2 text-[12px]">
              Accepts:{" "}
              {facility.materials.map((k) => material(k).name).join(" · ") || "—"}
            </p>
          </div>
        </RPane>
      </div>

      <h2 className="mt-6 px-4 text-lg font-semibold tracking-tight">Edit details</h2>
      <div className="mt-3">
        <FacilityForm initial={facility} submitLabel="Save changes" onSubmit={save} />
      </div>
      <p className="px-4 pb-4 pt-3 text-[11px] text-faint">
        Verification status is controlled by DhatuSetu's review and cannot be changed here.
      </p>
    </RecyclerScreen>
  );
}
