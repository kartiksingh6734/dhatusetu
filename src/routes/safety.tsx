import { createFileRoute } from "@tanstack/react-router";
import { Flame, FlaskConical, BatteryWarning, Monitor, HardHat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Screen } from "@/components/app-shell";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety Centre — DhatuSetu" },
      {
        name: "description",
        content:
          "Simple safety cards for e-waste handling: no burning cables, no acid on PCBs, safe battery and CRT handling, and protective gear.",
      },
      { property: "og:title", content: "Safety Centre — DhatuSetu" },
      {
        property: "og:description",
        content: "Picture-first safety rules for handling e-waste.",
      },
    ],
  }),
  component: Safety,
});

const CARDS: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: Flame,
    title: "Do not burn cables",
    body: "Burning releases poison smoke. Strip cables with a tool instead.",
  },
  {
    Icon: FlaskConical,
    title: "Do not use acid on PCBs",
    body: "Acid burns skin and lungs. Sell PCBs whole to an authorised recycler.",
  },
  {
    Icon: BatteryWarning,
    title: "Handle batteries safely",
    body: "Keep dry, never puncture or heat. Store terminals taped and apart.",
  },
  {
    Icon: Monitor,
    title: "Handle CRTs carefully",
    body: "CRT glass holds lead and can implode. Never break the screen.",
  },
  {
    Icon: HardHat,
    title: "Wear protection",
    body: "Gloves, mask and eye cover before touching hazardous parts. Never dismantle alone.",
  },
];

function Safety() {
  return (
    <Screen title="Safety Centre">
      <div className="space-y-3 px-4">
        {CARDS.map(({ Icon, title, body }) => (
          <article
            key={title}
            className="pane flex items-start gap-4 rounded-xl bg-ink2 px-4 py-4 ring-1 ring-border"
          >
            <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-danger/12 text-danger ring-1 ring-danger/30">
              <Icon className="size-9" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[16px] font-semibold">{title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-faint">{body}</p>
            </div>
          </article>
        ))}
      </div>
    </Screen>
  );
}
