import { LANGS, I18N } from "./i18n-dictionary";

export { LANGS, I18N };
export type LangCode = keyof typeof LANGS;

const STORAGE_KEY = "rwc-lang";

export function getCurrentLang(): string | null {
  if (typeof localStorage === "undefined") return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function detectLang(): string {
  const saved = getCurrentLang();
  if (saved && LANGS[saved]) return saved;
  if (typeof navigator === "undefined") return "en";
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("zh-tw") || nav.startsWith("zh-hk") || nav.startsWith("yue")) return "yue";
  if (nav.startsWith("zh")) return "zh";
  const base = nav.slice(0, 2);
  return LANGS[base] ? base : "en";
}

export function t(key: string, lang?: string): string | undefined {
  const dict = (lang && I18N[lang]) || I18N.en;
  return dict[key] !== undefined ? dict[key] : I18N.en[key];
}

/** Walk the DOM applying translations to every [data-i18n*] element. */
export function applyLang(lang: string): void {
  if (typeof document === "undefined") return;
  if (!LANGS[lang]) lang = "en";
  const dict = I18N[lang] || I18N.en;
  const fallback = I18N.en;

  document.documentElement.lang = lang;
  document.documentElement.dir = LANGS[lang].dir || "ltr";

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n")!;
    const val = dict[key] ?? fallback[key];
    if (val !== undefined) el.textContent = val;
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html")!;
    const val = dict[key] ?? fallback[key];
    if (val !== undefined) el.innerHTML = val;
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-attr]").forEach((el) => {
    el.getAttribute("data-i18n-attr")!.split(",").forEach((pair) => {
      const [attr, key] = pair.split(":").map((s) => s.trim());
      const val = dict[key] ?? fallback[key];
      if (val !== undefined) el.setAttribute(attr, val);
    });
  });

  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* noop */ }
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}
