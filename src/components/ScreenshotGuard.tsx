import { useEffect } from "react";

export function ScreenshotGuard({ watermark }: { watermark: string }) {
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        (e.ctrlKey || e.metaKey) && ["p", "s", "c", "u"].includes(k) ||
        k === "printscreen"
      ) { e.preventDefault(); e.stopPropagation(); }
    };
    const ctx = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("keydown", block, true);
    window.addEventListener("contextmenu", ctx);
    return () => { window.removeEventListener("keydown", block, true); window.removeEventListener("contextmenu", ctx); };
  }, []);
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden no-select"
      style={{
        backgroundImage:
          `repeating-linear-gradient(-30deg, transparent 0 180px, rgba(10,25,41,0.05) 180px 181px)`,
      }}
    >
      <div
        className="absolute inset-0 grid"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: "200px" }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center text-xs font-medium opacity-10 rotate-[-25deg] text-navy">
            {watermark}
          </div>
        ))}
      </div>
    </div>
  );
}