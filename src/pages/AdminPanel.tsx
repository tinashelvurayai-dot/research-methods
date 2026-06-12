import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Users, Inbox, CheckCircle2, Clock, Mail, Search, Ban, RotateCcw,
  ShieldCheck, BookOpen, MessageSquare, Copy, LogOut, TrendingUp,
  Calendar, Filter, Flame, AlertTriangle, X,
} from "lucide-react";

interface Req {
  id: string; full_name: string; email: string; whatsapp: string;
  status: string; access_code: string | null; created_at: string; notes: string | null;
  approved_at?: string | null;
}
interface User {
  id: string; full_name: string; email: string; access_code: string;
  whatsapp: string | null; banned: boolean; created_at: string; last_login: string | null;
}
interface Ticket {
  id: string; subject: string; message: string; status: string;
  user_email: string | null; user_name: string | null; created_at: string;
}

function adminToken() {
  return localStorage.getItem("rm.admin.token.v1") || "";
}

function buildGmailUrl(to: string, fullName: string, code: string) {
  const subject = "Your Research Methods access code";
  const body =
`Hi ${fullName},

Your access has been approved.

How to sign in:
1. Open the Research Methods app
2. Tap "I have a code"
3. Enter your full name: ${fullName}
4. Enter this access code: ${code}

Keep this code private — it's tied to your name.

— Research Methods`;
  const params = new URLSearchParams({
    view: "cm", fs: "1", to, su: subject, body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function AdminPanel() {
  const { signOut, adminEmail } = useAuth();
  const nav = useNavigate();
  const [requests, setRequests] = useState<Req[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [topicCount, setTopicCount] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [reqFilter, setReqFilter] = useState<"all" | "pending" | "approved" | "rejected" | "today" | "stale">("all");
  const [reqSearch, setReqSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-data", {
      headers: { "x-admin-token": adminToken() },
    });
    if (error || (data as any)?.error) toast.error(error?.message || (data as any)?.error || "Could not load admin data");
    setRequests(((data as any)?.requests as Req[]) || []);
    setUsers(((data as any)?.users as User[]) || []);
    setTickets(((data as any)?.tickets as Ticket[]) || []);
    setTopicCount((data as any)?.topicCount || 0);
    setCardCount((data as any)?.cardCount || 0);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("access-approve", {
      body: { request_id: id },
      headers: { "x-admin-token": adminToken() },
    });
    if (error || (data as any)?.error) { toast.error(error?.message || (data as any)?.error); return; }
    toast.success("Approved · code generated");
    load();
  };

  const reject = async (id: string) => {
    await supabase.functions.invoke("admin-action", { body: { action: "reject", id }, headers: { "x-admin-token": adminToken() } });
    toast.success("Rejected");
    load();
  };

  const toggleBan = async (u: User) => {
    await supabase.functions.invoke("admin-action", { body: { action: "ban", id: u.id, banned: !u.banned }, headers: { "x-admin-token": adminToken() } });
    toast.success(u.banned ? "Unbanned" : "Banned");
    load();
  };

  const copy = async (text: string, label = "Copied") => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const replyTicket = async (t: Ticket, response: string) => {
    if (!response.trim()) return;
    await supabase.functions.invoke("admin-action", { body: { action: "reply", id: t.id, response }, headers: { "x-admin-token": adminToken() } });
    toast.success("Reply saved");
    load();
  };

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);

  function classify(r: Req) {
    const ageH = (Date.now() - new Date(r.created_at).getTime()) / 3.6e6;
    if (r.status === "pending" && ageH > 48) return { label: "Stale", tone: "destructive" as const, icon: AlertTriangle };
    if (r.status === "pending" && ageH < 6) return { label: "Hot", tone: "default" as const, icon: Flame };
    if (r.status === "approved" && ageH < 24) return { label: "Fresh approval", tone: "secondary" as const, icon: CheckCircle2 };
    return null;
  }

  const filteredRequests = useMemo(() => {
    const s = reqSearch.trim().toLowerCase();
    return requests.filter((r) => {
      if (reqFilter === "pending" && r.status !== "pending") return false;
      if (reqFilter === "approved" && r.status !== "approved") return false;
      if (reqFilter === "rejected" && r.status !== "rejected") return false;
      if (reqFilter === "today" && Date.now() - new Date(r.created_at).getTime() > 864e5) return false;
      if (reqFilter === "stale" && !(r.status === "pending" && Date.now() - new Date(r.created_at).getTime() > 48 * 3.6e6)) return false;
      if (!s) return true;
      return (
        r.full_name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.whatsapp || "").toLowerCase().includes(s) ||
        (r.access_code || "").toLowerCase().includes(s)
      );
    });
  }, [requests, reqFilter, reqSearch]);

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      u.full_name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.access_code.toLowerCase().includes(s));
  }, [q, users]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-secondary mb-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Admin
            </div>
            <h1 className="text-3xl font-bold">Control room</h1>
            <p className="text-sm text-muted-foreground">Approve students, manage access codes and respond to support.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => { signOut(); nav("/"); }}>
            <LogOut className="h-4 w-4 mr-1" /> Sign out
          </Button>
        </div>
        {adminEmail && (
          <p className="text-xs text-muted-foreground -mt-2">Signed in as <span className="text-secondary">{adminEmail}</span></p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Inbox} label="Pending" value={pending.length} accent="text-secondary" />
          <StatCard icon={Users} label="Active users" value={users.filter((u) => !u.banned).length} accent="text-primary" />
          <StatCard icon={BookOpen} label="Cards" value={cardCount} subtitle={`${topicCount} topics`} />
          <StatCard icon={MessageSquare} label="Open tickets" value={tickets.filter((t) => t.status === "open").length} />
        </div>

        {/* Activity summary */}
        <Card className="p-4 bg-card/60">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <strong>Last 7 days</strong>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="text-2xl font-bold">{requests.filter(r => Date.now() - new Date(r.created_at).getTime() < 7*864e5).length}</div><div className="text-xs text-muted-foreground">New requests</div></div>
            <div><div className="text-2xl font-bold">{users.filter(u => Date.now() - new Date(u.created_at).getTime() < 7*864e5).length}</div><div className="text-xs text-muted-foreground">New users</div></div>
            <div><div className="text-2xl font-bold">{tickets.filter(t => Date.now() - new Date(t.created_at).getTime() < 7*864e5).length}</div><div className="text-xs text-muted-foreground">New tickets</div></div>
          </div>
        </Card>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">
              Requests {pending.length > 0 && <Badge className="ml-2" variant="secondary">{pending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* Requests */}
          <TabsContent value="requests" className="mt-4 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 pr-8" placeholder="Search name, email, WhatsApp or code" value={reqSearch} onChange={(e) => setReqSearch(e.target.value)} />
                {reqSearch && (
                  <button onClick={() => setReqSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 items-center text-xs">
                <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                {(["all", "pending", "approved", "rejected", "today", "stale"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setReqFilter(k)}
                    className={`px-2.5 py-1 rounded-full border capitalize transition ${
                      reqFilter === k ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : filteredRequests.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">No access requests yet.</Card>
            ) : (
              filteredRequests.map((r) => {
                const tag = classify(r);
                const TagIcon = tag?.icon;
                return (
                <Card key={r.id} className="p-4 bg-card/60">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.full_name}</span>
                        <StatusBadge status={r.status} />
                        {tag && TagIcon && (
                          <Badge variant={tag.tone} className="gap-1 text-[10px]">
                            <TagIcon className="h-3 w-3" /> {tag.label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.email} · {r.whatsapp}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Requested {new Date(r.created_at).toLocaleString()}
                        </span>
                        <span className="text-secondary/80">· {timeAgo(r.created_at)}</span>
                        {r.approved_at && (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" /> Approved {new Date(r.approved_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {r.notes && <div className="text-xs italic text-muted-foreground">"{r.notes}"</div>}
                      {r.access_code && (
                        <div className="text-xs flex items-center gap-2 mt-1">
                          <span className="text-muted-foreground">Code:</span>
                          <code className="font-mono text-secondary">{r.access_code}</code>
                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => copy(r.access_code!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Reject</Button>
                          <Button size="sm" onClick={() => approve(r.id)} className="bg-brand-gradient text-primary-foreground">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        </>
                      )}
                      {r.access_code && (
                        <Button
                          size="sm"
                          variant="secondary"
                          asChild
                        >
                          <a
                            href={buildGmailUrl(r.email, r.full_name, r.access_code)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Mail className="h-4 w-4 mr-1" /> Open Gmail
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
                );
              })
            )}
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="mt-4 space-y-3">
            <div className="relative max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by name, email or code" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {filteredUsers.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">No users.</Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-2">
                {filteredUsers.map((u) => (
                  <Card key={u.id} className="p-3 bg-card/60">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-medium flex items-center gap-2">
                          {u.full_name}
                          {u.banned && <Badge variant="destructive">Banned</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                        <div className="text-xs flex items-center gap-2">
                          <code className="font-mono text-secondary">{u.access_code}</code>
                          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => copy(u.access_code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm" variant="outline"
                          asChild
                        >
                          <a
                            href={buildGmailUrl(u.email, u.full_name, u.access_code)}
                            target="_blank" rel="noopener noreferrer"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant={u.banned ? "outline" : "destructive"} onClick={() => toggleBan(u)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Support */}
          <TabsContent value="support" className="mt-4 space-y-2">
            {tickets.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">No tickets.</Card>
            ) : (
              tickets.map((t) => <TicketRow key={t.id} t={t} onReply={replyTicket} />)
            )}
          </TabsContent>

          {/* Content */}
          <TabsContent value="content" className="mt-4">
            <Card className="p-5 bg-card/60 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-secondary" />
                <strong>{cardCount}</strong> cards across <strong>{topicCount}</strong> topics
              </div>
              <p className="text-xs text-muted-foreground">
                Content is sourced from the bundled syllabus and stored in the database. To add or edit cards, update the seed data and reseed.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, accent }: {
  icon: any; label: string; value: number; subtitle?: string; accent?: string;
}) {
  return (
    <Card className="p-4 bg-card/60">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent || "text-muted-foreground"}`} />
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: any = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary";
  const Icon = status === "approved" ? CheckCircle2 : status === "rejected" ? Ban : Clock;
  return (
    <Badge variant={variant} className="capitalize">
      <Icon className="h-3 w-3 mr-1" /> {status}
    </Badge>
  );
}

function TicketRow({ t, onReply }: { t: Ticket; onReply: (t: Ticket, r: string) => void }) {
  const [reply, setReply] = useState("");
  const mailto = t.user_email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(t.user_email)}&su=${encodeURIComponent("Re: " + t.subject)}&body=${encodeURIComponent(reply || "Hi,\n\n")}`
    : "";
  return (
    <Card className="p-4 bg-card/60 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-medium">{t.subject}</div>
          <div className="text-xs text-muted-foreground">{t.user_name || t.user_email || "Unknown"} · {new Date(t.created_at).toLocaleString()}</div>
        </div>
        <Badge variant={t.status === "open" ? "secondary" : "default"} className="capitalize">{t.status}</Badge>
      </div>
      <p className="text-sm whitespace-pre-wrap">{t.message}</p>
      <div className="flex gap-2 items-start">
        <Textarea rows={2} placeholder="Type a quick reply…" value={reply} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReply(e.target.value)} className="min-h-[60px] flex-1" />
        {t.user_email && (
          <Button asChild variant="outline" size="sm">
            <a href={mailto} target="_blank" rel="noopener noreferrer"><Mail className="h-4 w-4 mr-1" /> Gmail</a>
          </Button>
        )}
        <Button size="sm" onClick={() => { onReply(t, reply); setReply(""); }}>Save</Button>
      </div>
    </Card>
  );
}