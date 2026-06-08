import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const [{ data: requests }, { data: users }, { data: tickets }, { count: topicCount }, { count: cardCount }] = await Promise.all([
      supa.from("access_requests").select("*").order("created_at", { ascending: false }),
      supa.from("app_users").select("*").order("created_at", { ascending: false }),
      supa.from("support_tickets").select("*").order("created_at", { ascending: false }),
      supa.from("topics").select("id", { count: "exact", head: true }),
      supa.from("cards").select("id", { count: "exact", head: true }),
    ]);
    return json({ requests: requests || [], users: users || [], tickets: tickets || [], topicCount: topicCount || 0, cardCount: cardCount || 0 });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}