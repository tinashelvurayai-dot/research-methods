// Approve an access request: generate a code, create the app_user, mark request approved.
// No email is sent — the admin sends the code from their own Gmail.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function randCode() {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RM-${seg()}-${seg()}`;
}

async function requireAdmin(req: Request, supa: ReturnType<typeof createClient>) {
  const token = req.headers.get("x-admin-token") || "";
  if (!token) throw new Error("Admin token required");
  const { data } = await supa.from("admin_users").select("id").eq("session_token", token).maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await requireAdmin(req, supa);

    const { request_id } = await req.json();
    if (!request_id) throw new Error("request_id required");
    const { data: row } = await supa.from("access_requests").select("*").eq("id", request_id).maybeSingle();
    if (!row) throw new Error("Request not found");
    if (!row.email) throw new Error("Request has no email");

    const code = row.access_code || randCode();

    if (!row.access_code) {
      // Create / upsert app_user with this code
      const { data: existing } = await supa
        .from("app_users")
        .select("id")
        .eq("email", row.email)
        .maybeSingle();
      if (existing) {
        await supa.from("app_users").update({
          full_name: row.full_name, access_code: code, whatsapp: row.whatsapp, banned: false,
        }).eq("id", existing.id);
      } else {
        await supa.from("app_users").insert({
          full_name: row.full_name, email: row.email, whatsapp: row.whatsapp, access_code: code,
        });
      }
      await supa.from("access_requests").update({
        status: "approved", access_code: code, approved_at: new Date().toISOString(),
      }).eq("id", row.id);
    }

    return json({ ok: true, code, email: row.email, full_name: row.full_name });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}