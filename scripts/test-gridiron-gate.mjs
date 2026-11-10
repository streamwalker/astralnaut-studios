import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomBytes, createCipheriv, webcrypto } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { serveLibrary, ENCRYPTED_ASSET, serveComics, COMICS_ENDPOINT, COMICS_ASSET_ROOT } from '../server/gridiron-zero/gate.mjs';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const config = { url: 'https://identity.example', key: 'public-publishable-key' };
function fixture({ role = 'admin', expired = false, roleError = false, tamper = false, assetPath = ENCRYPTED_ASSET } = {}) {
  const key = randomBytes(32), iv = randomBytes(12), text = '<!doctype html><title>Private test document</title>';
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const payload = Buffer.concat([iv, cipher.update(gzipSync(text)), cipher.final(), cipher.getAuthTag()]);
  if (tamper) payload[payload.length - 1] ^= 1;
  let assetCalls = 0, authCalls = 0;
  const env = { GRIDIRON_LIBRARY_KEY_V7: key.toString('base64'), GRIDIRON_COMICS_KEY_V10: key.toString('base64'), ASSETS: { fetch: async request => {
    assetCalls++; assert.equal(new URL(request.url).pathname, assetPath);
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
  delete f.env.GRIDIRON_LIBRARY_KEY_V7;
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
  const source = await readFile('private-content/gridiron-zero/library-v7.enc');
  assert.deepEqual(asset, source);
});

for (const suffix of ['', '/0123456789abcdef01']) {
 test('comic endpoint denies anonymous, expired and non-admin requests: '+suffix, async()=>{
  const f=fixture();
  const anonymous=await serveComics(new Request('https://studio.example'+COMICS_ENDPOINT+suffix),f.env,config,f.fetcher);
  assert.equal(anonymous.status,401);assert.equal(f.counts().assetCalls,0);
  for(const options of [{role:'subscriber'},{role:null},{expired:true},{roleError:true}]){
   const trial=fixture(options);const r=await serveComics(new Request('https://studio.example'+COMICS_ENDPOINT+suffix,{headers:{authorization:'Bearer test-token'}}),trial.env,config,trial.fetcher);
   assert.ok([401,403,503].includes(r.status));assert.equal(trial.counts().assetCalls,0);
  }
 });
 test('comic endpoint authenticates and decrypts exact payload: '+suffix,async()=>{
  const f=fixture({assetPath:COMICS_ASSET_ROOT+'/'+(suffix?suffix.slice(1):'catalog')+'.enc'});
  const r=await serveComics(new Request('https://studio.example'+COMICS_ENDPOINT+suffix,{headers:{authorization:'Bearer test-token'}}),f.env,config,f.fetcher);
  assert.equal(r.status,200);assert.equal(await r.text(),f.text);assert.match(r.headers.get('cache-control'),/private.*no-store/);
  assert.equal(r.headers.get('content-type'),suffix?'image/jpeg':'application/json; charset=utf-8');
 });
}
test('comic requests reject invalid asset paths and missing keys without disclosure',async()=>{
 const f=fixture();
 for(const path of ['/other','/catalog.enc','/0123456789abcdef01/extra']){
  const r=await serveComics(new Request('https://studio.example'+COMICS_ENDPOINT+path,{headers:{authorization:'Bearer test-token'}}),f.env,config,f.fetcher);
  assert.equal(r.status,404);
 }
 assert.equal(f.counts().assetCalls,0);
 delete f.env.GRIDIRON_COMICS_KEY_V10;
 const r=await serveComics(new Request('https://studio.example'+COMICS_ENDPOINT,{headers:{authorization:'Bearer test-token'}}),f.env,config,f.fetcher);assert.equal(r.status,503);
});
test('comic ciphertext integrity is enforced',async()=>{
 const f=fixture({tamper:true,assetPath:COMICS_ASSET_ROOT+'/catalog.enc'});
 const r=await serveComics(new Request('https://studio.example'+COMICS_ENDPOINT,{headers:{authorization:'Bearer test-token'}}),f.env,config,f.fetcher);assert.equal(r.status,503);
});
test('all private comic assets and the API dispatcher are packaged',async()=>{
 const manifest=JSON.parse(await readFile('private-content/gridiron-zero/comics-v10/manifest.json','utf8'));
 assert.deepEqual(manifest.counts,{total:266,current:122,earlier:144});assert.equal(manifest.files.length,267);
 for(const f of manifest.files)assert.deepEqual(await readFile('.output/public'+COMICS_ASSET_ROOT+'/'+f.name),await readFile('private-content/gridiron-zero/comics-v10/'+f.name));
 const entry=await readFile('.output/server/gridiron-entry.mjs','utf8');assert.match(entry,/serveComics/);assert.match(entry,/startsWith\(COMICS_ENDPOINT/);
});
