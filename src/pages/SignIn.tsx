import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function SignIn() {
  const { signInWithCode } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithCode(name, code);
      toast.success("Welcome back!");
      nav("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-md">
        <Card className="p-6 bg-card/70">
          <h1 className="text-2xl font-bold mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">Use your full name and access code.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="code">Access code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="AUT-XXXX-XXXX" className="font-mono uppercase" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-gradient text-primary-foreground">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            No code? <Link to="/request-access" className="text-secondary underline">Request one</Link>
          </p>
        </Card>
      </main>
    </div>
  );
}