import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getTopicCards, markCardSeen } from "@/lib/rm.functions";
import { getSession, useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/MathText";
import { ScreenshotGuard } from "@/components/ScreenshotGuard";

export const Route = createFileRoute("/dashboard/topic/$slug")({
  head: () => ({ meta: [{ title: "Revise — Research Methods" }] }),
  component: Page,
});

function Page() {
  const { slug } = useParams({ from: "/dashboard/topic/$slug" });
  const session = useSession();
  const nav = useNavigate();
  useEffect(() => { if (session === null && getSession() === null) nav({ to: "/signin" }); }, [session, nav]);
  const token = session?.token;
  const { data } = useQuery({
    queryKey: ["topic-cards", slug, token], enabled: !!token,
    queryFn: () => getTopicCards({ data: { token: token!, slug } }),
  });
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = data?.cards ?? [];
  const card = cards[i];

  useEffect(() => {
    if (token && card) markCardSeen({ data: { token, card_id: card.id } }).catch(() => {});
  }, [token, card]);

  if (!session) return null;
  return (
    <div className="min-h-screen bg-background">
      <ScreenshotGuard watermark={`${session.user.full_name} · Not for redistribution`} />
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="text-sm hover:underline">← Back to dashboard</Link>
          <div className="font-bold">{data?.topic.name ?? "Loading…"}</div>
          <div className="text-sm opacity-80">{cards.length ? `${i + 1} / ${cards.length}` : ""}</div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10 no-select">
        {card ? (
          <>
            <div className={`flip-card relative ${flipped ? "is-flipped" : ""}`} style={{ minHeight: 360 }}>
              <div className="flip-inner" style={{ minHeight: 360 }}>
                <button onClick={() => setFlipped(true)}
                  className="flip-face w-full rounded-2xl border bg-card p-8 text-left shadow-card hover:border-accent">
                  <Badge difficulty={card.difficulty} />
                  <div className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Question</div>
                  <div className="mt-3 text-lg leading-relaxed text-card-foreground"><MathText text={card.question} /></div>
                  <div className="absolute bottom-6 right-6 text-xs text-muted-foreground">Tap to reveal answer</div>
                </button>
                <button onClick={() => setFlipped(false)}
                  className="flip-face flip-back w-full rounded-2xl border bg-card p-8 text-left shadow-card">
                  <Badge difficulty={card.difficulty} />
                  <div className="mt-3 text-xs font-medium uppercase tracking-wider text-accent">Answer</div>
                  <div className="mt-3 text-base leading-relaxed text-card-foreground"><MathText text={card.answer} /></div>
                  <div className="absolute bottom-6 right-6 text-xs text-muted-foreground">Tap to hide</div>
                </button>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline" disabled={i === 0} onClick={() => { setI(i - 1); setFlipped(false); }}>← Previous</Button>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-gradient-primary" style={{ width: `${((i + 1) / cards.length) * 100}%` }} />
              </div>
              <Button disabled={i >= cards.length - 1} onClick={() => { setI(i + 1); setFlipped(false); }}>Next →</Button>
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-muted-foreground">Loading cards…</div>
        )}
      </main>
    </div>
  );
}

function Badge({ difficulty }: { difficulty: string }) {
  const styles = difficulty === "easy"
    ? "bg-emerald-100 text-emerald-800"
    : difficulty === "hard" ? "bg-rose-100 text-rose-800"
    : "bg-amber-100 text-amber-800";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${styles}`}>{difficulty}</span>;
}