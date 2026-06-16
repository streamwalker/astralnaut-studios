type Variant = "series" | "reader" | "preview" | "shop" | "product" | "characters";

export function RightsNotice({
  variant,
  title,
  issueNumber,
  className = "",
}: {
  variant: Variant;
  title?: string;
  issueNumber?: number | string;
  className?: string;
}) {
  const t = title ?? "this title";

  let body: React.ReactNode = null;
  if (variant === "series") {
    body = (
      <>
        <em>{t}</em>™ and all related characters, names, storylines, logos, and indicia are owned by Real World Comics, LLC.
        Original text and the selection and arrangement of materials are protected by copyright. Unauthorized reproduction,
        distribution, adaptation, scraping, or AI-training use is prohibited.
      </>
    );
  } else if (variant === "reader") {
    body = (
      <>
        © 2026 Real World Comics, LLC. <em>{t}</em> Issue #{issueNumber}. For personal, non-commercial reading only. No
        downloading, redistribution, or use for AI/dataset training.
      </>
    );
  } else if (variant === "preview") {
    body = (
      <>
        <strong>Preview — free pages.</strong> © 2026 Real World Comics, LLC. Shared for preview only; not licensed for
        redistribution or AI training.
      </>
    );
  } else if (variant === "shop") {
    body = (
      <>
        © 2026 Real World Comics, LLC. Official Real World Comics merchandise. Designs, names, and logos are trademarks
        of Real World Comics, LLC. Unauthorized reproduction prohibited.
      </>
    );
  } else if (variant === "product") {
    body = (
      <>
        © 2026 Real World Comics, LLC. Official <em>{t}</em> merchandise. Designs, names, and logos are trademarks of
        Real World Comics, LLC. Unauthorized reproduction prohibited.
      </>
    );
  } else if (variant === "characters") {
    body = <>Characters, names, and likenesses © / ™ 2026 Real World Comics, LLC.</>;
  }

  return (
    <aside
      className={`mt-8 rounded-md border border-[var(--border-line)] bg-black/30 px-4 py-3 text-[11px] leading-relaxed text-[var(--mute)] ${className}`}
      aria-label="Rights notice"
    >
      {body}
    </aside>
  );
}
