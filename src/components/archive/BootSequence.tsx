import { useEffect, useState } from "react";

const LINES = [
  { text: "> initiating secure handshake...", delay: 30 },
  { text: "> verifying terminal signature... OK", delay: 25 },
  { text: "> ASTRALNAUT ARCHIVE // build 0.1", delay: 20 },
  { text: "> security clearance .................. VERIFIED", delay: 18 },
  { text: "> public access ........................ GRANTED", delay: 18 },
  { text: "> scanning known timelines...", delay: 30 },
  { text: "  ✓ CHILDREN OF AQUARIUS", delay: 35 },
  { text: "  ✓ BATTLEFIELD ATLANTIS", delay: 35 },
  { text: "  ✓ DARKER AGES", delay: 35 },
  { text: "> archive online. proceed when ready.", delay: 20 },
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [printed, setPrinted] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState("");
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);

  useEffect(() => {
    if (li >= LINES.length) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const line = LINES[li];
    if (ci < line.text.length) {
      const t = setTimeout(() => {
        setCurrentLine(line.text.slice(0, ci + 1));
        setCi(ci + 1);
      }, line.delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setPrinted((p) => [...p, line.text]);
      setCurrentLine("");
      setCi(0);
      setLi(li + 1);
    }, 120);
    return () => clearTimeout(t);
  }, [li, ci, onDone]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black px-4">
      <div className="archive-bracket archive-scan w-full max-w-2xl p-6 font-mono text-sm text-[color:var(--hud-accent)] sm:text-base">
        <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[color:var(--hud-dim)]">
          <span>// STREAMWALKERS CORP</span>
          <span>NODE 7-A</span>
        </div>
        {printed.map((p, i) => (
          <div key={i} className="whitespace-pre">{p}</div>
        ))}
        {li < LINES.length && (
          <div className="whitespace-pre archive-caret">{currentLine}</div>
        )}
        <button
          onClick={onDone}
          className="mt-6 text-[10px] uppercase tracking-[0.3em] text-[color:var(--hud-dim)] underline-offset-4 hover:text-[color:var(--hud-accent)] hover:underline"
        >
          [ skip transmission ]
        </button>
      </div>
    </div>
  );
}
