import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppUser {
  id: string;
  full_name: string;
  email: string;
  access_code: string;
  banned: boolean;
}

interface AuthCtx {
  user: AppUser | null;
  isAdmin: boolean;
  adminEmail: string | null;
  loading: boolean;
  signInWithCode: (full_name: string, access_code: string) => Promise<void>;
  signInAdminCode: (code: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const USER_KEY = "rm.user.v1";
const ADMIN_KEY = "rm.admin.v1";
const ADMIN_TOKEN_KEY = "rm.admin.token.v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      if (u) setUser(JSON.parse(u));
      const a = localStorage.getItem(ADMIN_KEY);
      if (a) setAdminEmail(a);
    } catch {}
    setLoading(false);
  }, []);

  const signInWithCode = useCallback(async (full_name: string, access_code: string) => {
    const { data, error } = await supabase.functions.invoke("user-signin", {
      body: { full_name, access_code },
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || "Sign in failed");
    const row = data.user;
    const u: AppUser = {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      access_code: row.access_code,
      banned: row.banned,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signInAdminCode = useCallback(async (code: string) => {
    const { data, error } = await supabase.functions.invoke("admin-code-login", {
      body: { code: code.trim() },
    });
    if (error && !data) throw new Error("Invalid access code");
    if (!data?.ok) throw new Error(data?.error || "Invalid access code");
    const label = data.label || "Administrator";
    localStorage.setItem(ADMIN_KEY, label);
    if (data.token) localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    setAdminEmail(label);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setUser(null);
    setAdminEmail(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.functions.invoke("user-signin", { body: { user_id: user.id } });
    if (data?.ok && data.user) {
      const row = data.user;
      const u: AppUser = {
        id: row.id, full_name: row.full_name, email: row.email,
        access_code: row.access_code, banned: row.banned,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    }
  }, [user]);

  return (
    <Ctx.Provider value={{
      user, isAdmin: !!adminEmail, adminEmail, loading,
      signInWithCode, signInAdminCode, signOut, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
