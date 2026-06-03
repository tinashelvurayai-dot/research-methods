import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { adminSignIn } from "@/lib/admin.functions";
import { setAdminSession } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin - Research Methods" }] }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const m = useMutation({
    mutationFn: () => adminSignIn({ data: form }),
    onSuccess: (r) => { setAdminSession(r); toast.success("Welcome"); nav({ to: "/admin" }); },
    onError: (e: any) => toast.error(e.message ?? "Sign-in failed"),
  });
  return (
    <div className="min-h-screen bg-navy text-white">
      <div className="mx-auto max-w-md px-6 py-16">
        <Link to="/" className="text-sm text-white/60 hover:text-white">← Home</Link>
        <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
          className="mt-6 rounded-2xl bg-white p-8 text-[var(--foreground)] shadow-card">
          <h1 className="text-2xl font-bold">Admin sign in</h1>
          <div className="mt-6 space-y-4">
            <div><Label htmlFor="e">Email</Label>
              <Input id="e" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="p">Password</Label>
              <Input id="p" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={m.isPending}>
            {m.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}