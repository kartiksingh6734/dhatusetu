import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "collector" | "recycler";

export type Profile = {
  id: string;
  role: Role;
  displayName: string | null;
};

/** Session + role profile for the signed-in user. */
export function useSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let alive = true;

    async function hydrate(s: Session | null) {
      if (!alive) return;
      setSession(s);
      if (!s?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const p = await fetchProfile(s.user.id);
      if (!alive) return;
      setProfile(p);
      setLoading(false);
    }

    void supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void hydrate(s);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, session, user: session?.user ?? null, profile };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    role: data.role as Role,
    displayName: data.display_name,
  };
}

async function upsertProfile(user: User, role: Role, displayName?: string) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      role,
      display_name: displayName ?? user.email ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function signUp(
  email: string,
  password: string,
  role: Role,
  displayName?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { role, display_name: displayName ?? null },
    },
  });
  if (error) throw error;
  if (data.session?.user) {
    await upsertProfile(data.session.user, role, displayName);
    return { needsEmailConfirmation: false };
  }
  return { needsEmailConfirmation: true };
}

export async function signIn(email: string, password: string, role?: Role) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = data.user;
  if (user) {
    const existing = await fetchProfile(user.id);
    if (!existing && role) await upsertProfile(user, role);
  }
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}
