import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminPanel() {
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    const [{ data: r }, { data: u }] = await Promise.all([
      supabase.from("access_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("app_users").select("*").order("created_at", { ascending: false }),
    ]);
    setRequests(r || []);
    setUsers(u || []);
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.functions.invoke("access-approve", { body: { request_id: id } });
    if (error) { toast.error(error.message); return; }
    toast.success("Approved - email sent");
    load();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Card className="p-5 bg-card/70">
          <h2 className="font-semibold mb-3">Access Requests ({requests.length})</h2>
          <div className="space-y-2">
            {requests.length === 0 && <p className="text-sm text-muted-foreground">No requests.</p>}
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded border border-border">
                <div>
                  <div className="font-medium">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">{r.email} · {r.whatsapp}</div>
                  <div className="text-xs text-secondary">Status: {r.status}</div>
                </div>
                {r.status === "pending" && (
                  <Button size="sm" onClick={() => approve(r.id)}>Approve</Button>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 bg-card/70">
          <h2 className="font-semibold mb-3">Users ({users.length})</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-2 rounded border border-border text-sm">
                <div>
                  <div className="font-medium">{u.full_name}</div>
                  <div className="text-xs text-muted-foreground">{u.email} · <span className="font-mono">{u.access_code}</span></div>
                </div>
                {u.banned && <span className="text-xs text-destructive">BANNED</span>}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}