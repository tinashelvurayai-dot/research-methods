import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function AdminLogin() {
  const { signInAdminCode, isAdmin, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await signInAdminCode(code); nav("/admin"); }
    catch (err: any) { toast.error(err.message || "Invalid access code"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showBack backTo="/" />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-md">
        <Card className="p-6 bg-card/70">
          <h1 className="text-2xl font-bold mb-1">Admin access</h1>
          <p className="text-sm text-muted-foreground mb-4">Enter your administrator access code.</p>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Access code</Label>
              <Input type="password" required autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter access code" className="font-mono tracking-wider" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-gradient text-primary-foreground">
              {loading ? "Verifying..." : "Unlock admin"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}