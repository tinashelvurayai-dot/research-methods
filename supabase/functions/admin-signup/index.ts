import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$210000$${bufToHex(salt)}$${bufToHex(bits)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { email, password, full_name } = await req.json();
    if (!email || !password) throw new Error("Email and password required");
    if (String(password).length < 8) throw new Error("Password must be at least 8 characters");
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { count } = await supa.from("admin_users").select("id", { count: "exact", head: true });
    if ((count || 0) > 0) throw new Error("Admin already exists. Please sign in.");
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const { data, error } = await supa.from("admin_users").insert({
      email: String(email).trim().toLowerCase(),
      full_name: String(full_name || "Administrator").trim(),
      password_hash: await hashPassword(String(password)),
      session_token: token,
    }).select("email, full_name").single();
    if (error) throw error;
    return json({ ok: true, token, email: data.email, full_name: data.full_name });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}