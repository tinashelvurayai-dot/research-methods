import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { submitTicket } from "@/lib/rm.functions";
import { getSession, useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — Research Methods" }] }),
  component: Page,
});

function Page() {
  const session = useSession();
  const nav = useNavigate();
  useEffect(() => { if (session === null && getSession() === null) nav({ to: "/signin" }); }, [session, nav]);
  const [form, setForm] = useState({ subject: "", message: "" });
  const m = useMutation({
    mutationFn: () => submitTicket({ data: { token: session!.token, ...form } }),
    onSuccess: () => { toast.success("Ticket submitted"); setForm({ subject: "", message: "" }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  if (!session) return null;
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-white">
          <Link to="/dashboard" className="text-sm hover:underline">← Dashboard</Link>
          <div className="font-bold">Support</div>
          <div />
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-10">
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
          className="rounded-2xl bg-card p-8 shadow-card">
          <h1 className="text-2xl font-bold">Contact support</h1>
          <p className="mt-2 text-sm text-muted-foreground">We reply to industrialautomation@gmail.com.</p>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="s">Subject</Label>
              <Input id="s" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="m">Message</Label>
              <Textarea id="m" rows={6} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={m.isPending}>
            {m.isPending ? "Sending…" : "Submit ticket"}
          </Button>
        </form>
      </main>
    </div>
  );
}