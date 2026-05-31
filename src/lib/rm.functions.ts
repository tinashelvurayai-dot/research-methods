import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// --------- helpers ---------
function genToken(len = 32) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function genAccessCode() {
  const part = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `RM-${part()}-${part()}`;
}
async function requireSession(token: string) {
  const { data, error } = await supabaseAdmin
    .from("user_sessions")
    .select("user_id, expires_at, app_users:user_id (id, full_name, email, whatsapp, access_code, banned)")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) throw new Error("Not signed in");
  if (new Date(data.expires_at) < new Date()) throw new Error("Session expired");
  const u: any = data.app_users;
  if (!u || u.banned) throw new Error("Account unavailable");
  return u as { id: string; full_name: string; email: string; whatsapp: string | null; access_code: string };
}

// --------- PUBLIC: request access ---------
export const requestAccess = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      full_name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(200),
      whatsapp: z.string().trim().min(5).max(40),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("access_requests").insert({
      full_name: data.full_name,
      email: data.email.toLowerCase(),
      whatsapp: data.whatsapp,
    });
    if (error) throw new Error(error.message);
    const { data: agent } = await supabaseAdmin
      .from("agent_settings").select("name, contact").eq("id", 1).maybeSingle();
    return { ok: true, agent: agent ?? { name: "Research Methods Agent", contact: "" } };
  });

// --------- PUBLIC: get agent + pricing for landing/request ---------
export const getPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const [{ data: agent }, { data: pricing }] = await Promise.all([
    supabaseAdmin.from("agent_settings").select("name, contact").eq("id", 1).maybeSingle(),
    supabaseAdmin.from("pricing_settings").select("individual_price, group_price").eq("id", 1).maybeSingle(),
  ]);
  return {
    agent: agent ?? { name: "Research Methods Agent", contact: "" },
    pricing: pricing ?? { individual_price: 5, group_price: 8 },
  };
});

// --------- PUBLIC: sample cards (first 5 of foundations) ---------
export const getSampleCards = createServerFn({ method: "GET" }).handler(async () => {
  const { data: topic } = await supabaseAdmin
    .from("topics").select("id, name").eq("slug", "foundations").maybeSingle();
  if (!topic) return { topic: null, cards: [] };
  const { data: cards } = await supabaseAdmin
    .from("cards").select("id, question, answer, difficulty")
    .eq("topic_id", topic.id).order("order_index").limit(5);
  return { topic, cards: cards ?? [] };
});

// --------- AUTH: sign in with name + code ---------
export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      full_name: z.string().trim().min(2).max(120),
      access_code: z.string().trim().min(4).max(40),
      remember: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const code = data.access_code.toUpperCase();
    const { data: user } = await supabaseAdmin
      .from("app_users")
      .select("id, full_name, email, whatsapp, access_code, banned")
      .eq("access_code", code)
      .maybeSingle();
    if (!user) throw new Error("Invalid full name or access code");
    if (user.banned) throw new Error("Account is suspended");
    if (user.full_name.trim().toLowerCase() !== data.full_name.trim().toLowerCase()) {
      throw new Error("Invalid full name or access code");
    }
    const token = genToken(40);
    const days = data.remember ? 30 : 1;
    const expires = new Date(Date.now() + days * 86400_000).toISOString();
    await supabaseAdmin.from("user_sessions").insert({ token, user_id: user.id, expires_at: expires });
    await supabaseAdmin.from("app_users").update({ last_login: new Date().toISOString() }).eq("id", user.id);
    return {
      token,
      user: {
        id: user.id, full_name: user.full_name, email: user.email,
        whatsapp: user.whatsapp, access_code: user.access_code,
      },
    };
  });

export const signOut = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("user_sessions").delete().eq("token", data.token);
    return { ok: true };
  });

export const getMe = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await requireSession(data.token);
    return { user };
  });

// --------- USER DATA ---------
export const getTopics = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const user = await requireSession(data.token);
    const { data: topics } = await supabaseAdmin
      .from("topics").select("id, slug, name, description, order_index").order("order_index");
    const { data: cards } = await supabaseAdmin
      .from("cards").select("id, topic_id, difficulty");
    const { data: progress } = await supabaseAdmin
      .from("card_progress").select("card_id, status").eq("user_id", user.id);
    const seen = new Set((progress ?? []).map((p) => p.card_id));
    const byTopic: Record<string, { total: number; easy: number; medium: number; hard: number; done: number }> = {};
    (cards ?? []).forEach((c) => {
      const t = byTopic[c.topic_id] ?? { total: 0, easy: 0, medium: 0, hard: 0, done: 0 };
      t.total++;
      t[c.difficulty as "easy" | "medium" | "hard"]++;
      if (seen.has(c.id)) t.done++;
      byTopic[c.topic_id] = t;
    });
    return {
      topics: (topics ?? []).map((t) => ({ ...t, stats: byTopic[t.id] ?? { total: 0, easy: 0, medium: 0, hard: 0, done: 0 } })),
    };
  });

export const getTopicCards = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireSession(data.token);
    const { data: topic } = await supabaseAdmin
      .from("topics").select("id, name, description, slug").eq("slug", data.slug).maybeSingle();
    if (!topic) throw new Error("Topic not found");
    const { data: cards } = await supabaseAdmin
      .from("cards").select("id, question, answer, difficulty, order_index")
      .eq("topic_id", topic.id).order("order_index");
    return { topic, cards: cards ?? [] };
  });

export const markCardSeen = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), card_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const user = await requireSession(data.token);
    await supabaseAdmin
      .from("card_progress")
      .upsert({ user_id: user.id, card_id: data.card_id, status: "seen", updated_at: new Date().toISOString() });
    return { ok: true };
  });

// --------- SUPPORT ---------
export const submitTicket = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      token: z.string(),
      subject: z.string().trim().min(2).max(200),
      message: z.string().trim().min(2).max(4000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await requireSession(data.token);
    const { error } = await supabaseAdmin.from("support_tickets").insert({
      user_id: user.id, user_email: user.email, user_name: user.full_name,
      subject: data.subject, message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });