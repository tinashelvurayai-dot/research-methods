import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getTopics, signOut } from "@/lib/rm.functions";
import { getSession, setSession, useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ScreenshotGuard } from "@/components/ScreenshotGuard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - Research Methods" }] }),
  component: Page,
});

function Page() {
  const session = useSession();
  const nav = useNavigate();
  useEffect(() => { if (session === null && getSession() === null) nav({ to: "/signin" }); }, [session, nav]);

  const token = session?.token;
  const { data, isLoading } = useQuery({
    queryKey: ["topics", token], enabled: !!token,
    queryFn: () => getTopics({ data: { token: token! } }),
  });

  if (!session) return null;
  const logout = async () => {
    await signOut({ data: { token: session.token } }).catch(() => {});
    setSession(null); nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <ScreenshotGuard watermark={`${session.user.full_name} · Not for redistribution`} />
      <header className="bg-navy">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-white">
          <Link to="/" className="font-bold">Research Methods</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
            <Link to="/support" className="hover:underline">Support</Link>
            <button onClick={logout} className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">Sign out</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {session.user.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Full access - pick a topic to begin revising.</p>
        </div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading topics…</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data?.topics.map((t) => {
              const pct = t.stats.total ? Math.round((t.stats.done / t.stats.total) * 100) : 0;
              return (
                <Link key={t.id} to="/dashboard/topic/$slug" params={{ slug: t.slug }}
                  className="group rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover hover:border-accent">
                  <div className="text-xs font-medium uppercase tracking-wider text-accent">{t.stats.total} cards</div>
                  <h3 className="mt-2 text-lg font-semibold text-card-foreground">{t.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{pct}% complete</span>
                    <span>Easy {t.stats.easy} · Med {t.stats.medium} · Hard {t.stats.hard}</span>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">Revise →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}