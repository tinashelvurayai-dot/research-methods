import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicConfig, getSampleCards } from "@/lib/rm.functions";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/MathText";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Research Methods — Master research one card at a time" },
      { name: "description", content: "Interactive Q&A flashcards built from real exam content. 400+ cards covering research design, statistics, ethics, and more." },
      { property: "og:title", content: "Research Methods Revision App" },
      { property: "og:description", content: "Master Research Methods with interactive flashcards." },
    ],
  }),
  component: Index,
});

function Index() {
  const [sampleOpen, setSampleOpen] = useState(false);
  const { data: cfg } = useQuery({ queryKey: ["public-config"], queryFn: () => getPublicConfig() });
  const { data: sample } = useQuery({
    queryKey: ["sample"], queryFn: () => getSampleCards(), enabled: sampleOpen,
  });
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = sample?.cards[i];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="bg-gradient-hero text-navy-foreground">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-lg font-bold tracking-tight">Research Methods</div>
          <div className="flex gap-2">
            <Link to="/signin"><Button variant="ghost" className="text-white hover:bg-white/10">Sign in</Button></Link>
            <Link to="/request-access"><Button className="bg-white text-navy hover:bg-white/90">Request access</Button></Link>
          </div>
        </nav>
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-12 text-center md:pt-24">
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Master Research Methods —<br />one card at a time
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
            Real exam questions turned into interactive Q&amp;A flashcards. 400+ cards
            across 12 topics, with full LaTeX support for statistics.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/request-access">
              <Button size="lg" className="bg-accent text-accent-foreground hover:opacity-90">Request access</Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10"
              onClick={() => { setSampleOpen(true); setI(0); setFlipped(false); }}>
              See sample card
            </Button>
          </div>
        </section>
      </header>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", t: "Request access", d: "Fill in your name, email, and WhatsApp." },
            { n: "2", t: "Pay an agent", d: `Individual $${cfg?.pricing.individual_price ?? 5} · Together $${cfg?.pricing.group_price ?? 8} (two people)` },
            { n: "3", t: "Get your code", d: "Admin approves and emails your permanent access code." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-card p-6 shadow-card">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary font-bold text-white">{s.n}</div>
              <h3 className="text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-navy py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 text-center text-white md:grid-cols-4">
          {[
            ["400+", "cards from real papers"],
            ["100%", "model-answer accuracy"],
            ["15 min", "a day is enough"],
            ["12", "complete topic sets"],
          ].map(([k, v]) => (
            <div key={k}><div className="text-3xl font-extrabold">{k}</div><div className="mt-1 text-sm text-white/80">{v}</div></div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-muted-foreground">
        Support: industrialautomation@gmail.com · © Research Methods
      </footer>

      <Dialog open={sampleOpen} onOpenChange={setSampleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Sample · {sample?.topic?.name ?? "Loading…"}</DialogTitle></DialogHeader>
          {card ? (
            <div>
              <button onClick={() => setFlipped((f) => !f)}
                className="block w-full rounded-xl border bg-card p-6 text-left shadow-card transition hover:shadow-hover">
                <div className="mb-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                  {card.difficulty}
                </div>
                <div className="text-base font-semibold">
                  {flipped ? "Answer" : "Question"} {i + 1} / {sample!.cards.length}
                </div>
                <div className="mt-3 text-sm leading-relaxed">
                  <MathText text={flipped ? card.answer : card.question} />
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Tap to flip</div>
              </button>
              <div className="mt-4 flex justify-between">
                <Button variant="outline" disabled={i === 0} onClick={() => { setI(i - 1); setFlipped(false); }}>Previous</Button>
                <Button disabled={i === (sample!.cards.length - 1)} onClick={() => { setI(i + 1); setFlipped(false); }}>Next</Button>
              </div>
            </div>
          ) : <div className="py-10 text-center text-sm text-muted-foreground">Loading sample…</div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
