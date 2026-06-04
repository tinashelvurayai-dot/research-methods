import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, ChevronRight } from "lucide-react";
import { RESEARCH_METHODS_CARDS } from "@/data/research-methods-cards";

interface Topic { id: string; slug: string; name: string; description: string | null; cardCount: number; }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Dashboard() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.from("topics").select("id, slug, name, description, order_index").order("order_index");
      const { data: c } = await supabase.from("cards").select("topic_id");
      const counts = new Map<string, number>();
      (c || []).forEach((r: any) => counts.set(r.topic_id, (counts.get(r.topic_id) || 0) + 1));
      let list: Topic[] = (t || []).map((r: any) => ({
        id: r.id, slug: r.slug, name: r.name, description: r.description,
        cardCount: counts.get(r.id) || 0,
      }));
      // Fallback: derive from bundled cards if DB empty
      if (list.length === 0) {
        const grouped = new Map<string, number>();
        RESEARCH_METHODS_CARDS.forEach((c) => {
          const k = c.topic || "General";
          grouped.set(k, (grouped.get(k) || 0) + 1);
        });
        list = Array.from(grouped.entries()).map(([name, n], i) => ({
          id: `local-${i}`, slug: slugify(name), name, description: null, cardCount: n,
        }));
      }
      setTopics(list);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-1">Welcome, {user?.full_name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground mb-6">Pick a topic and start revising.</p>
        {loading ? (
          <p className="text-muted-foreground">Loading topics...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((t) => (
              <Link key={t.id} to={`/dashboard/topic/${t.slug}`}>
                <Card className="p-5 hover:border-secondary/60 transition group cursor-pointer bg-card/60">
                  <div className="flex items-start justify-between">
                    <BookOpen className="h-5 w-5 text-secondary" />
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary transition" />
                  </div>
                  <h3 className="font-semibold mt-3">{t.name}</h3>
                  {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                  <p className="text-xs text-secondary mt-3">{t.cardCount} cards</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}