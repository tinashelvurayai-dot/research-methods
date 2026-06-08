import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function requireAdmin(req: Request, supa: ReturnType<typeof createClient>) {
  const token = req.headers.get("x-admin-token") || "";
  if (!token) throw new Error("Admin token required");
  const { data } = await supa.from("admin_users").select("id").eq("session_token", token).maybeSingle();
  if (!data) throw new Error("Unauthorized");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await requireAdmin(req, supa);
    const { action, id, banned, response } = await req.json();
    if (action === "reject") await supa.from("access_requests").update({ status: "rejected" }).eq("id", id);
    else if (action === "ban") await supa.from("app_users").update({ banned: !!banned }).eq("id", id);
    else if (action === "reply") await supa.from("support_tickets").update({ admin_response: response, status: "closed" }).eq("id", id);
    else throw new Error("Unknown action");
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}