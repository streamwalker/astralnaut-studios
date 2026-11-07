// Private content is decrypted only after Supabase verifies the session AND admin role.
export const LIBRARY_ENDPOINT = "/api/admin/gridiron-zero/library";
export const ENCRYPTED_ASSET = "/assets/gridiron-zero/library-v1.enc";
export const COMICS_ENDPOINT = "/api/admin/gridiron-zero/comics";
export const COMICS_ASSET_ROOT = "/assets/gridiron-zero/comics-v1";
const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  Vary: "Authorization",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const errorResponse = (status, message) =>
  new Response(message, { status, headers: PRIVATE_HEADERS });
async function authorizeAdmin(request, env, publicConfig, fetcher) {
  if (request.method !== "GET") return errorResponse(405, "Method not allowed");
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/.test(authorization))
    return errorResponse(401, "Sign in required");
  const url = env.SUPABASE_URL || publicConfig.url,
    apikey = env.SUPABASE_PUBLISHABLE_KEY || publicConfig.key;
  if (!url || !apikey) return errorResponse(503, "Library temporarily unavailable");
  const headers = { authorization, apikey };
  const response = await fetcher(`${url}/auth/v1/user`, { headers });
  if (!response.ok)
    return errorResponse(response.status >= 500 ? 503 : 401, "Session could not be verified");
  const user = await response.json();
  if (!user.id || typeof user.id !== "string") return errorResponse(401, "Invalid session");
  const query = new URLSearchParams({
    select: "role",
    user_id: `eq.${user.id}`,
    role: "eq.admin",
    limit: "1",
  });
  const roleResponse = await fetcher(`${url}/rest/v1/user_roles?${query}`, { headers });
  if (!roleResponse.ok) return errorResponse(503, "Access could not be verified");
  const roles = await roleResponse.json();
  if (!Array.isArray(roles) || !roles.some((row) => row.role === "admin"))
    return errorResponse(403, "Admin access required");
}
async function decryptResponse(request, env, keyValue, assetPath, contentType) {
  if (!keyValue || !env.ASSETS) return errorResponse(503, "Library temporarily unavailable");
  const asset = await env.ASSETS.fetch(new Request(new URL(assetPath, request.url)));
  if (!asset.ok) return errorResponse(503, "Library temporarily unavailable");
  const encrypted = new Uint8Array(await asset.arrayBuffer());
  if (encrypted.length < 29) return errorResponse(503, "Library temporarily unavailable");
  const keyBytes = Uint8Array.from(atob(keyValue), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const compressed = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: encrypted.subarray(0, 12) },
    key,
    encrypted.subarray(12),
  );
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream, { headers: { ...PRIVATE_HEADERS, "Content-Type": contentType } });
}
export async function serveLibrary(request, env, publicConfig, fetcher = fetch) {
  try {
    const denied = await authorizeAdmin(request, env, publicConfig, fetcher);
    if (denied) return denied;
    return await decryptResponse(
      request,
      env,
      env.GRIDIRON_LIBRARY_KEY_V1,
      ENCRYPTED_ASSET,
      "text/html; charset=utf-8",
    );
  } catch {
    return errorResponse(503, "Library temporarily unavailable");
  }
}
export async function serveComics(request, env, publicConfig, fetcher = fetch) {
  try {
    const denied = await authorizeAdmin(request, env, publicConfig, fetcher);
    if (denied) return denied;
    const path = new URL(request.url).pathname.replace(/\/$/, "");
    const id = path === COMICS_ENDPOINT ? "catalog" : path.slice(COMICS_ENDPOINT.length + 1);
    if (
      path !== COMICS_ENDPOINT &&
      (!path.startsWith(COMICS_ENDPOINT + "/") || !/^[a-f0-9]{18}$/.test(id))
    )
      return errorResponse(404, "Page not found");
    return await decryptResponse(
      request,
      env,
      env.GRIDIRON_COMICS_KEY_V1,
      `${COMICS_ASSET_ROOT}/${id}.enc`,
      id === "catalog" ? "application/json; charset=utf-8" : "image/jpeg",
    );
  } catch {
    return errorResponse(503, "Library temporarily unavailable");
  }
}
