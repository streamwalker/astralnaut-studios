import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CheckResult = {
  id: string;
  url: string;
  status: "ok" | "redirect" | "broken" | "error";
  http_status: number | null;
  note: string | null;
};

const OUR_DOMAINS = [
  "astralnautstudios.com",
  "astralnaut-studios.lovable.app",
  "darkerages.com",
  "battlefieldatlantis.com",
];

async function checkOne(url: string): Promise<Omit<CheckResult, "id" | "url">> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    // Try HEAD first (cheap). Some hosts return 405/403 for HEAD, fall back to GET.
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "AstralnautStudios-BacklinkChecker/1.0" },
    });
    if (res.status === 405 || res.status === 403 || res.status === 400) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "AstralnautStudios-BacklinkChecker/1.0" },
      });
    }
    clearTimeout(timeout);

    const httpStatus = res.status;

    if (httpStatus >= 200 && httpStatus < 300) {
      // Optionally verify the backlink actually contains a link to us.
      let note: string | null = null;
      try {
        const getRes = res.headers.get("content-type")?.includes("text/html")
          ? res
          : await fetch(url, { method: "GET", redirect: "follow", headers: { "user-agent": "AstralnautStudios-BacklinkChecker/1.0" } });
        const html = await getRes.text();
        const hasLink = OUR_DOMAINS.some((d) => html.toLowerCase().includes(d));
        if (!hasLink) note = "Page resolves but no backlink to our domains found";
      } catch {
        // ignore body check errors — 2xx is still ok
      }
      return { status: "ok", http_status: httpStatus, note };
    }
    if (httpStatus >= 300 && httpStatus < 400) {
      return { status: "redirect", http_status: httpStatus, note: null };
    }
    return { status: "broken", http_status: httpStatus, note: `HTTP ${httpStatus}` };
  } catch (e) {
    clearTimeout(timeout);
    const msg = e instanceof Error ? e.message : String(e);
    return { status: "error", http_status: null, note: msg.slice(0, 300) };
  }
}

export async function runBacklinkCheck(limit = 50): Promise<{
  checked: number;
  broken: number;
  results: CheckResult[];
}> {
  const { data: rows, error } = await supabaseAdmin
    .from("outreach_prospects")
    .select("id, link_acquired_url")
    .eq("link_acquired", true)
    .not("link_acquired_url", "is", null)
    .order("link_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  const results: CheckResult[] = [];
  let broken = 0;

  for (const row of rows ?? []) {
    const url = row.link_acquired_url as string;
    if (!url) continue;
    const r = await checkOne(url);
    const full: CheckResult = { id: row.id, url, ...r };
    results.push(full);
    if (r.status === "broken" || r.status === "error") broken++;

    const { data: prev } = await supabaseAdmin
      .from("outreach_prospects")
      .select("link_failure_count")
      .eq("id", row.id)
      .maybeSingle();
    const failing = r.status === "broken" || r.status === "error";
    const nextFail = failing ? (prev?.link_failure_count ?? 0) + 1 : 0;

    await supabaseAdmin
      .from("outreach_prospects")
      .update({
        link_check_status: r.status,
        link_check_http_status: r.http_status,
        link_check_note: r.note,
        link_last_checked_at: new Date().toISOString(),
        link_failure_count: nextFail,
      })
      .eq("id", row.id);
  }

  return { checked: results.length, broken, results };
}
