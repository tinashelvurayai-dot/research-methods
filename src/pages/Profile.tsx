import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showBack backTo="/dashboard" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-md">
        <Card className="p-6 bg-card/70 space-y-3">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div><div className="text-xs uppercase text-muted-foreground">Name</div><div>{user?.full_name}</div></div>
          <div><div className="text-xs uppercase text-muted-foreground">Email</div><div>{user?.email}</div></div>
          <div><div className="text-xs uppercase text-muted-foreground">Access code</div><div className="font-mono">{user?.access_code}</div></div>
          <Button variant="outline" className="w-full" onClick={() => { signOut(); nav("/"); }}>Sign out</Button>
        </Card>
      </main>
    </div>
  );
}