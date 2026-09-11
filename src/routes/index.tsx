import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LANGUAGES, type Lang } from "@/lib/i18n";
import { store } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DhatuSetu — E-waste collector to recycler bridge" },
      {
        name: "description",
        content:
          "DhatuSetu connects informal e-waste collectors with authorised recyclers: create a lot, get a price estimate, accept an offer and record payment.",
      },
      { property: "og:title", content: "DhatuSetu — E-waste collector to recycler bridge" },
      {
        property: "og:description",
        content:
          "Create a lot, see indicative rates, compare authorised recyclers and keep your khata in one simple app.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const [lang, setLang] = useState<Lang>("en");
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-between bg-ink px-5 pb-8 pt-16 font-sans text-foreground antialiased">
      <div>
        <div className="grid size-20 place-items-center rounded-2xl bg-lime/15 font-display text-4xl leading-none text-lime ring-1 ring-lime/40">
          ₹
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">
          DhatuSetu
        </h1>
        <p className="mt-2 text-base text-faint">
          Collector to authorised recycler
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
          Choose language
        </p>
        <div className="mt-3 space-y-2.5">
          {LANGUAGES.map((l) => {
            const on = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex min-h-[64px] w-full items-center justify-between rounded-xl px-5 text-left ring-1 ${
                  on ? "bg-lime/12 ring-lime/50" : "bg-ink2 ring-border"
                }`}
              >
                <span
                  className={`text-xl font-semibold ${on ? "text-lime" : "text-foreground"}`}
                >
                  {l.native}
                </span>
                <span
                  className={`size-5 rounded-full ring-2 ${
                    on ? "bg-lime ring-lime" : "ring-border"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-[11px] text-faint">
          Hindi and Marathi text coming soon.
        </p>

        <button
          onClick={() => {
            store.setLang(lang);
            navigate({ to: "/home" });
          }}
          className="mt-5 flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold tracking-tight text-ink active:bg-lime-dim"
        >
          Start
        </button>

        <Link
          to="/auth"
          search={{ role: "recycler" as const }}
          className="mt-3 flex min-h-[56px] w-full items-center justify-center rounded-xl bg-ink2 text-base font-semibold text-lime ring-1 ring-lime/40"
        >
          I am a Recycler
        </Link>
      </div>
    </div>
  );
}
