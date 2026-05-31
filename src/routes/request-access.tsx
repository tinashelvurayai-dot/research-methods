import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicConfig, requestAccess } from "@/lib/rm.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/request-access")({
  head: () => ({ meta: [
    { title: "Request access — Research Methods" },
    { name: "description", content: "Request access to the Research Methods revision app." },
  ]}),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const { data: cfg } = useQuery({ queryKey: ["public-config"], queryFn: () => getPublicConfig() });
  const [form, setForm] = useState({ full_name: "", email: "", whatsapp: "" });
  const [submitted, setSubmitted] = useState(false);
  const m = useMutation({
    mutationFn: () => requestAccess({ data: form }),
    onSuccess: () => { setSubmitted(true); toast.success("Request submitted"); },
    onError: (e: any) => toast.error(e.message ?? "Failed to submit"),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-white">
          <Link to="/" className="text-sm hover:underline">← Back</Link>
          <div className="font-bold">Research Methods</div>
          <Link to="/signin" className="text-sm hover:underline">Sign in</Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-12">
        {submitted ? (
          <div className="rounded-2xl bg-card p-8 shadow-card">
            <h1 className="text-2xl font-bold">Request received</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              An agent will contact you for payment. After confirmation, your permanent
              access code will be sent to your email.
            </p>
            <div className="mt-5 rounded-lg bg-secondary p-4 text-sm">
              <div><span className="font-semibold">Agent:</span> {cfg?.agent.name}</div>
              <div><span className="font-semibold">Contact:</span> {cfg?.agent.contact}</div>
            </div>
            <Button className="mt-6" onClick={() => nav({ to: "/" })}>Done</Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
            className="rounded-2xl bg-card p-8 shadow-card"
          >
            <h1 className="text-2xl font-bold">Request access</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Individual ${cfg?.pricing.individual_price ?? 5} · Two people together ${cfg?.pricing.group_price ?? 8}
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="n">Full name</Label>
                <Input id="n" required minLength={2} maxLength={120}
                  value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="e">Email address</Label>
                <Input id="e" type="email" required maxLength={200}
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="w">WhatsApp number</Label>
                <Input id="w" required minLength={5} maxLength={40}
                  value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="mt-6 w-full" disabled={m.isPending}>
              {m.isPending ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}