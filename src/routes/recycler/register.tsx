import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecyclerScreen } from "@/components/recycler-shell";
import { FacilityForm } from "@/components/facility-form";
import { useRecyclerGate } from "@/components/recycler-shell";
import { createFacility, type FacilityInput } from "@/lib/recycler";
import { readableError } from "@/lib/store";

export const Route = createFileRoute("/recycler/register")({
  head: () => ({
    meta: [
      { title: "Recycler Registration — DhatuSetu" },
      {
        name: "description",
        content:
          "Register your recycling facility on DhatuSetu: contact details, service area, materials accepted and registration reference.",
      },
      { property: "og:title", content: "Recycler Registration — DhatuSetu" },
      {
        property: "og:description",
        content: "Add your facility details so suitable e-waste lots reach you.",
      },
    ],
  }),
  component: RegisterScreen,
});

function RegisterScreen() {
  const { loading, user, facility } = useRecyclerGate();
  const navigate = useNavigate();

  async function save(input: FacilityInput) {
    if (!user) return;
    try {
      await createFacility(user.id, input);
      toast.success("Facility registered. Verification is pending review.");
      navigate({ to: "/recycler", replace: true });
    } catch (e) {
      toast.error("Could not save your facility.", { description: readableError(e) });
    }
  }

  if (loading) {
    return (
      <RecyclerScreen title="Registration" tabs={false}>
        <p className="px-4 text-faint">Loading…</p>
      </RecyclerScreen>
    );
  }

  if (facility) {
    navigate({ to: "/recycler/facility", replace: true });
    return null;
  }

  return (
    <RecyclerScreen title="Recycler Registration" tabs={false}>
      <div className="mb-4 px-4">
        <div className="rounded-xl bg-warn/10 px-4 py-3 ring-1 ring-warn/30">
          <p className="text-[13px] font-semibold text-warn">Registration Required</p>
          <p className="mt-1 text-[12px] leading-relaxed text-faint">
            Add your facility details to receive lots. Your listing will show
            "Pending Verification" until DhatuSetu reviews it. Official authorisation
            remains a separate government process.
          </p>
        </div>
      </div>
      <FacilityForm submitLabel="Register facility" onSubmit={save} />
    </RecyclerScreen>
  );
}
