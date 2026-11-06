// The document is decrypted only after Supabase verifies the user AND admin role.
export const LIBRARY_ENDPOINT = '/api/admin/gridiron-zero/library';
export const ENCRYPTED_ASSET = '/assets/gridiron-zero/library-v1.enc';
const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vary': 'Authorization',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};
const errorResponse = (status, message) => new Response(message, { status, headers: PRIVATE_HEADERS });

export async function serveLibrary(request, env, publicConfig, fetcher = fetch) {
  if (request.method !== 'GET') return errorResponse(405, 'Method not allowed');
  const authorization = request.headers.get('authorization');
  if (!authorization || !/^Bearer \S+$/.test(authorization)) return errorResponse(401, 'Sign in required');
  const url = env.SUPABASE_URL || publicConfig.url;
  const apikey = env.SUPABASE_PUBLISHABLE_KEY || publicConfig.key;
  if (!url || !apikey) return errorResponse(503, 'Library temporarily unavailable');
  try {
    const headers = { authorization, apikey };
    const identityResponse = await fetcher(`${url}/auth/v1/user`, { headers });
    if (!identityResponse.ok) return errorResponse(identityResponse.status >= 500 ? 503 : 401, 'Session could not be verified');
    const identity = await identityResponse.json();
    if (!identity.id || typeof identity.id !== 'string') return errorResponse(401, 'Invalid session');
    const query = new URLSearchParams({ select: 'role', user_id: `eq.${identity.id}`, role: 'eq.admin', limit: '1' });
    const roleResponse = await fetcher(`${url}/rest/v1/user_roles?${query}`, { headers });
    if (!roleResponse.ok) return errorResponse(503, 'Access could not be verified');
    const roles = await roleResponse.json();
    if (!Array.isArray(roles) || !roles.some(row => row.role === 'admin')) return errorResponse(403, 'Admin access required');
    if (!env.GRIDIRON_LIBRARY_KEY_V1 || !env.ASSETS) return errorResponse(503, 'Library temporarily unavailable');
    const asset = await env.ASSETS.fetch(new Request(new URL(ENCRYPTED_ASSET, request.url)));
    if (!asset.ok) return errorResponse(503, 'Library temporarily unavailable');
    const encrypted = new Uint8Array(await asset.arrayBuffer());
    if (encrypted.length < 29) return errorResponse(503, 'Library temporarily unavailable');
    const keyBytes = Uint8Array.from(atob(env.GRIDIRON_LIBRARY_KEY_V1), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    const compressed = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: encrypted.subarray(0, 12) }, key, encrypted.subarray(12));
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream, { headers: { ...PRIVATE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' } });
  } catch {
    // Never return provider responses, tokens, or decryption details to the browser.
    return errorResponse(503, 'Library temporarily unavailable');
  }
}
