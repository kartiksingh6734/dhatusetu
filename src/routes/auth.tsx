import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { signIn, signUp, useSession, type Role } from "@/lib/auth";
import { readableError } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    role: (s["role"] === "collector" ? "collector" : "recycler") as Role,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — DhatuSetu" },
      {
        name: "description",
        content:
          "Sign in or create a DhatuSetu account as a collector or as a recycler facility.",
      },
      { property: "og:title", content: "Sign in — DhatuSetu" },
      {
        property: "og:description",
        content: "One account for collectors and recycler facilities on DhatuSetu.",
      },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const { loading, user, profile } = useSession();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const r = profile?.role ?? role;
    navigate({ to: r === "recycler" ? "/recycler" : "/home", replace: true });
  }, [loading, user, profile, role, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await signUp(email.trim(), password, role, name.trim() || undefined);
        if (res.needsEmailConfirmation) {
          setSent(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        await signIn(email.trim(), password, role);
      }
    } catch (err) {
      toast.error(mode === "up" ? "Could not create the account." : "Could not sign in.", {
        description: readableError(err),
      });
    } finally {
      setBusy(false);
    }
  }

  const roleLabel = role === "recycler" ? "Recycler" : "Collector";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-between bg-ink px-5 pb-10 pt-14 font-sans text-foreground antialiased">
      <div>
        <div className="grid size-16 place-items-center rounded-2xl bg-lime/15 font-display text-3xl leading-none text-lime ring-1 ring-lime/40">
          {role === "recycler" ? "♻" : "₹"}
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
          {roleLabel} account
        </h1>
        <p className="mt-2 text-sm text-faint">
          {mode === "in"
            ? "Sign in to continue."
            : `Create a ${roleLabel.toLowerCase()} account.`}
        </p>

        {sent ? (
          <p className="mt-5 rounded-xl bg-lime/10 px-4 py-3 text-[13px] leading-relaxed text-lime ring-1 ring-lime/40">
            We sent a confirmation link to {email}. Open it, then come back and sign in.
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "up" ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === "recycler" ? "Facility name" : "Your name"}
              className="min-h-[60px] w-full rounded-xl bg-ink2 px-4 text-base text-foreground ring-1 ring-border outline-none placeholder:text-faint focus:ring-lime/50"
            />
          ) : null}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="min-h-[60px] w-full rounded-xl bg-ink2 px-4 text-base text-foreground ring-1 ring-border outline-none placeholder:text-faint focus:ring-lime/50"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="min-h-[60px] w-full rounded-xl bg-ink2 px-4 text-base text-foreground ring-1 ring-border outline-none placeholder:text-faint focus:ring-lime/50"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex min-h-[64px] w-full items-center justify-center rounded-xl bg-lime text-lg font-semibold text-ink active:bg-lime-dim disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-4 w-full text-center text-[13px] font-semibold text-lime"
        >
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>

      <Link to="/" className="mt-8 text-center font-mono text-[12px] text-faint">
        ← Back to role selection
      </Link>
    </div>
  );
}
