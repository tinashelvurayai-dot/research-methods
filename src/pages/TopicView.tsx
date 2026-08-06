import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { RichContent } from "@/components/RichContent";
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, Check, X, Flame, Trophy, Sparkles, Keyboard } from "lucide-react";
import { RESEARCH_METHODS_CARDS } from "@/data/research-methods-cards";
import { useScreenshotProtection } from "@/hooks/use-screenshot-protection";
import { useMastery, useBookmarks } from "@/hooks/use-study-state";
import { Star } from "lucide-react";

interface CardRec { id: string; question: string; answer: string; }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TopicView() {
  const { slug } = useParams<{ slug: string }>();
  const { hidden } = useScreenshotProtection();
  const { setLevel } = useMastery();
  const bookmarks = useBookmarks();
  const [cards, setCards] = useState<CardRec[]>([]);
  const [topicName, setTopicName] = useState("");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [unsure, setUnsure] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [order, setOrder] = useState<number[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: t } = await supabase.from("topics").select("id, name").eq("slug", slug).maybeSingle();
      if (t) {
        setTopicName(t.name);
        const { data: c } = await supabase.from("cards").select("id, question, answer").eq("topic_id", t.id).order("order_index");
        setCards((c || []).map((r: any) => ({ id: r.id, question: r.question, answer: r.answer })));
      } else {
        // Fallback to bundled cards
        const matches = RESEARCH_METHODS_CARDS.filter((c) => slugify(c.topic || "General") === slug);
        if (matches.length) {
          setTopicName(matches[0].topic || "Topic");
          setCards(matches.map((c, i) => ({ id: `local-${i}`, question: c.question, answer: c.answer })));
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    setOrder(cards.map((_, i) => i));
    setIdx(0);
    setFlipped(false);
    setKnown(new Set()); setUnsure(new Set()); setStreak(0);
  }, [cards.length]);

  const current = cards[order[idx]];
  const reviewed = known.size + unsure.size;
  const progress = useMemo(() => cards.length ? Math.round((reviewed / cards.length) * 100) : 0, [reviewed, cards.length]);
  const accuracy = reviewed ? Math.round((known.size / reviewed) * 100) : 0;
  const done = cards.length > 0 && reviewed >= cards.length;

  const next = useCallback(() => { setIdx((i) => Math.min(order.length - 1, i + 1)); setFlipped(false); }, [order.length]);
  const prev = useCallback(() => { setIdx((i) => Math.max(0, i - 1)); setFlipped(false); }, []);
  const shuffle = useCallback(() => {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    setOrder(arr); setIdx(0); setFlipped(false);
  }, [order]);
  const markKnown = useCallback(() => {
    if (!current) return;
    setKnown((s) => new Set(s).add(current.id));
    setUnsure((s) => { const n = new Set(s); n.delete(current.id); return n; });
    setLevel(current.id, "got");
    setStreak((s) => s + 1);
    next();
  }, [current, next, setLevel]);
  const markUnsure = useCallback(() => {
    if (!current) return;
    setUnsure((s) => new Set(s).add(current.id));
    setKnown((s) => { const n = new Set(s); n.delete(current.id); return n; });
    setLevel(current.id, "practice");
    setStreak(0);
    next();
  }, [current, next, setLevel]);
  const restart = useCallback(() => {
    setKnown(new Set()); setUnsure(new Set()); setStreak(0); setIdx(0); setFlipped(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "s" || e.key === "S") shuffle();
      else if (e.key === "1") markUnsure();
      else if (e.key === "2") markKnown();
      else if (e.key === "?") setShowHelp((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, shuffle, markKnown, markUnsure]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showBack backTo="/dashboard" />
      {hidden && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Content hidden while window is inactive</p>
        </div>
      )}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{topicName}</h1>
            <p className="text-xs text-muted-foreground">
              Card {Math.min(idx + 1, Math.max(cards.length, 1))} of {cards.length} · {reviewed}/{cards.length} reviewed
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-card/60 border border-border">
              <Flame className={`h-3.5 w-3.5 ${streak > 0 ? "text-orange-400" : "text-muted-foreground"}`} /> Streak {streak}
            </span>
            <span className="px-2 py-1 rounded-full bg-card/60 border border-border">
              <span className="text-secondary font-medium">{accuracy}%</span> accuracy
            </span>
            <Button size="sm" variant="ghost" onClick={shuffle} title="Shuffle (S)">
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowHelp((v) => !v)} title="Shortcuts (?)">
              <Keyboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
          <div className="h-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
        </div>
        {showHelp && (
          <Card className="p-3 mb-4 text-xs bg-card/70">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Space</kbd> flip</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted">→</kbd> navigate</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">1</kbd> need review</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">2</kbd> got it</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-muted">S</kbd> shuffle</span>
            </div>
          </Card>
        )}
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : done ? (
          <Card className="p-8 text-center bg-gradient-to-br from-primary/15 via-card/60 to-secondary/20 border-secondary/40">
            <Trophy className="h-12 w-12 mx-auto text-secondary mb-3" />
            <h2 className="text-2xl font-bold mb-1">Session complete!</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You got <strong className="text-secondary">{known.size}</strong> right and flagged <strong>{unsure.size}</strong> for review · {accuracy}% accuracy
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={restart} className="bg-brand-gradient text-primary-foreground"><Sparkles className="h-4 w-4 mr-1" /> Study again</Button>
              <Button variant="outline" onClick={shuffle}><Shuffle className="h-4 w-4 mr-1" /> Shuffle & restart</Button>
            </div>
          </Card>
        ) : current ? (
          <>
            <Card
              className={`p-8 min-h-[260px] cursor-pointer bg-card/70 hover:border-secondary/40 transition ${flipped ? "ring-1 ring-secondary/30" : ""}`}
              onClick={() => setFlipped((f) => !f)}
            >
              <div className="text-xs uppercase tracking-wider text-secondary mb-3">
                <span className="flex items-center justify-between">
                  <span>{flipped ? "Answer" : "Question"} · tap or press space to flip</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); bookmarks.toggle(current.id); }}
                    title="Bookmark this card"
                    className="p-1 rounded hover:bg-muted transition"
                  >
                    <Star className={`h-4 w-4 ${bookmarks.has(current.id) ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                  </button>
                </span>
              </div>
              <div key={`${current.id}-${flipped}`} className="text-lg animate-fade-in">
                <RichContent text={flipped ? current.answer : current.question} />
              </div>
            </Card>
            {flipped && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="outline" onClick={markUnsure} className="border-orange-400/40 hover:bg-orange-500/10">
                  <X className="h-4 w-4 mr-1 text-orange-400" /> Need review
                </Button>
                <Button onClick={markKnown} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4 mr-1" /> Got it
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" onClick={prev} disabled={idx === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="ghost" onClick={() => setFlipped((f) => !f)}>
                <RotateCw className="h-4 w-4 mr-1" /> Flip
              </Button>
              <Button onClick={next} disabled={idx >= order.length - 1}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No cards in this topic yet.</p>
        )}
      </main>
    </div>
  );
}