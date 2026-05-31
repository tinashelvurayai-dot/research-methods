import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getSession, useSession } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Research Methods" }] }),
  component: Page,
});

function Page() {
  const session = useSession();
  const nav = useNavigate();
  useEffect(() => { if (session === null && getSession() === null) nav({ to: "/signin" }); }, [session, nav]);
  if (!session) return null;
  const u = session.user;
  const masked = u.access_code.replace(/.(?=.{4})/g, "•");
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-white">
          <Link to="/dashboard" className="text-sm hover:underline">← Dashboard</Link>
          <div className="font-bold">Profile</div>
          <Link to="/support" className="text-sm hover:underline">Support</Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl bg-card p-8 shadow-card">
          <h1 className="text-2xl font-bold">Your profile</h1>
          <dl className="mt-6 space-y-4 text-sm">
            <Row label="Full name" value={u.full_name} />
            <Row label="Email" value={u.email} />
            <Row label="WhatsApp" value={u.whatsapp ?? "—"} />
            <Row label="Access code" value={masked} />
            <Row label="Access status" value="Full access — permanent" />
          </dl>
        </div>
      </main>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-card-foreground">{value}</dd>
    </div>
  );
}