import { useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function RequestAccess() {
  const [form, setForm] = useState({ full_name: "", email: "", whatsapp: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("access_requests").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      whatsapp: form.whatsapp.trim(),
      notes: form.notes.trim() || null,
    } as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    toast.success("Request submitted - we'll be in touch.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-md">
        <Card className="p-6 bg-card/70">
          {done ? (
            <div className="text-center space-y-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-secondary mx-auto" />
              <h1 className="text-2xl font-bold">Request received</h1>
              <p className="text-sm text-muted-foreground">
                You'll receive an access code by email after review.
              </p>
              <Button asChild variant="outline"><Link to="/">Back home</Link></Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">Request Access</h1>
              <p className="text-sm text-muted-foreground mb-6">Fill in your details. An agent will reach out.</p>
              <form onSubmit={submit} className="space-y-4">
                <div><Label>Full name</Label><Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>WhatsApp number</Label><Input required value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
                <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                <Button type="submit" disabled={loading} className="w-full bg-brand-gradient text-primary-foreground">
                  {loading ? "Submitting..." : "Submit request"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}