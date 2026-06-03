import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { signIn } from "@/lib/rm.functions";
import { setSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/signin")({
  head: () => ({ meta: [
    { title: "Sign in - Research Methods" },
    { name: "description", content: "Sign in with your full name and access code." },
  ]}),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", access_code: "", remember: true });
  const m = useMutation({
    mutationFn: () => signIn({ data: form }),
    onSuccess: (r) => { setSession(r); toast.success(`Welcome, ${r.user.full_name}`); nav({ to: "/dashboard" }); },
    onError: (e: any) => toast.error(e.message ?? "Sign-in failed"),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-white">
          <Link to="/" className="text-sm hover:underline">← Back</Link>
          <div className="font-bold">Research Methods</div>
          <Link to="/request-access" className="text-sm hover:underline">Request access</Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-6 py-12">
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
          className="rounded-2xl bg-card p-8 shadow-card">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your full name and the access code you received by email.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="n">Full name</Label>
              <Input id="n" required value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="c">Access code</Label>
              <Input id="c" required placeholder="RM-XXXX-YYYY" value={form.access_code}
                onChange={(e) => setForm({ ...form, access_code: e.target.value.toUpperCase() })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.remember}
                onCheckedChange={(v) => setForm({ ...form, remember: !!v })} />
              Remember me for 30 days
            </label>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={m.isPending}>
            {m.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </main>
    </div>
  );
}