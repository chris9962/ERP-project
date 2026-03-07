"use client";

import { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role_id: string | null;
  is_active: boolean;
  roles: { name: string } | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  roleName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AUTH_ME_KEY = ["auth", "me"] as const;

async function fetchAuthMe(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return { user: null, profile: null };
  const data = await res.json();
  return {
    user: data.user ?? null,
    profile: data.profile ?? null,
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roleName: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: fetchAuthMe,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const user = data?.user ?? null;
  const profile = data?.profile ?? null;
  const roleName = (profile?.roles as { name: string } | null)?.name ?? null;
  const loading = isPending || isFetching;

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      await queryClient.invalidateQueries({ queryKey: AUTH_ME_KEY });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    queryClient.setQueryData(AUTH_ME_KEY, { user: null, profile: null });
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, roleName, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
