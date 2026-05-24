import { HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  /** Short tip (renders as tooltip). */
  text?: string;
  /** Rich tip (renders as hover card). Takes precedence over text. */
  title?: string;
  description?: React.ReactNode;
  /** Optional learn-more link (URL). */
  href?: string;
  className?: string;
  size?: number;
};

/**
 * Inline (?) helper. Hover or focus to see the tip.
 * Pass `text` for a short label, or `title`+`description` for a rich popover.
 */
export function HelpTip({ text, title, description, href, className, size = 14 }: Props) {
  const icon = (
    <button
      type="button"
      aria-label={text || title || "Help"}
      className={`inline-flex items-center justify-center align-middle text-[var(--ink2)] transition-colors hover:text-[var(--neon)] focus:text-[var(--neon)] focus:outline-none ${className ?? ""}`}
    >
      <HelpCircle width={size} height={size} />
    </button>
  );

  if (title || description) {
    return (
      <HoverCard openDelay={120} closeDelay={80}>
        <HoverCardTrigger asChild>{icon}</HoverCardTrigger>
        <HoverCardContent
          className="w-72 border-[var(--border-line)] bg-[rgba(2,0,12,0.95)] text-[var(--ink2)] shadow-xl"
          align="start"
        >
          {title && (
            <div className="mb-1 text-sm font-bold text-[var(--ink)]">{title}</div>
          )}
          {description && <div className="text-xs leading-relaxed">{description}</div>}
          {href && (
            <a
              href={href}
              className="mt-2 inline-block text-xs font-semibold text-[var(--neon)] hover:underline"
            >
              Learn more →
            </a>
          )}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{icon}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}
