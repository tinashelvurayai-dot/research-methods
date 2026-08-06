// Admin sign-in via access code. Codes are validated server-side only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CODES: Record<string, string> = {
  "ES#1Research": "Lead Administrator",
  "Research": "Administrator",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body?.code ?? "").trim();
    if (!code) throw new Error("Access code required");
    const label = CODES[code];
    if (!label) throw new Error("Invalid access code");

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const email = `${code === "ES#1Research" ? "lead" : "admin"}@codeaccess.local`;

    const { data: existing } = await supa.from("admin_users").select("id").eq("email", email).maybeSingle();
    if (existing) {
      await supa.from("admin_users").update({ session_token: token, full_name: label }).eq("id", existing.id);
    } else {
      const { error } = await supa.from("admin_users").insert({
        email, full_name: label, password_hash: "code-access", session_token: token,
      });
      if (error) throw error;
    }
    return json({ ok: true, token, label });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}
