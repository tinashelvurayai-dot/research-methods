import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, ChevronRight, Search, GraduationCap, Layers, Trophy, Sparkles, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESEARCH_METHODS_CARDS } from "@/data/research-methods-cards";
import { useMastery, summariseMastery } from "@/hooks/use-study-state";

interface Topic { id: string; slug: string; name: string; description: string | null; cardCount: number; cardIds: string[]; }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Dashboard() {
  const { user } = useAuth();
  const { mastery } = useMastery();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("topics").select("id, slug, name, description, order_index").order("order_index");
      const { data: c } = await supabase.from("cards").select("id, topic_id");
      const ids = new Map<string, string[]>();
      (c || []).forEach((r: any) => ids.set(r.topic_id, [...(ids.get(r.topic_id) || []), r.id]));
      let list: Topic[] = (t || []).map((r: any) => ({
        id: r.id, slug: r.slug, name: r.name, description: r.description,
        cardCount: (ids.get(r.id) || []).length,
        cardIds: ids.get(r.id) || [],
      }));
      // Fallback: derive from bundled cards if DB empty
      if (list.length === 0) {
        const grouped = new Map<string, string[]>();
        RESEARCH_METHODS_CARDS.forEach((c, i) => {
          const k = c.topic || "General";
          grouped.set(k, [...(grouped.get(k) || []), `local-${i}`]);
        });
        list = Array.from(grouped.entries()).map(([name, cardIds], i) => ({
          id: `local-topic-${i}`, slug: slugify(name), name, description: null, cardCount: cardIds.length, cardIds,
        }));
      }
      setTopics(list);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return topics;
    return topics.filter((t) =>
      t.name.toLowerCase().includes(s) || (t.description || "").toLowerCase().includes(s));
  }, [q, topics]);

  const totalCards = useMemo(() => topics.reduce((a, t) => a + t.cardCount, 0), [topics]);
  const overall = useMemo(
    () => summariseMastery(topics.flatMap((t) => t.cardIds), mastery),
    [topics, mastery]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome, {user?.full_name?.split(" ")[0]}</h1>
            <p className="text-muted-foreground">
              {overall.reviewed > 0
                ? `You've mastered ${overall.got} of ${totalCards} cards - keep the momentum going.`
                : "Pick a topic and start revising."}
            </p>
          </div>
          <div className="flex gap-2">
            <Card className="px-4 py-3 bg-card/60 flex items-center gap-2">
              <Layers className="h-4 w-4 text-secondary" />
              <span className="text-sm"><strong>{topics.length}</strong> topics</span>
            </Card>
            <Card className="px-4 py-3 bg-card/60 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-secondary" />
              <span className="text-sm"><strong>{totalCards}</strong> cards</span>
            </Card>
            <Card className="px-4 py-3 bg-card/60 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm"><strong>{overall.masteryPercent}%</strong> mastered</span>
            </Card>
          </div>
        </div>
        {totalCards > 0 && (
          <div className="h-2 rounded-full bg-muted mb-6 overflow-hidden">
            <div className="h-full bg-brand-gradient transition-all duration-500" style={{ width: `${overall.masteryPercent}%` }} />
          </div>
        )}
        <div className="relative max-w-md mb-6">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search topics" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {/* Exam Mode hero */}
        <Link to="/exam" className="block mb-6">
          <Card className="p-5 bg-gradient-to-br from-primary/20 via-card/60 to-secondary/20 border-secondary/40 hover:border-secondary transition group">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/20">
                  <Trophy className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">Exam Mode</h3>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/20 text-secondary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> New
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">30 questions · 90 minutes · stratified across every topic.</p>
                </div>
              </div>
              <Button className="bg-brand-gradient text-primary-foreground">Start exam <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </Card>
        </Link>

        {loading ? (
          <p className="text-muted-foreground">Loading topics...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No topics match "{q}".</Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => {
              const s = summariseMastery(t.cardIds, mastery);
              return (
              <Link key={t.id} to={`/dashboard/topic/${t.slug}`}>
                <Card className="p-5 h-full hover:border-secondary/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-secondary/10 transition-all group cursor-pointer bg-card/60">
                  <div className="flex items-start justify-between">
                    <BookOpen className="h-5 w-5 text-secondary" />
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition" />
                  </div>
                  <h3 className="font-semibold mt-3">{t.name}</h3>
                  {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-brand-gradient transition-all duration-500" style={{ width: `${s.masteryPercent}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-secondary">{t.cardCount} cards</span>
                    <span className="text-muted-foreground">
                      {s.masteryPercent === 100 ? "Mastered ✓" : s.reviewed > 0 ? `${s.masteryPercent}% mastered` : "Not started"}
                    </span>
                  </div>
                </Card>
              </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}