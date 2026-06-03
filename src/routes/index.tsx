import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicConfig, getSampleCards } from "@/lib/rm.functions";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/MathText";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EspressoDivider } from "@/components/EspressoDivider";
import { TuscanSeal } from "@/components/TuscanSeal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Research Methods - Master research one card at a time" },
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
    <div className="min-h-screen bg-navy text-white">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="" width={28} height={28} className="rounded-md" loading="eager" />
          <span className="text-sm font-bold tracking-tight">Research Methods</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/signin"><Button variant="ghost" className="text-white hover:bg-white/10">Sign in</Button></Link>
          <Link to="/request-access">
            <Button className="bg-gradient-primary text-white hover:opacity-90">Request access</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-5xl px-6 pb-16 pt-10 text-center md:pt-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
          <span aria-hidden>✦</span>
          Built from real National Diploma past papers
        </div>

        <p className="font-italic-serif text-2xl text-[var(--gold)] md:text-3xl">
          « La dolce revisione - studiare come un'arte. »
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.35em] text-[var(--gold-soft)]">
          Un'edizione artigianale · Italian-crafted study experience
        </p>

        <div className="mx-auto mt-8 inline-flex h-16 w-16 items-center justify-center">
          <img src="/icon-192.png" alt="" width={64} height={64} className="rounded-2xl shadow-[0_0_40px_-10px_var(--gold)]" />
        </div>

        <h1 className="mt-8 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          Stop re-reading notes.
          <br />
          <span className="text-gradient-headline">Start passing Research Methods.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 md:text-lg">
          Every concept that has ever appeared in your exam, rebuilt as flip-cards your brain
          actually remembers. <span className="font-semibold text-white">First 5 cards of every topic are free.</span>
          <br />No card. No setup. No catch.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/request-access">
            <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90">
              Request access
            </Button>
          </Link>
          <Button
            size="lg" variant="outline"
            className="border-white/30 bg-white/5 text-white hover:bg-white/10"
            onClick={() => { setSampleOpen(true); setI(0); setFlipped(false); }}
          >
            I have a code? See a sample
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/60">
          <span>● No subscription</span>
          <span>● No exam dates, ever</span>
          <span>● Works offline once installed</span>
        </div>
      </header>

      <EspressoDivider label="Caffè · Concentrazione · Conoscenza" />

      {/* Feature card */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl bg-white p-8 text-[var(--foreground)] shadow-card md:p-12">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">You already know what's coming.</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                The same hypothesis tests. The same sampling tricks. The same validity-vs-reliability
                trap. The same ethics scenario. The same correlation-vs-causation question. The same
                ANOVA setup. Year after year.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                This app drills you on the exact pattern of questions your examiners love, until
                the answers are reflex.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat k="400+" v="cards drawn from real papers" />
              <Stat k="100%" v="model-answer accuracy" />
              <Stat k="15 min" v="a day is enough" />
              <Stat k="12" v="complete topic sets" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", t: "Request access", d: "Fill in your name, email, and WhatsApp." },
            { n: "2", t: "Pay an agent", d: `Individual $${cfg?.pricing.individual_price ?? 5} · Together $${cfg?.pricing.group_price ?? 8} (two people)` },
            { n: "3", t: "Get your code", d: `${cfg?.agent.name ?? "Your agent"} sends your permanent access code by email.` },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary font-bold">{s.n}</div>
              <h3 className="text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-white/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <EspressoDivider />

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-14 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Ready to pass it for real?</h2>
        <p className="mt-4 text-white/70">Join the students who stopped guessing and started recalling.</p>
        <div className="mt-8">
          <Link to="/request-access">
            <Button size="lg" className="bg-gradient-primary text-white hover:opacity-90">
              Get my access code
            </Button>
          </Link>
        </div>
        <p className="font-italic-serif mt-8 text-lg text-[var(--gold)] md:text-xl">
          « Chi va piano, va sano e va lontano. »
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-white/40">
          Slow and steady wins the exam.
        </p>
      </section>

      <footer className="border-t border-white/10 py-10 text-center text-xs text-white/60">
        <div>Support: industrialautomation@gmail.com</div>
        <TuscanSeal />
      </footer>

      <Dialog open={sampleOpen} onOpenChange={setSampleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Sample · {sample?.topic?.name ?? "Loading..."}</DialogTitle>
          </DialogHeader>
          {card ? (
            <div>
              <button
                onClick={() => setFlipped((f) => !f)}
                className="block w-full rounded-xl border bg-card p-6 text-left text-[var(--foreground)] shadow-card transition hover:shadow-hover"
              >
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
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading sample...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-4 text-center">
      <div className="text-2xl font-extrabold text-accent">{k}</div>
      <div className="mt-1 text-xs text-muted-foreground">{v}</div>
    </div>
  );
}