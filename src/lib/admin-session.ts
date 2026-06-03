import { useEffect, useState } from "react";

const KEY = "rm_admin_session";
export type AdminSession = { token: string; admin: { id: string; email: string; full_name: string | null } };

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
export function setAdminSession(s: AdminSession | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("rm-admin-session"));
}
export function useAdminSession() {
  const [s, setS] = useState<AdminSession | null>(null);
  useEffect(() => {
    setS(getAdminSession());
    const on = () => setS(getAdminSession());
    window.addEventListener("rm-admin-session", on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener("rm-admin-session", on); window.removeEventListener("storage", on); };
  }, []);
  return s;
}