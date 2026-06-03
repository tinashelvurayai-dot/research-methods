import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// PBKDF2 hash format: pbkdf2$iterations$saltHex$hashHex
async function pbkdf2(password: string, saltHex: string, iterations: number) {
  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key, 256,
  );
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function verifyPassword(password: string, stored: string) {
  const [scheme, iterStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const got = await pbkdf2(password, saltHex, parseInt(iterStr, 10));
  return got === hashHex;
}
async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = await pbkdf2(password, saltHex, 100000);
  return `pbkdf2$100000$${saltHex}$${hashHex}`;
}
function genToken(len = 40) {
  const buf = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function genAccessCode() {
  const part = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `RM-${part()}-${part()}`;
}

const ADMIN_TABLE = "admin_users";
const SESSIONS_TABLE = "admin_sessions";

async function requireAdmin(token: string) {
  // Use user_sessions table-like approach: store admin sessions in app_settings? Better: a dedicated table.
  // For simplicity reuse user_sessions but namespaced with prefix "admin:" — instead use admin_users.last_token field.
  // Easiest: store token in admin_users row.
  const { data } = await supabaseAdmin
    .from(ADMIN_TABLE).select("id, email, full_name").eq("session_token", token).maybeSingle();
  if (!data) throw new Error("Not signed in as admin");
  return data as { id: string; email: string; full_name: string | null };
}

// --- AUTH ---
export const adminSignIn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email(), password: z.string().min(4) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from(ADMIN_TABLE).select("id, email, password_hash, full_name").eq("email", data.email.toLowerCase()).maybeSingle();
    if (!row) throw new Error("Invalid credentials");
    const ok = await verifyPassword(data.password, row.password_hash);
    if (!ok) throw new Error("Invalid credentials");
    const token = genToken();
    await supabaseAdmin.from(ADMIN_TABLE).update({ session_token: token }).eq("id", row.id);
    return { token, admin: { id: row.id, email: row.email, full_name: row.full_name } };
  });

export const adminSignOut = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from(ADMIN_TABLE).update({ session_token: null }).eq("session_token", data.token);
    return { ok: true };
  });

export const adminMe = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => requireAdmin(data.token));

export const adminChangePassword = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), new_password: z.string().min(8).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const a = await requireAdmin(data.token);
    const hash = await hashPassword(data.new_password);
    await supabaseAdmin.from(ADMIN_TABLE).update({ password_hash: hash }).eq("id", a.id);
    return { ok: true };
  });

// --- REQUESTS ---
export const adminListRequests = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: rows } = await supabaseAdmin.from("access_requests")
      .select("id, full_name, email, whatsapp, status, created_at, approved_at, access_code, notes")
      .order("created_at", { ascending: false });
    return { requests: rows ?? [] };
  });

export const adminApproveRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), request_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: req } = await supabaseAdmin.from("access_requests")
      .select("*").eq("id", data.request_id).maybeSingle();
    if (!req) throw new Error("Request not found");
    if (req.status === "approved") return { ok: true, code: req.access_code };
    const code = genAccessCode();
    const { error: insErr } = await supabaseAdmin.from("app_users").insert({
      full_name: req.full_name, email: req.email, whatsapp: req.whatsapp, access_code: code,
    });
    if (insErr) throw new Error(insErr.message);
    await supabaseAdmin.from("access_requests").update({
      status: "approved", access_code: code, approved_at: new Date().toISOString(),
    }).eq("id", req.id);

    // Best-effort email via Lovable transactional emails (no-op if not configured).
    try {
      const res = await fetch(`${process.env.SUPABASE_URL ?? ""}`.replace(/\/$/, "") ? "/lovable/email/transactional/send" : "/__noop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: "access-approved",
          recipientEmail: req.email,
          idempotencyKey: `access-approved-${req.id}`,
          templateData: { full_name: req.full_name, access_code: code },
        }),
      });
      if (!res.ok) console.warn("approval email skipped:", res.status);
    } catch (e) { console.warn("approval email failed:", e); }

    return { ok: true, code };
  });

export const adminRejectRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), request_id: z.string().uuid(), notes: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("access_requests").update({ status: "rejected", notes: data.notes ?? null }).eq("id", data.request_id);
    return { ok: true };
  });

// --- USERS ---
export const adminListUsers = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), search: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    let q = supabaseAdmin.from("app_users")
      .select("id, full_name, email, whatsapp, access_code, banned, last_login, created_at")
      .order("created_at", { ascending: false });
    if (data.search && data.search.trim()) {
      const s = `%${data.search.trim()}%`;
      q = q.or(`full_name.ilike.${s},email.ilike.${s},access_code.ilike.${s}`);
    }
    const { data: rows } = await q;
    return { users: rows ?? [] };
  });

export const adminToggleBan = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), user_id: z.string().uuid(), banned: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("app_users").update({ banned: data.banned }).eq("id", data.user_id);
    return { ok: true };
  });

export const adminRegenCode = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const code = genAccessCode();
    await supabaseAdmin.from("app_users").update({ access_code: code }).eq("id", data.user_id);
    return { ok: true, code };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("app_users").delete().eq("id", data.user_id);
    return { ok: true };
  });

// --- TOPICS ---
export const adminListTopics = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: rows } = await supabaseAdmin.from("topics")
      .select("id, slug, name, description, order_index").order("order_index");
    return { topics: rows ?? [] };
  });

export const adminUpsertTopic = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    token: z.string(),
    id: z.string().uuid().optional(),
    slug: z.string().min(1).max(80),
    name: z.string().min(1).max(160),
    description: z.string().max(1000).optional(),
    order_index: z.number().int().min(0).max(9999).default(0),
  }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const payload = { slug: data.slug, name: data.name, description: data.description ?? null, order_index: data.order_index };
    if (data.id) {
      await supabaseAdmin.from("topics").update(payload).eq("id", data.id);
    } else {
      await supabaseAdmin.from("topics").insert(payload);
    }
    return { ok: true };
  });

export const adminDeleteTopic = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("cards").delete().eq("topic_id", data.id);
    await supabaseAdmin.from("topics").delete().eq("id", data.id);
    return { ok: true };
  });

// --- CARDS ---
export const adminListCards = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), topic_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: rows } = await supabaseAdmin.from("cards")
      .select("id, topic_id, question, answer, difficulty, order_index")
      .eq("topic_id", data.topic_id).order("order_index");
    return { cards: rows ?? [] };
  });

export const adminUpsertCard = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    token: z.string(),
    id: z.string().uuid().optional(),
    topic_id: z.string().uuid(),
    question: z.string().min(1).max(4000),
    answer: z.string().min(1).max(8000),
    difficulty: z.enum(["easy", "medium", "hard"]),
    order_index: z.number().int().min(0).max(99999).default(0),
  }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const payload = {
      topic_id: data.topic_id, question: data.question, answer: data.answer,
      difficulty: data.difficulty, order_index: data.order_index,
    };
    if (data.id) {
      await supabaseAdmin.from("cards").update(payload).eq("id", data.id);
    } else {
      await supabaseAdmin.from("cards").insert(payload);
    }
    return { ok: true };
  });

export const adminDeleteCard = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string(), id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("cards").delete().eq("id", data.id);
    return { ok: true };
  });

// --- TICKETS ---
export const adminListTickets = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: rows } = await supabaseAdmin.from("support_tickets")
      .select("id, user_id, user_email, user_name, subject, message, admin_response, status, created_at")
      .order("created_at", { ascending: false });
    return { tickets: rows ?? [] };
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    token: z.string(),
    ticket_id: z.string().uuid(),
    response: z.string().min(1).max(8000),
  }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const { data: t } = await supabaseAdmin.from("support_tickets")
      .select("id, user_email, user_name, subject, message").eq("id", data.ticket_id).maybeSingle();
    if (!t) throw new Error("Ticket not found");
    await supabaseAdmin.from("support_tickets").update({
      admin_response: data.response, status: "resolved",
    }).eq("id", data.ticket_id);
    try {
      await fetch("/lovable/email/transactional/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateName: "ticket-reply", recipientEmail: t.user_email!,
          idempotencyKey: `ticket-reply-${t.id}-${Date.now()}`,
          templateData: {
            full_name: t.user_name, subject: t.subject, original: t.message, reply: data.response,
          },
        }),
      });
    } catch (e) { console.warn("ticket reply email failed:", e); }
    return { ok: true };
  });

// --- SETTINGS (pricing + agent) ---
export const adminGetSettings = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    const [{ data: agent }, { data: pricing }] = await Promise.all([
      supabaseAdmin.from("agent_settings").select("name, contact, notes").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("pricing_settings").select("individual_price, group_price").eq("id", 1).maybeSingle(),
    ]);
    return { agent, pricing };
  });

export const adminSaveAgent = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    token: z.string(),
    name: z.string().min(1).max(160),
    contact: z.string().min(1).max(160),
    notes: z.string().max(1000).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("agent_settings").upsert({
      id: 1, name: data.name, contact: data.contact, notes: data.notes ?? null,
    });
    return { ok: true };
  });

export const adminSavePricing = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    token: z.string(),
    individual_price: z.number().min(0).max(10000),
    group_price: z.number().min(0).max(10000),
  }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin(data.token);
    await supabaseAdmin.from("pricing_settings").upsert({
      id: 1, individual_price: data.individual_price, group_price: data.group_price,
    });
    return { ok: true };
  });