import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Lock, ShieldCheck } from "lucide-react";

export default function AdminSetup() {
  const nav = useNavigate();
  const { signInAdmin, signUpAdmin } = useAuth();
  const [exists, setExists] = useState<boolean | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("admin-status").then(({ data }) => setExists(!!data?.exists));
  }, []);

  const submit = async (mode: "signup" | "signin") => {
    setBusy(true);
    try {
      if (mode === "signup") await signUpAdmin(form.full_name, form.email, form.password);
      else await signInAdmin(form.email, form.password);
      toast.success(mode === "signup" ? "Admin account created" : "Welcome back");
      nav("/admin");
    } catch (err: any) { toast.error(err.message || "Admin access failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showBack backTo="/" />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-md">
        <Card className="p-6 bg-card/70">
          <div className="text-center mb-6">
            <ShieldCheck className="h-10 w-10 text-secondary mx-auto mb-2" />
            <h1 className="text-2xl font-bold">Admin portal</h1>
            <p className="text-xs text-muted-foreground mt-2">
              {exists === null ? "Checking setup…" : exists ? <><Lock className="inline h-3 w-3 mr-1" />Admin exists — sign in only.</> : "First-time setup — create the administrator account."}
            </p>
          </div>
          {exists === false ? (
            <Tabs defaultValue="signup">
              <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="signup">Sign up</TabsTrigger><TabsTrigger value="signin">Sign in</TabsTrigger></TabsList>
              <AdminFields form={form} setForm={setForm} showName />
              <TabsContent value="signup"><Button disabled={busy} onClick={() => submit("signup")} className="w-full bg-brand-gradient text-primary-foreground">Create admin</Button></TabsContent>
              <TabsContent value="signin"><Button disabled={busy} onClick={() => submit("signin")} className="w-full bg-brand-gradient text-primary-foreground">Sign in</Button></TabsContent>
            </Tabs>
          ) : (
            <div>
              <AdminFields form={form} setForm={setForm} />
              <Button disabled={busy} onClick={() => submit("signin")} className="w-full bg-brand-gradient text-primary-foreground">Sign in as admin</Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

function AdminFields({ form, setForm, showName = false }: { form: any; setForm: (v: any) => void; showName?: boolean }) {
  return <div className="space-y-3 my-4">
    {showName && <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>}
    <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
    <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
  </div>;
}