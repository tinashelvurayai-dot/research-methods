import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Support() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user?.id, subject, message,
    } as any);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Message sent. We'll reply by email.");
    setSubject(""); setMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showBack backTo="/dashboard" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-md">
        <Card className="p-6 bg-card/70">
          <h1 className="text-2xl font-bold mb-1">Support</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Email: <a className="text-secondary" href="mailto:researchmethods@gmail.com">researchmethods@gmail.com</a>
          </p>
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Subject</Label><Input required value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-gradient text-primary-foreground">
              {loading ? "Sending..." : "Send"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}