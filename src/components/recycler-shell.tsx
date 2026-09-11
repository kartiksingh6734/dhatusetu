import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ChevronLeft, Factory, Layers, Truck, Receipt, LogOut } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useSession, signOut } from "@/lib/auth";
import { getMyFacility, VERIFICATION_LABEL, type Facility } from "@/lib/recycler";
import { readableError } from "@/lib/store";

/* Shared surface pieces, matching the collector visual language. */

export function RPane({
  children,
  className = "",
  tone = "ink",
}: {
  children: ReactNode;
  className?: string;
  tone?: "ink" | "lime";
}) {
  return (
    <div
      className={`pane overflow-hidden rounded-xl ring-1 ${
        tone === "lime" ? "bg-lime/10 ring-lime/40" : "bg-ink2 ring-border"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function RLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
      {children}
    </p>
  );
}

export function VerificationChip({ status }: { status: string }) {
  const label = VERIFICATION_LABEL[status as keyof typeof VERIFICATION_LABEL] ?? status;
  const good = status === "verified";
  const bad = status === "rejected";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        good ? "bg-lime/20 text-lime" : bad ? "bg-warn/25 text-warn" : "bg-warn/15 text-warn"
      }`}
    >
      {label}
    </span>
  );
}

const TABS = [
  { to: "/recycler", label: "Home", Icon: Factory },
  { to: "/recycler/lots", label: "Lots", Icon: Layers },
  { to: "/recycler/pickups", label: "Pickups", Icon: Truck },
  { to: "/recycler/transactions", label: "Ledger", Icon: Receipt },
] as const;

function RecyclerTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-border bg-ink2/98 backdrop-blur">
      <div className="grid grid-cols-4">
        {TABS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/recycler" }}
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 text-faint data-[status=active]:text-lime"
          >
            <Icon className="size-6" />
            <span className="text-[11px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function RecyclerScreen({
  children,
  title,
  back,
  tabs = true,
  facility,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  tabs?: boolean;
  facility?: Facility | null;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-ink font-sans text-foreground antialiased">
      <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-ink/95 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2.5">
          {back ? (
            <button
              aria-label="Go back"
              onClick={() => router.history.back()}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink2 ring-1 ring-border"
            >
              <ChevronLeft className="size-6 text-foreground" />
            </button>
          ) : (
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime/15 font-display text-xl leading-none text-lime ring-1 ring-lime/40">
              ♻
            </div>
          )}
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-semibold tracking-tight">
              {title ?? "DhatuSetu"}
            </p>
            <p className="truncate font-mono text-[11px] text-faint">
              Recycler · {facility?.name ?? "Not registered"}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/", replace: true });
          }}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink2 px-4 ring-1 ring-border"
        >
          <LogOut className="size-4 text-faint" />
          <span className="text-[13px] font-semibold text-faint">Exit</span>
        </button>
      </header>
      <main className={`flex-1 ${tabs ? "pb-28" : "pb-8"}`}>{children}</main>
      {tabs ? <RecyclerTabBar /> : null}
    </div>
  );
}

/**
 * Loads the signed-in recycler's facility. Redirects to sign-in when there is
 * no session, and to registration when the facility profile is missing.
 */
export function useRecyclerGate(options: { requireFacility?: boolean } = {}) {
  const { loading: authLoading, user, profile } = useSession();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth", search: { role: "recycler" }, replace: true });
      return;
    }
    let alive = true;
    setLoading(true);
    getMyFacility(user.id)
      .then((f) => {
        if (!alive) return;
        setFacility(f);
        setLoading(false);
        if (!f && options.requireFacility) {
          navigate({ to: "/recycler/register", replace: true });
        }
      })
      .catch((e) => {
        if (!alive) return;
        setError(readableError(e));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, nonce]);

  return {
    loading: authLoading || loading,
    user,
    profile,
    facility,
    error,
    reload: () => setNonce((n) => n + 1),
  };
}
