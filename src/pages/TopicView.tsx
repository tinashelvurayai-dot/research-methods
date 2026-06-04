import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { RichContent } from "@/components/RichContent";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { RESEARCH_METHODS_CARDS } from "@/data/research-methods-cards";

interface CardRec { id: string; question: string; answer: string; }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TopicView() {
  const { slug } = useParams<{ slug: string }>();
  const [cards, setCards] = useState<CardRec[]>([]);
  const [topicName, setTopicName] = useState("");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const current = cards[idx];
  const progress = useMemo(() => cards.length ? Math.round(((idx + 1) / cards.length) * 100) : 0, [idx, cards.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showBack backTo="/dashboard" />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">{topicName}</h1>
        <p className="text-xs text-muted-foreground mb-4">{cards.length} cards · Card {Math.min(idx + 1, cards.length)} of {cards.length}</p>
        <div className="h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
          <div className="h-full bg-brand-gradient transition-all" style={{ width: `${progress}%` }} />
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : current ? (
          <>
            <Card
              className="p-8 min-h-[260px] cursor-pointer bg-card/70 hover:border-secondary/40 transition"
              onClick={() => setFlipped((f) => !f)}
            >
              <div className="text-xs uppercase tracking-wider text-secondary mb-3">
                {flipped ? "Answer" : "Question"} · tap to flip
              </div>
              <div className="text-lg">
                <RichContent text={flipped ? current.answer : current.question} />
              </div>
            </Card>
            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" onClick={() => { setIdx((i) => Math.max(0, i - 1)); setFlipped(false); }} disabled={idx === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="ghost" onClick={() => setFlipped((f) => !f)}>
                <RotateCw className="h-4 w-4 mr-1" /> Flip
              </Button>
              <Button onClick={() => { setIdx((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} disabled={idx >= cards.length - 1}>
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