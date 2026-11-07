import { useState } from "react";
import type { ImgHTMLAttributes } from "react";
// Key this component by source when switching pages so loading/error state is reset.
export function ComicImage({
  src,
  onLoad,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading"),
    [attempt, setAttempt] = useState(0);
  return (
    <div className="relative min-h-24">
      {state === "loading" && (
        <p
          role="status"
          className="absolute inset-x-0 top-5 z-10 text-center text-sm text-slate-400"
        >
          Loading artwork…
        </p>
      )}
      {state === "error" ? (
        <div
          role="alert"
          className="flex min-h-60 flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <p>This page could not load.</p>
          <button
            className="btn-ghost min-h-11 rounded-lg border border-white/20 px-5"
            onClick={() => {
              setAttempt((a) => a + 1);
              setState("loading");
            }}
          >
            Retry artwork
          </button>
        </div>
      ) : (
        <img
          key={attempt}
          {...props}
          src={src}
          onLoad={(e) => {
            setState("ready");
            onLoad?.(e);
          }}
          onError={(e) => {
            setState("error");
            onError?.(e);
          }}
        />
      )}
    </div>
  );
}
