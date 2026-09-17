import type { Fetcher } from "@cloudflare/workers-types";

const ASSET = "/share/v2/battlefield-atlantis-preview-v2.mp4";
const SIZE = 1632177;
const ETAG = '"ee9fd6f15243692a986eab7340e5001174462be62c59974a039fbbf9b01c61ef"';

/** One public, immutable preview. Never accepts an arbitrary asset path. */
export async function serveBattlefieldPreview(request: Request, assets?: Pick<Fetcher, "fetch">) {
  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Accept-Ranges": "bytes",
    "ETag": ETAG,
    // Keep partial responses out of intermediary caches that returned full bodies.
    "Cache-Control": "no-store, no-transform",
    "Content-Length": String(SIZE),
  });
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  if (request.headers.get("if-none-match")?.split(/\s*,\s*/).some(value => value === "*" || value.replace(/^W\//, "") === ETAG)) {
    headers.delete("Content-Length");
    return new Response(null, { status: 304, headers });
  }
  if (request.method === "HEAD") return new Response(null, { headers });

  const range = request.headers.get("range");
  const ifRange = request.headers.get("if-range");
  let bounds: [number, number] | undefined;
  // Multiple ranges and unknown units can legally fall back to the full file.
  if (range?.startsWith("bytes=") && !range.includes(",") && (!ifRange || ifRange === ETAG)) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number(match[1]) : Math.max(0, SIZE - Number(match?.[2]));
    const end = match?.[1] ? (match[2] ? Math.min(Number(match[2]), SIZE - 1) : SIZE - 1) : SIZE - 1;
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= SIZE || end < start) {
      headers.set("Content-Range", `bytes */${SIZE}`);
      headers.set("Content-Length", "0");
      return new Response(null, { status: 416, headers });
    }
    bounds = [start, end];
  }

  const url = `https://astralnautstudios.com${ASSET}`;
  // Nitro supplies this binding in production. Plain fetch supports local Vite.
  const source = assets ? await assets.fetch(url) : await fetch(url);
  if (source.status !== 200 || (source.headers.has("Content-Length") && Number(source.headers.get("Content-Length")) !== SIZE) || !source.body) {
    console.warn("Share preview source unavailable", { status: source.status, length: source.headers.get("Content-Length") });
    await source.body?.cancel();
    return new Response("Preview unavailable", { status: 502 });
  }
  if (!bounds) return new Response(source.body as ReadableStream<Uint8Array>, { headers });

  // Bound allocation to this known 1.63 MB export, including a dishonest source.
  const reader = source.body.getReader();
  const bytes = new Uint8Array(SIZE);
  let offset = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (offset + value.byteLength > SIZE) throw new Error("Preview size mismatch");
      bytes.set(value, offset);
      offset += value.byteLength;
    }
    if (offset !== SIZE) throw new Error("Incomplete preview");
  } catch {
    await reader.cancel();
    return new Response("Preview unavailable", { status: 502 });
  }
  const [start, end] = bounds;
  headers.set("Content-Range", `bytes ${start}-${end}/${SIZE}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}
