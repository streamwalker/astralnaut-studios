import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { Course } from "@/content/learn/types";

type Progress = Record<string, boolean>;

export function CourseOverview({ course }: { course: Course }) {
  const [progress] = useLocalStorage<Progress>(`course:${course.id}`, {});
  const done = course.modules.filter((m) => progress[m.id]).length;
  const total = course.modules.length;
  const pct = Math.round((done / total) * 100);
  const complete = done === total;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
        Training course · {course.label}
      </div>
      <h1 className="mt-2 text-4xl font-extrabold text-[var(--ink)]">
        Master {course.id === "admin" ? "running the platform" : "the platform"}
      </h1>
      <p className="mt-2 text-[var(--ink2)]">
        Five short modules, each with a quick quiz. Progress is saved in this browser.
      </p>

      <div className="mt-6 rounded-xl border border-[var(--border-line)] bg-black/20 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--ink)]">
            Progress: {done} / {total}
          </span>
          <span className="text-[var(--ink2)]">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--neon), var(--gold))",
            }}
          />
        </div>
      </div>

      <ol className="mt-8 space-y-3">
        {course.modules.map((m, idx) => {
          const isDone = !!progress[m.id];
          return (
            <li key={m.id}>
              <Link
                to={`${course.basePath}/$moduleId` as "/learn/$moduleId"}
                params={{ moduleId: m.id }}
                className="flex items-start gap-4 rounded-xl border border-[var(--border-line)] bg-black/20 p-5 hover:border-[var(--neon)]"
              >
                {isDone ? (
                  <CheckCircle2 className="mt-0.5 text-[var(--neon)]" width={22} height={22} />
                ) : (
                  <Circle className="mt-0.5 text-[var(--ink2)]" width={22} height={22} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold uppercase tracking-[2px] text-[var(--ink2)]">
                    Module {idx + 1}
                  </div>
                  <div className="mt-0.5 text-lg font-bold text-[var(--ink)]">{m.title}</div>
                  <div className="mt-1 text-sm text-[var(--ink2)]">{m.summary}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {complete && (
        <div className="mt-10 rounded-2xl border border-[var(--gold)] bg-gradient-to-br from-[rgba(201,168,76,0.12)] to-transparent p-8 text-center">
          <Trophy className="mx-auto text-[var(--gold)]" width={48} height={48} />
          <div className="mt-3 text-xs font-bold uppercase tracking-[3px] text-[var(--gold)]">
            Astralnaut Certified
          </div>
          <div className="mt-1 text-2xl font-extrabold text-[var(--ink)]">
            {course.id === "admin" ? "Admin Operator" : "Reader Initiate"}
          </div>
          <p className="mt-2 text-sm text-[var(--ink2)]">
            You completed every module. Print this page for a keepsake certificate.
          </p>
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="mt-4 rounded-md border border-[var(--gold)] px-4 py-2 text-xs font-bold uppercase tracking-[2px] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black"
          >
            Print certificate
          </button>
        </div>
      )}
    </div>
  );
}
