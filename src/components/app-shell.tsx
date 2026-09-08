import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronLeft, Home, Search, Wallet, ShieldAlert } from "lucide-react";
import { useStore, store } from "@/lib/store";

export function Pane({
  children,
  className = "",
  tone = "ink",
}: {
  children: ReactNode;
  className?: string;
  tone?: "ink" | "lime";
}) {
  const toneCls =
    tone === "lime"
      ? "bg-lime/10 ring-lime/40"
      : "bg-ink2 ring-border";
  return (
    <div className={`pane overflow-hidden rounded-xl ring-1 ${toneCls} ${className}`}>
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
      {children}
    </p>
  );
}

export function Header({
  title,
  back,
}: {
  title?: string | undefined;
  back?: boolean | undefined;
}) {
  const { online } = useStore();
  const router = useRouter();
  return (
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
            ₹
          </div>
        )}
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-semibold tracking-tight">
            {title ?? "DhatuSetu"}
          </p>
          <p className="truncate font-mono text-[11px] text-faint">
            Collector · Ravi Kadam
          </p>
        </div>
      </div>
      <button
        onClick={store.toggleOnline}
        className={`flex h-11 shrink-0 items-center gap-2 rounded-full pl-3 pr-4 ring-1 ${
          online ? "bg-lime/12 ring-lime/40" : "bg-ink2 ring-border"
        }`}
      >
        <span
          className={`size-2.5 rounded-full ${online ? "bg-lime" : "bg-faint"}`}
        />
        <span
          className={`text-[13px] font-semibold ${online ? "text-lime" : "text-faint"}`}
        >
          {online ? "Online" : "Offline"}
        </span>
      </button>
    </header>
  );
}

const TABS = [
  { to: "/home", label: "Home", Icon: Home },
  { to: "/offers", label: "Buyers", Icon: Search },
  { to: "/khata", label: "Khata", Icon: Wallet },
  { to: "/safety", label: "Safety", Icon: ShieldAlert },
] as const;

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-border bg-ink2/98 backdrop-blur">
      <div className="grid grid-cols-4">
        {TABS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
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

export function Screen({
  children,
  title,
  back,
  tabs = true,
}: {
  children: ReactNode;
  title?: string;
  back?: boolean;
  tabs?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-ink font-sans text-foreground antialiased">
      <Header title={title} back={back} />
      <main className={`flex-1 ${tabs ? "pb-28" : "pb-8"}`}>{children}</main>
      {tabs ? <TabBar /> : null}
    </div>
  );
}


export function StatusChip({ status }: { status: string }) {
  const good = status === "Paid" || status === "Verified";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        good ? "bg-lime/20 text-lime" : "bg-warn/15 text-warn"
      }`}
    >
      {status}
    </span>
  );
}
