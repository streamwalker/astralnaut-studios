import { useCallback, useEffect, useState } from "react";
import { applyLang, detectLang, LANGS } from "@/lib/i18n";

/**
 * Applies translations to all [data-i18n*] elements in the current page
 * and re-applies after layout changes. Returns current lang + setter.
 *
 * Re-run on every render to catch newly-mounted nodes (cheap — just DOM walks).
 */
export function useI18n() {
  const [lang, setLangState] = useState<string>(() => {
    if (typeof window === "undefined") return "en";
    return detectLang();
  });

  useEffect(() => {
    applyLang(lang);
  });

  const setLang = useCallback((next: string) => {
    if (!LANGS[next]) return;
    setLangState(next);
    applyLang(next);
  }, []);

  return { lang, setLang, languages: LANGS };
}
