import { useEffect, useState } from "react";

const KEY = "rm_session";
export type SessionUser = { id: string; full_name: string; email: string; whatsapp: string | null; access_code: string };
export type Session = { token: string; user: SessionUser };

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try { const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
export function setSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("rm-session"));
}
export function useSession() {
  const [s, setS] = useState<Session | null>(null);
  useEffect(() => {
    setS(getSession());
    const on = () => setS(getSession());
    window.addEventListener("rm-session", on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener("rm-session", on); window.removeEventListener("storage", on); };
  }, []);
  return s;
}