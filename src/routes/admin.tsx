import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAdminSession, setAdminSession, useAdminSession } from "@/lib/admin-session";
import {
  adminSignOut, adminListRequests, adminApproveRequest, adminRejectRequest,
  adminListUsers, adminToggleBan, adminRegenCode, adminDeleteUser,
  adminListTopics, adminUpsertTopic, adminDeleteTopic,
  adminListCards, adminUpsertCard, adminDeleteCard,
  adminListTickets, adminReplyTicket,
  adminGetSettings, adminSaveAgent, adminSavePricing, adminChangePassword,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin - Research Methods" }] }),
  component: AdminPage,
});

function AdminPage() {
  const s = useAdminSession();
  const nav = useNavigate();
  useEffect(() => { if (s === null && getAdminSession() === null) nav({ to: "/admin/login" }); }, [s, nav]);
  if (!s) return null;
  const token = s.token;
  const logout = async () => {
    await adminSignOut({ data: { token } }).catch(() => {});
    setAdminSession(null); nav({ to: "/admin/login" });
  };
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-bold">Research Methods · Admin</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-70">{s.admin.email}</span>
            <button onClick={logout} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="flex h-auto flex-wrap gap-1 bg-secondary p-1">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="requests"><Requests token={token} /></TabsContent>
          <TabsContent value="users"><Users token={token} /></TabsContent>
          <TabsContent value="topics"><Topics token={token} /></TabsContent>
          <TabsContent value="cards"><Cards token={token} /></TabsContent>
          <TabsContent value="tickets"><Tickets token={token} /></TabsContent>
          <TabsContent value="pricing"><Pricing token={token} /></TabsContent>
          <TabsContent value="agent"><Agent token={token} /></TabsContent>
          <TabsContent value="settings"><Settings token={token} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 rounded-xl border bg-card p-5 shadow-card">{children}</div>;
}

function Requests({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-reqs"], queryFn: () => adminListRequests({ data: { token } }) });
  const approve = useMutation({
    mutationFn: (id: string) => adminApproveRequest({ data: { token, request_id: id } }),
    onSuccess: (r) => { toast.success(`Approved · code ${r.code}`); qc.invalidateQueries({ queryKey: ["admin-reqs"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: (id: string) => adminRejectRequest({ data: { token, request_id: id } }),
    onSuccess: () => { toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["admin-reqs"] }); },
  });
  return (
    <Card>
      <h2 className="text-lg font-semibold">Access requests</h2>
      <div className="mt-4 space-y-3">
        {data?.requests.length ? data.requests.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div className="text-sm">
              <div className="font-semibold">{r.full_name} <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-xs">{r.status}</span></div>
              <div className="text-muted-foreground">{r.email} · {r.whatsapp}</div>
              {r.access_code ? <div className="font-mono text-xs">{r.access_code}</div> : null}
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve.mutate(r.id)}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => reject.mutate(r.id)}>Reject</Button>
              </div>
            )}
          </div>
        )) : <div className="text-sm text-muted-foreground">No requests yet.</div>}
      </div>
    </Card>
  );
}

function Users({ token }: { token: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data } = useQuery({ queryKey: ["admin-users", search], queryFn: () => adminListUsers({ data: { token, search } }) });
  const ban = useMutation({
    mutationFn: (v: { id: string; banned: boolean }) => adminToggleBan({ data: { token, user_id: v.id, banned: v.banned } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const regen = useMutation({
    mutationFn: (id: string) => adminRegenCode({ data: { token, user_id: id } }),
    onSuccess: (r) => { toast.success(`New code: ${r.code}`); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteUser({ data: { token, user_id: id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users</h2>
        <Input placeholder="Search..." className="max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mt-4 space-y-2">
        {data?.users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <div>
              <div className="font-semibold">{u.full_name} {u.banned ? <span className="ml-2 rounded bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">banned</span> : null}</div>
              <div className="text-muted-foreground">{u.email}</div>
              <div className="font-mono text-xs">{u.access_code}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => ban.mutate({ id: u.id, banned: !u.banned })}>{u.banned ? "Unban" : "Ban"}</Button>
              <Button size="sm" variant="outline" onClick={() => regen.mutate(u.id)}>New code</Button>
              <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete user?")) del.mutate(u.id); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Topics({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-topics"], queryFn: () => adminListTopics({ data: { token } }) });
  const [form, setForm] = useState({ id: "", slug: "", name: "", description: "", order_index: 0 });
  const save = useMutation({
    mutationFn: () => adminUpsertTopic({ data: { token, id: form.id || undefined, slug: form.slug, name: form.name, description: form.description, order_index: form.order_index } }),
    onSuccess: () => { toast.success("Saved"); setForm({ id: "", slug: "", name: "", description: "", order_index: 0 }); qc.invalidateQueries({ queryKey: ["admin-topics"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteTopic({ data: { token, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-topics"] }),
  });
  return (
    <Card>
      <h2 className="text-lg font-semibold">Topics</h2>
      <div className="mt-4 grid gap-2 md:grid-cols-5">
        <Input placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <Input placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input type="number" placeholder="order" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })} />
        <Button onClick={() => save.mutate()}>{form.id ? "Update" : "Add"}</Button>
      </div>
      <div className="mt-4 space-y-2">
        {data?.topics.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <div><span className="font-semibold">{t.name}</span> <span className="ml-2 font-mono text-xs text-muted-foreground">{t.slug}</span></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setForm({ id: t.id, slug: t.slug, name: t.name, description: t.description ?? "", order_index: t.order_index })}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete topic + all cards?")) del.mutate(t.id); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Cards({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data: topicsData } = useQuery({ queryKey: ["admin-topics"], queryFn: () => adminListTopics({ data: { token } }) });
  const [topicId, setTopicId] = useState<string>("");
  useEffect(() => { if (!topicId && topicsData?.topics[0]) setTopicId(topicsData.topics[0].id); }, [topicsData, topicId]);
  const { data } = useQuery({ queryKey: ["admin-cards", topicId], queryFn: () => adminListCards({ data: { token, topic_id: topicId } }), enabled: !!topicId });
  const [form, setForm] = useState({ id: "", question: "", answer: "", difficulty: "medium" as "easy" | "medium" | "hard", order_index: 0 });
  const save = useMutation({
    mutationFn: () => adminUpsertCard({ data: { token, id: form.id || undefined, topic_id: topicId, question: form.question, answer: form.answer, difficulty: form.difficulty, order_index: form.order_index } }),
    onSuccess: () => { toast.success("Saved"); setForm({ id: "", question: "", answer: "", difficulty: "medium", order_index: 0 }); qc.invalidateQueries({ queryKey: ["admin-cards"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCard({ data: { token, id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cards"] }),
  });
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Cards</h2>
        <select className="rounded-md border px-3 py-2 text-sm" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
          {topicsData?.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="mt-4 grid gap-2">
        <Textarea placeholder="Question (LaTeX supported with $...$)" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <Textarea placeholder="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} />
        <div className="flex gap-2">
          <select className="rounded-md border px-3 py-2 text-sm" value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}>
            <option>easy</option><option>medium</option><option>hard</option>
          </select>
          <Input type="number" className="w-24" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })} />
          <Button onClick={() => save.mutate()}>{form.id ? "Update" : "Add card"}</Button>
          {form.id ? <Button variant="outline" onClick={() => setForm({ id: "", question: "", answer: "", difficulty: "medium", order_index: 0 })}>Cancel</Button> : null}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {data?.cards.map((c) => (
          <div key={c.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold line-clamp-2">{c.question}</div>
                <div className="mt-1 line-clamp-2 text-muted-foreground">{c.answer}</div>
                <div className="mt-1 text-xs text-muted-foreground">#{c.order_index} · {c.difficulty}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => setForm({ id: c.id, question: c.question, answer: c.answer, difficulty: c.difficulty as any, order_index: c.order_index })}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete card?")) del.mutate(c.id); }}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Tickets({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-tickets"], queryFn: () => adminListTickets({ data: { token } }) });
  const [replies, setReplies] = useState<Record<string, string>>({});
  const reply = useMutation({
    mutationFn: (v: { id: string; response: string }) => adminReplyTicket({ data: { token, ticket_id: v.id, response: v.response } }),
    onSuccess: () => { toast.success("Reply sent"); qc.invalidateQueries({ queryKey: ["admin-tickets"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Card>
      <h2 className="text-lg font-semibold">Support tickets</h2>
      <div className="mt-4 space-y-3">
        {data?.tickets.map((t) => (
          <div key={t.id} className="rounded-lg border p-3 text-sm">
            <div className="font-semibold">{t.subject} <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-xs">{t.status}</span></div>
            <div className="text-xs text-muted-foreground">{t.user_name} · {t.user_email}</div>
            <div className="mt-2 whitespace-pre-wrap">{t.message}</div>
            {t.admin_response ? (
              <div className="mt-2 rounded bg-secondary p-2 text-xs">Reply: {t.admin_response}</div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Textarea rows={2} value={replies[t.id] ?? ""} onChange={(e) => setReplies({ ...replies, [t.id]: e.target.value })} />
                <Button onClick={() => reply.mutate({ id: t.id, response: replies[t.id] ?? "" })}>Reply</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function Pricing({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-settings"], queryFn: () => adminGetSettings({ data: { token } }) });
  const [ind, setInd] = useState<number>(5);
  const [grp, setGrp] = useState<number>(8);
  useEffect(() => { if (data?.pricing) { setInd(Number(data.pricing.individual_price)); setGrp(Number(data.pricing.group_price)); } }, [data]);
  const save = useMutation({
    mutationFn: () => adminSavePricing({ data: { token, individual_price: ind, group_price: grp } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-settings"] }); qc.invalidateQueries({ queryKey: ["public-config"] }); },
  });
  return (
    <Card>
      <h2 className="text-lg font-semibold">Pricing</h2>
      <div className="mt-4 grid max-w-md gap-3">
        <div><Label>Individual price ($)</Label><Input type="number" value={ind} onChange={(e) => setInd(parseFloat(e.target.value) || 0)} /></div>
        <div><Label>Group price ($)</Label><Input type="number" value={grp} onChange={(e) => setGrp(parseFloat(e.target.value) || 0)} /></div>
        <Button onClick={() => save.mutate()}>Save</Button>
      </div>
    </Card>
  );
}

function Agent({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-settings"], queryFn: () => adminGetSettings({ data: { token } }) });
  const [form, setForm] = useState({ name: "", contact: "", notes: "" });
  useEffect(() => { if (data?.agent) setForm({ name: data.agent.name, contact: data.agent.contact, notes: data.agent.notes ?? "" }); }, [data]);
  const save = useMutation({
    mutationFn: () => adminSaveAgent({ data: { token, ...form } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-settings"] }); qc.invalidateQueries({ queryKey: ["public-config"] }); },
  });
  return (
    <Card>
      <h2 className="text-lg font-semibold">Agent</h2>
      <div className="mt-4 grid max-w-md gap-3">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Contact</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
        <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <Button onClick={() => save.mutate()}>Save</Button>
      </div>
    </Card>
  );
}

function Settings({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const change = useMutation({
    mutationFn: () => adminChangePassword({ data: { token, new_password: pw } }),
    onSuccess: () => { toast.success("Password updated"); setPw(""); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Card>
      <h2 className="text-lg font-semibold">Change password</h2>
      <div className="mt-4 grid max-w-sm gap-3">
        <Input type="password" placeholder="New password (min 8 chars)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button onClick={() => change.mutate()} disabled={pw.length < 8}>Update password</Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Email delivery for approvals + ticket replies activates as soon as the email domain finishes verifying.</p>
    </Card>
  );
}