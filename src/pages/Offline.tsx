import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-lg text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-card/60 flex items-center justify-center mb-6">
          <WifiOff className="h-8 w-8 text-secondary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">You're offline</h1>
        <p className="text-muted-foreground mb-6">
          This page hasn't been cached yet. Cards and topics you've already opened still work offline — head to the dashboard and pick one.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" /> Try again
          </Button>
          <Button asChild className="bg-brand-gradient text-primary-foreground">
            <Link to="/dashboard"><Home className="h-4 w-4 mr-1" /> Go to dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}