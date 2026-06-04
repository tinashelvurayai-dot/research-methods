import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import logo from "@/assets/logo.png";
import { BookOpen, GraduationCap, Sparkles, ShieldCheck } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="container mx-auto px-4 pt-16 pb-12 text-center">
          <img src={logo} alt="Research Methods" className="h-20 mx-auto mb-6" />
          <div className="inline-block px-3 py-1 rounded-full border border-secondary/40 bg-secondary/10 text-secondary text-xs tracking-wider uppercase mb-5">
            Built from real National Diploma past papers
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            Stop re-reading notes.<br />
            <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
              Start passing Research Methods.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-2">
            Real exam questions turned into interactive Q&amp;A flashcards. Master one card at a time.
          </p>
          <p className="italic text-secondary/90 max-w-xl mx-auto mb-8">
            « La dolce revisione - studia con passione, supera con eleganza. »
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground shadow-glow">
              <Link to="/request-access">Request Access</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signin">I have a code</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full border border-border bg-card/40">5 past papers</span>
            <span className="px-2 py-1 rounded-full border border-border bg-card/40">250+ cards</span>
            <span className="px-2 py-1 rounded-full border border-border bg-card/40">Offline-ready</span>
          </div>
        </section>

        {/* ESPRESSO DIVIDER */}
        <div className="flex items-center justify-center gap-3 my-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-secondary/50" />
          <span className="text-secondary text-sm">- espresso -</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-secondary/50" />
        </div>

        {/* FEATURES */}
        <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, title: "Topic-organized", body: "Cards grouped by syllabus topic so you can revise what matters." },
            { icon: Sparkles, title: "Active recall", body: "Flip cards, mark mastery, bookmark tough ones. Build memory that lasts." },
            { icon: ShieldCheck, title: "Exam-realistic", body: "Every card written from actual past-paper questions." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur">
              <Icon className="h-6 w-6 text-secondary mb-3" />
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        {/* STATS */}
        <section className="container mx-auto px-4 py-12 grid grid-cols-3 gap-4 text-center">
          {[
            { n: "250+", l: "Cards" },
            { n: "5", l: "Past papers" },
            { n: "24/7", l: "Access" },
          ].map(({ n, l }) => (
            <div key={l} className="p-6 rounded-xl border border-border bg-card/30">
              <div className="text-3xl font-bold text-secondary">{n}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </section>

        {/* FINAL CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <GraduationCap className="h-10 w-10 text-secondary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Ready to revise the smart way?</h2>
          <p className="text-muted-foreground mb-2">Get an access code from an agent or request one now.</p>
          <p className="italic text-secondary/80 mb-6">« Chi studia con metodo, supera con onore. »</p>
          <Button asChild size="lg" className="bg-brand-gradient text-primary-foreground shadow-glow">
            <Link to="/request-access">Get started</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        <p className="text-gold tracking-wider">
          Forgiato a mano da Ultimate_Developers · Bottega Digitale · MMXXVI
        </p>
        <p className="mt-1">Support: researchmethods@gmail.com</p>
      </footer>
    </div>
  );
}