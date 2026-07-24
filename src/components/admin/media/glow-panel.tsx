import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { buildGlowFilter, HERO_GLOW_QUERY_KEY, type HeroGlow } from "@/lib/hero-glow";
import { upsertHeroGlow } from "@/lib/hero-glow.functions";
import baLogo from "@/assets/battlefield-atlantis-logo-clean.png";
import daLogo from "@/assets/darker-ages-logo-clean.png";
import coaLogo from "@/assets/children-of-aquarius-logo-clean.png";

const SERIES: { slug: string; name: string; logo: string; bg: string }[] = [
  { slug: "battlefield-atlantis", name: "Battlefield Atlantis", logo: baLogo, bg: "#04121f" },
  { slug: "darker-ages", name: "Darker Ages", logo: daLogo, bg: "#1c0802" },
  { slug: "children-of-aquarius", name: "Children of Aquarius", logo: coaLogo, bg: "#02121e" },
];

const DEFAULTS: HeroGlow = {
  series_slug: "",
  enabled: true,
  color: "#ffffff",
  intensity: 55,
  spread: 42,
};

export function LogoGlowPanel() {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertHeroGlow);

  const { data: rows } = useQuery({
    queryKey: HERO_GLOW_QUERY_KEY,
    queryFn: async (): Promise<HeroGlow[]> => {
      const { data, error } = await supabase
        .from("hero_logo_glow")
        .select("series_slug, enabled, color, intensity, spread");
      if (error) throw error;
      return (data ?? []) as HeroGlow[];
    },
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tune the glow shown behind each hero logo on the landing page carousel. Changes apply live for all visitors.
      </p>
      {SERIES.map((s) => {
        const current = rows?.find((r) => r.series_slug === s.slug);
        return (
          <GlowRow
            key={s.slug}
            series={s}
            initial={current ?? { ...DEFAULTS, series_slug: s.slug }}
            onSave={async (next) => {
              await upsert({ data: next });
              await qc.invalidateQueries({ queryKey: HERO_GLOW_QUERY_KEY });
              toast.success(`${s.name} glow saved`);
            }}
          />
        );
      })}
    </div>
  );
}

function GlowRow({
  series,
  initial,
  onSave,
}: {
  series: { slug: string; name: string; logo: string; bg: string };
  initial: HeroGlow;
  onSave: (next: HeroGlow) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [color, setColor] = useState(initial.color);
  const [intensity, setIntensity] = useState(initial.intensity);
  const [spread, setSpread] = useState(initial.spread);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEnabled(initial.enabled);
    setColor(initial.color);
    setIntensity(initial.intensity);
    setSpread(initial.spread);
  }, [initial.enabled, initial.color, initial.intensity, initial.spread]);

  const preview: HeroGlow = { series_slug: series.slug, enabled, color, intensity, spread };
  const dirty =
    enabled !== initial.enabled ||
    color.toLowerCase() !== initial.color.toLowerCase() ||
    intensity !== initial.intensity ||
    spread !== initial.spread;

  const validHex = /^#[0-9a-fA-F]{6}$/.test(color);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold">{series.name}</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor={`glow-${series.slug}-on`} className="text-xs uppercase tracking-widest text-muted-foreground">
            Glow
          </Label>
          <Switch id={`glow-${series.slug}-on`} checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={validHex ? color : "#ffffff"}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border bg-transparent"
                aria-label={`${series.name} glow color picker`}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="max-w-[160px] font-mono"
                aria-label={`${series.name} glow color hex`}
              />
              {!validHex && <span className="text-xs text-destructive">Use #RRGGBB</span>}
            </div>
          </div>

          <RangeField
            label={`Intensity — ${intensity}`}
            id={`glow-${series.slug}-intensity`}
            min={0}
            max={100}
            value={intensity}
            onChange={setIntensity}
          />
          <RangeField
            label={`Spread — ${spread}px`}
            id={`glow-${series.slug}-spread`}
            min={0}
            max={120}
            value={spread}
            onChange={setSpread}
          />

          <div className="flex items-center gap-3 pt-2">
            <Button
              disabled={!dirty || !validHex || saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onSave(preview);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Save failed");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outline"
              disabled={!dirty || saving}
              onClick={() => {
                setEnabled(initial.enabled);
                setColor(initial.color);
                setIntensity(initial.intensity);
                setSpread(initial.spread);
              }}
            >
              Reset
            </Button>
          </div>
        </div>

        <div
          className="flex h-[220px] items-center justify-center rounded-xl border border-border"
          style={{ background: series.bg }}
        >
          <img
            src={series.logo}
            alt=""
            className="max-h-[140px] w-auto max-w-[280px] object-contain"
            style={{ filter: buildGlowFilter(preview) }}
          />
        </div>
      </div>
    </div>
  );
}

function RangeField({
  label,
  id,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  id: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
