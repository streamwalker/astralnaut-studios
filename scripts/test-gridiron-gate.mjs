import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes, createCipheriv, webcrypto } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { serveLibrary, ENCRYPTED_ASSET } from '../server/gridiron-zero/gate.mjs';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const config = { url: 'https://identity.example', key: 'public-publishable-key' };
function fixture({ role = 'admin', expired = false, roleError = false, tamper = false } = {}) {
  const key = randomBytes(32), iv = randomBytes(12), text = '<!doctype html><title>Private test document</title>';
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const payload = Buffer.concat([iv, cipher.update(gzipSync(text)), cipher.final(), cipher.getAuthTag()]);
  if (tamper) payload[payload.length - 1] ^= 1;
  let assetCalls = 0, authCalls = 0;
  const env = { GRIDIRON_LIBRARY_KEY_V1: key.toString('base64'), ASSETS: { fetch: async request => {
    assetCalls++; assert.equal(new URL(request.url).pathname, ENCRYPTED_ASSET);
    assert.equal(request.headers.get('authorization'), null);
    return new Response(payload);
  } } };
  const fetcher = async (url, options) => {
    authCalls++; assert.equal(options.headers.authorization, 'Bearer test-token');
    if (url.endsWith('/auth/v1/user')) return Response.json(expired ? {} : { id: 'verified-user' }, { status: expired ? 401 : 200 });
    assert.ok(url.includes('user_id=eq.verified-user'));
    return Response.json(role ? [{ role }] : [], { status: roleError ? 503 : 200 });
  };
  const request = new Request('https://studio.example/api/admin/gridiron-zero/library', { headers: { authorization: 'Bearer test-token' } });
  return { env, fetcher, request, text, counts: () => ({ assetCalls, authCalls }) };
}
test('anonymous and malformed tokens cannot access the document', async () => {
  for (const authorization of ['', 'Basic value', 'Bearer ']) {
    const f = fixture(); const r = await serveLibrary(new Request(f.request.url, { headers: { authorization } }), f.env, config, f.fetcher);
    assert.equal(r.status, 401); assert.deepEqual(f.counts(), { assetCalls: 0, authCalls: 0 });
  }
});
test('expired session is rejected before content access', async () => {
  const f = fixture({ expired: true }); const r = await serveLibrary(f.request, f.env, config, f.fetcher);
  assert.equal(r.status, 401); assert.equal(f.counts().assetCalls, 0);
});
test('signed-in non-admin and unassigned users cannot access content', async () => {
  for (const role of ['subscriber', 'editor', null]) {
    const f = fixture({ role }); const r = await serveLibrary(f.request, f.env, config, f.fetcher);
    assert.equal(r.status, 403); assert.equal(f.counts().assetCalls, 0);
  }
});
test('role lookup errors fail closed', async () => {
  const f = fixture({ roleError: true }); const r = await serveLibrary(f.request, f.env, config, f.fetcher);
  assert.equal(r.status, 503); assert.equal(f.counts().assetCalls, 0);
});
test('verified admin receives the exact decrypted content with no-store headers', async () => {
  const f = fixture(); const r = await serveLibrary(f.request, f.env, config, f.fetcher);
  assert.equal(r.status, 200); assert.equal(await r.text(), f.text);
  assert.match(r.headers.get('cache-control'), /no-store/); assert.equal(r.headers.get('vary'), 'Authorization');
  assert.match(r.headers.get('x-robots-tag'), /noindex/);
});
test('modified ciphertext and missing key never return plaintext', async () => {
  const f = fixture({ tamper: true }); assert.equal((await serveLibrary(f.request, f.env, config, f.fetcher)).status, 503);
  delete f.env.GRIDIRON_LIBRARY_KEY_V1;
  assert.equal((await serveLibrary(f.request, f.env, config, f.fetcher)).status, 503);
});
test('unsupported methods are rejected', async () => {
  const f = fixture(); assert.equal((await serveLibrary(new Request(f.request.url, { method: 'POST' }), f.env, config, f.fetcher)).status, 405);
  assert.equal(f.counts().authCalls, 0);
});
test('deployment artifact uses the gate and keeps content encrypted', async () => {
  const config = JSON.parse(await readFile('.output/server/wrangler.json', 'utf8'));
  assert.equal(config.main, 'gridiron-entry.mjs');
  assert.ok(config.assets.run_worker_first === true || config.assets.run_worker_first.includes('/api/admin/gridiron-zero/*'));
  const asset = await readFile('.output/public' + ENCRYPTED_ASSET);
  assert.ok(!asset.includes(Buffer.from('<!DOCTYPE html>')));
  const source = await readFile('private-content/gridiron-zero/library-v1.enc');
  assert.deepEqual(asset, source);
});
