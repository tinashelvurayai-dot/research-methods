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
  signInAdmin: (email: string, password: string) => Promise<void>;
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
    const code = access_code.trim().toUpperCase();
    const name = full_name.trim();
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("access_code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Invalid access code");
    if (data.banned) throw new Error("Account is suspended");
    if (data.full_name.trim().toLowerCase() !== name.toLowerCase()) {
      throw new Error("Name does not match this code");
    }
    const u: AppUser = {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      access_code: data.access_code,
      banned: data.banned,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    supabase.from("app_users").update({ last_login: new Date().toISOString() }).eq("id", u.id).then(() => {});
  }, []);

  const signInAdmin = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke("admin-login", {
      body: { email: email.trim().toLowerCase(), password },
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || "Login failed");
    localStorage.setItem(ADMIN_KEY, email.trim().toLowerCase());
    if (data.token) localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    setAdminEmail(email.trim().toLowerCase());
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
    const { data } = await supabase.from("app_users").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      const u: AppUser = {
        id: data.id, full_name: data.full_name, email: data.email,
        access_code: data.access_code, banned: data.banned,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    }
  }, [user]);

  return (
    <Ctx.Provider value={{
      user, isAdmin: !!adminEmail, adminEmail, loading,
      signInWithCode, signInAdmin, signOut, refresh,
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
