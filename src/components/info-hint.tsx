import { useState } from "react";
import { Info } from "lucide-react";

import { glossaryEntry, type GlossaryKey } from "@/lib/glossary";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Side = "top" | "right" | "bottom" | "left";

/**
 * The body of every hint, rendered once here so the ⓘ next to a field and the
 * hover on a legend badge cannot drift apart in wording or layout.
 */
function GlossaryBody({ term }: { term: GlossaryKey }) {
  const entry = glossaryEntry(term);
  return (
    <>
      <p className="text-xs font-semibold">{entry.term}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{entry.short}</p>
      {entry.detail && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entry.detail}</p>
      )}
      {entry.example && (
        <p className="mt-2 rounded bg-muted/60 px-2 py-1 font-mono text-[11px] leading-relaxed">
          {entry.example}
        </p>
      )}
      {entry.gotcha && (
        <p className="mt-2 text-[11px] leading-relaxed text-amber-500">
          <span className="font-semibold">Watch out: </span>
          {entry.gotcha}
        </p>
      )}
    </>
  );
}

/**
 * Wrap anything — a badge, a word in a sentence — so it explains itself.
 *
 * Three input methods have to work, because all three are real: a mouse user
 * hovers, a keyboard user tabs, and a phone user taps. Radix gives us the first
 * two for free. The third needs help — Radix closes a tooltip on pointer-down,
 * which makes tapping the trigger on a touch device do nothing at all.
 * Preventing the default on pointer-down suppresses that internal handler
 * (Radix composes ours first and skips its own once the event is
 * default-prevented), so a tap toggles instead.
 *
 * Focus is deliberately not forced after a click. Letting it happen would let
 * Radix's own focus handler re-open the tooltip a beat after a tap closed it.
 * A keyboard user reaches the trigger by tabbing, which fires no pointer event,
 * so that path is unaffected.
 *
 * The trigger is always a real `<button>` rather than a `<span>` with a
 * handler: that is what puts it in the tab order and makes a screen reader
 * announce it as something you can activate.
 */
export function TermTooltip({
  term,
  children,
  side = "top",
  className,
}: {
  term: GlossaryKey;
  children: React.ReactNode;
  side?: Side;
  className?: string;
}) {
  const entry = glossaryEntry(term);
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`What is “${entry.term}”?`}
          onPointerDown={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
          className={cn(
            "cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        collisionPadding={12}
        className="max-w-xs border border-border bg-popover p-3 text-left text-popover-foreground shadow-lg"
      >
        <GlossaryBody term={term} />
      </TooltipContent>
    </Tooltip>
  );
}

/** The small ⓘ next to a field label. */
export function InfoHint({
  term,
  className,
  side = "top",
}: {
  term: GlossaryKey;
  className?: string;
  side?: Side;
}) {
  return (
    <TermTooltip
      term={term}
      side={side}
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground",
        className,
      )}
    >
      <Info className="h-3.5 w-3.5" aria-hidden="true" />
    </TermTooltip>
  );
}

/**
 * A label with its ⓘ already attached, so the pairing is consistent everywhere
 * rather than re-assembled by hand at each call site.
 */
export function LabelWithHint({
  htmlFor,
  children,
  term,
  className,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  term: GlossaryKey;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{children}</Label>
      <InfoHint term={term} />
    </span>
  );
}
