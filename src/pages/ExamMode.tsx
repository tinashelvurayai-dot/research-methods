import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichContent } from "@/components/RichContent";
import { supabase } from "@/integrations/supabase/client";
import { RESEARCH_METHODS_CARDS } from "@/data/research-methods-cards";
import { Timer, CheckCircle2, XCircle, Trophy, RefreshCw, ChevronRight } from "lucide-react";

interface ExamQ { id: string; question: string; answer: string; topic: string; }

const QUESTION_COUNT = 30;
const DURATION_MIN = 90;

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamMode() {
  const [pool, setPool] = useState<ExamQ[]>([]);
  const [exam, setExam] = useState<ExamQ[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<("correct" | "wrong")[]>([]);
  const [remaining, setRemaining] = useState(DURATION_MIN * 60);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    (async () => {
      // Try DB first, fall back to bundled
      const { data: topics } = await supabase.from("topics").select("id, name");
      const { data: cards } = await supabase.from("cards").select("id, question, answer, topic_id");
      const topicMap = new Map<string, string>((topics || []).map((t: any) => [t.id, t.name]));
      let p: ExamQ[] = (cards || []).map((c: any) => ({ id: c.id, question: c.question, answer: c.answer, topic: topicMap.get(c.topic_id) || "General" }));
      if (p.length === 0) {
        p = RESEARCH_METHODS_CARDS.map((c, i) => ({ id: `local-${i}`, question: c.question, answer: c.answer, topic: c.topic || "General" }));
      }
      setPool(p);
    })();
  }, []);

  useEffect(() => {
    if (!exam || finished) return;
    const t = setInterval(() => setRemaining((r) => {
      if (r <= 1) { clearInterval(t); setFinished(true); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [exam, finished]);

  const start = () => {
    // Stratified pick: roughly equal from each topic
    const byTopic = new Map<string, ExamQ[]>();
    pool.forEach((q) => {
      if (!byTopic.has(q.topic)) byTopic.set(q.topic, []);
      byTopic.get(q.topic)!.push(q);
    });
    const perTopic = Math.max(1, Math.floor(QUESTION_COUNT / byTopic.size));
    let picks: ExamQ[] = [];
    byTopic.forEach((arr) => { picks = picks.concat(shuffle(arr).slice(0, perTopic)); });
    if (picks.length < QUESTION_COUNT) {
      const remaining = shuffle(pool.filter((q) => !picks.includes(q)));
      picks = picks.concat(remaining.slice(0, QUESTION_COUNT - picks.length));
    }
    setExam(shuffle(picks).slice(0, QUESTION_COUNT));
    setIdx(0); setShowAnswer(false); setResults([]);
    setRemaining(DURATION_MIN * 60); setFinished(false);
  };

  const grade = (correct: boolean) => {
    setResults((r) => [...r, correct ? "correct" : "wrong"]);
    if (idx + 1 >= (exam?.length || 0)) setFinished(true);
    else { setIdx(idx + 1); setShowAnswer(false); }
  };

  const score = results.filter((r) => r === "correct").length;
  const total = exam?.length || 0;
  const pct = total ? Math.round((score / total) * 100) : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const intro = !exam;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showBack backTo="/dashboard" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {intro ? (
          <Card className="p-8 bg-card/70 text-center space-y-4">
            <Trophy className="h-12 w-12 mx-auto text-secondary" />
            <h1 className="text-3xl font-bold">Exam Mode</h1>
            <p className="text-muted-foreground">
              A timed practice exam drawn from every topic. {QUESTION_COUNT} questions · {DURATION_MIN} minutes.
            </p>
            <ul className="text-sm text-left max-w-md mx-auto space-y-1 text-muted-foreground">
              <li>• Questions are stratified across all topics for balanced coverage.</li>
              <li>• Reveal the answer, then mark yourself honestly: correct or missed.</li>
              <li>• A scorecard appears at the end with per-topic breakdown.</li>
            </ul>
            <Button onClick={start} disabled={pool.length === 0} size="lg" className="bg-brand-gradient text-primary-foreground">
              Start exam <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {pool.length === 0 && <p className="text-xs text-muted-foreground">Loading question bank…</p>}
          </Card>
        ) : finished ? (
          <Card className="p-8 bg-card/70 text-center space-y-4">
            <Trophy className={`h-12 w-12 mx-auto ${pct >= 50 ? "text-secondary" : "text-muted-foreground"}`} />
            <h2 className="text-2xl font-bold">Exam complete</h2>
            <div className="text-5xl font-bold">{pct}%</div>
            <p className="text-muted-foreground">{score} of {total} correct</p>
            <PerTopic exam={exam!} results={results} />
            <div className="flex gap-2 justify-center">
              <Button onClick={start} variant="outline"><RefreshCw className="h-4 w-4 mr-1" /> Retake</Button>
              <Button asChild className="bg-brand-gradient text-primary-foreground"><Link to="/dashboard">Back to dashboard</Link></Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-muted-foreground">Q {idx + 1} / {total} · <span className="text-secondary">{exam![idx].topic}</span></span>
              <span className="flex items-center gap-1 font-mono text-secondary"><Timer className="h-4 w-4" /> {mm}:{ss}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
              <div className="h-full bg-brand-gradient transition-all" style={{ width: `${((idx) / total) * 100}%` }} />
            </div>
            <Card className="p-8 min-h-[220px] bg-card/70">
              <div className="text-xs uppercase tracking-wider text-secondary mb-3">Question</div>
              <div className="text-lg"><RichContent text={exam![idx].question} /></div>
              {showAnswer && (
                <>
                  <div className="mt-6 text-xs uppercase tracking-wider text-secondary mb-2">Answer</div>
                  <div className="text-base text-muted-foreground"><RichContent text={exam![idx].answer} /></div>
                </>
              )}
            </Card>
            <div className="flex gap-2 justify-end mt-6">
              {!showAnswer ? (
                <Button onClick={() => setShowAnswer(true)} className="bg-brand-gradient text-primary-foreground">Reveal answer</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => grade(false)}><XCircle className="h-4 w-4 mr-1" /> Missed</Button>
                  <Button onClick={() => grade(true)} className="bg-brand-gradient text-primary-foreground"><CheckCircle2 className="h-4 w-4 mr-1" /> Correct</Button>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PerTopic({ exam, results }: { exam: ExamQ[]; results: ("correct" | "wrong")[] }) {
  const byTopic = new Map<string, { c: number; t: number }>();
  exam.forEach((q, i) => {
    const r = byTopic.get(q.topic) || { c: 0, t: 0 };
    r.t += 1;
    if (results[i] === "correct") r.c += 1;
    byTopic.set(q.topic, r);
  });
  return (
    <div className="text-left mt-2 space-y-1 max-w-md mx-auto">
      {Array.from(byTopic.entries()).map(([topic, s]) => (
        <div key={topic} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground truncate pr-2">{topic}</span>
          <span><strong>{s.c}</strong> / {s.t}</span>
        </div>
      ))}
    </div>
  );
}