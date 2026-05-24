import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { MarkdownLite } from "@/components/help/MarkdownLite";
import { useLocalStorage } from "@/lib/useLocalStorage";
import type { Course, Lesson } from "@/content/learn/types";

type Progress = Record<string, boolean>;

export function LessonView({ course, lesson }: { course: Course; lesson: Lesson }) {
  const idx = course.modules.findIndex((m) => m.id === lesson.id);
  const prev = idx > 0 ? course.modules[idx - 1] : null;
  const next = idx < course.modules.length - 1 ? course.modules[idx + 1] : null;
  const nav = useNavigate();

  const [progress, setProgress] = useLocalStorage<Progress>(`course:${course.id}`, {});
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    let s = 0;
    lesson.quiz.forEach((q, i) => {
      if (answers[i] === q.answerIndex) s++;
    });
    return s;
  }, [answers, lesson.quiz]);

  const passed = submitted && score === lesson.quiz.length;

  const markComplete = () => {
    setSubmitted(true);
    if (score === lesson.quiz.length) {
      setProgress({ ...progress, [lesson.id]: true });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        to={course.basePath as "/learn"}
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--ink2)] hover:text-[var(--neon)]"
      >
        <ArrowLeft width={12} height={12} /> Course overview
      </Link>

      <div className="mt-4 text-[10px] font-bold uppercase tracking-[3px] text-[var(--gold)]">
        Module {idx + 1} of {course.modules.length}
      </div>
      <h1 className="mt-1 text-3xl font-extrabold text-[var(--ink)]">{lesson.title}</h1>
      <p className="mt-2 text-[var(--ink2)]">{lesson.summary}</p>

      <div className="mt-6 rounded-xl border border-[var(--border-line)] bg-black/20 p-6">
        <MarkdownLite source={lesson.body} />
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border-line)] bg-black/20 p-6">
        <div className="text-xs font-bold uppercase tracking-[2px] text-[var(--gold)]">
          Knowledge check
        </div>
        <h2 className="mt-1 text-xl font-bold text-[var(--ink)]">Answer 3 quick questions</h2>

        <ol className="mt-4 space-y-5">
          {lesson.quiz.map((q, qi) => (
            <li key={qi}>
              <div className="font-semibold text-[var(--ink)]">
                {qi + 1}. {q.q}
              </div>
              <div className="mt-2 space-y-1.5">
                {q.options.map((opt, oi) => {
                  const isPicked = answers[qi] === oi;
                  const isCorrect = q.answerIndex === oi;
                  const showRight = submitted && isCorrect;
                  const showWrong = submitted && isPicked && !isCorrect;
                  return (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        showRight
                          ? "border-[var(--neon)] bg-[rgba(34,211,255,0.06)] text-[var(--ink)]"
                          : showWrong
                            ? "border-red-500/60 text-red-300"
                            : isPicked
                              ? "border-[var(--neon)] text-[var(--ink)]"
                              : "border-[var(--border-line)] text-[var(--ink2)] hover:border-[var(--ink2)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={isPicked}
                        onChange={() => setAnswers({ ...answers, [qi]: oi })}
                        className="accent-[var(--neon)]"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!passed && (
            <button
              onClick={markComplete}
              disabled={Object.keys(answers).length < lesson.quiz.length}
              className="rounded-md bg-[var(--neon)] px-4 py-2 text-sm font-bold uppercase tracking-[2px] text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitted ? "Try again" : "Submit answers"}
            </button>
          )}
          {submitted && (
            <span
              className={`text-sm font-semibold ${
                passed ? "text-[var(--neon)]" : "text-[var(--gold)]"
              }`}
            >
              Score: {score} / {lesson.quiz.length}
              {passed ? " — module complete!" : " — try again to mark complete."}
            </span>
          )}
          {passed && progress[lesson.id] && (
            <span className="inline-flex items-center gap-1 text-sm text-[var(--neon)]">
              <CheckCircle2 width={14} height={14} /> Saved
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        {prev ? (
          <Link
            to={`${course.basePath}/$moduleId` as "/learn/$moduleId"}
            params={{ moduleId: prev.id }}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-line)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--neon)] hover:text-[var(--neon)]"
          >
            <ArrowLeft width={14} height={14} /> Previous
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <button
            onClick={() => nav({ to: `${course.basePath}/$moduleId` as "/learn/$moduleId", params: { moduleId: next.id } })}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-line)] px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--neon)] hover:text-[var(--neon)]"
          >
            Next module <ArrowRight width={14} height={14} />
          </button>
        ) : (
          <Link
            to={course.basePath as "/learn"}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--gold)] px-4 py-2 text-sm font-bold uppercase tracking-[2px] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black"
          >
            Finish course
          </Link>
        )}
      </div>
    </div>
  );
}
