import { BlockMath, InlineMath } from "react-katex";

// Renders text containing $inline$ and $$block$$ LaTeX segments.
export function MathText({ text }: { text: string }) {
  const parts: { type: "t" | "i" | "b"; v: string }[] = [];
  let rest = text;
  const re = /(\$\$[^$]+\$\$|\$[^$\n]+\$)/g;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(rest)) !== null) {
    if (m.index > last) parts.push({ type: "t", v: rest.slice(last, m.index) });
    const s = m[0];
    if (s.startsWith("$$")) parts.push({ type: "b", v: s.slice(2, -2) });
    else parts.push({ type: "i", v: s.slice(1, -1) });
    last = m.index + s.length;
  }
  if (last < rest.length) parts.push({ type: "t", v: rest.slice(last) });
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.type === "t" ? <span key={i}>{p.v}</span>
        : p.type === "i" ? <InlineMath key={i} math={p.v} />
        : <BlockMath key={i} math={p.v} />,
      )}
    </span>
  );
}