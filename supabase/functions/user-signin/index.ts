import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { full_name, access_code, user_id } = await req.json();
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let query = supa.from("app_users").select("id, full_name, email, access_code, banned");
    query = user_id ? query.eq("id", String(user_id)) : query.eq("access_code", String(access_code || "").trim().toUpperCase());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Invalid access code");
    if (data.banned) throw new Error("Account is suspended");
    if (!user_id && data.full_name.trim().toLowerCase() !== String(full_name || "").trim().toLowerCase()) {
      throw new Error("Name does not match this code");
    }
    await supa.from("app_users").update({ last_login: new Date().toISOString() }).eq("id", data.id);
    return json({ ok: true, user: data });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}