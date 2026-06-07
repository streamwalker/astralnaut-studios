import { Globe } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();
  const current = languages[lang] ?? languages.en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 rounded-md border border-[var(--border-line)] bg-black/30 px-2.5 py-1.5 text-xs font-bold uppercase tracking-[2px] text-[var(--ink2)] hover:text-[var(--neon)]"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.code}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
        {Object.entries(languages).map(([code, meta]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLang(code)}
            className={code === lang ? "font-bold text-[var(--neon)]" : ""}
          >
            <span className="mr-2 inline-block w-6 text-xs opacity-60">{meta.code}</span>
            {meta.native}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
