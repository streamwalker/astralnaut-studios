import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { serveBattlefieldPreview } from '../src/lib/share-video.server.ts';
const bytes = await readFile(new URL('../public/share/v2/battlefield-atlantis-preview-v2.mp4', import.meta.url));
let fetches=0;
globalThis.fetch = async () => {fetches++; return new Response(bytes, {headers:{'Content-Length':String(bytes.length)}})};
async function check(range, start, end) {
 const res=await serveBattlefieldPreview(new Request('https://example.test/media/preview.mp4',{headers:{Range:range}}));
 assert.equal(res.status,206);assert.equal(res.headers.get('Content-Range'),`bytes ${start}-${end}/${bytes.length}`);
 assert.equal(res.headers.get('Content-Length'),String(end-start+1));
 assert.deepEqual(Buffer.from(await res.arrayBuffer()),bytes.subarray(start,end+1));
}
await check('bytes=0-1',0,1);
await check('bytes=100-299',100,299);
await check('bytes=1632170-',1632170,bytes.length-1);
await check('bytes=-100',bytes.length-100,bytes.length-1);
await check('bytes=1632170-9999999',1632170,bytes.length-1);
for(const range of ['bytes=-0','bytes=1632177-','bytes=5-2','bytes=','bytes=nope']) {
 const before=fetches;const r=await serveBattlefieldPreview(new Request('https://example.test',{headers:{Range:range}}));
 assert.equal(r.status,416);assert.equal(fetches,before);assert.equal((await r.arrayBuffer()).byteLength,0);
}
const head=await serveBattlefieldPreview(new Request('https://example.test',{method:'HEAD'}));
assert.equal(head.status,200);assert.equal(head.headers.get('Content-Length'),String(bytes.length));assert.equal(await head.text(),'');
const full=await serveBattlefieldPreview(new Request('https://example.test',{headers:{Range:'bytes=0-1','If-Range':'"old"'}}));
assert.equal(full.status,200);assert.deepEqual(Buffer.from(await full.arrayBuffer()),bytes);
const cached=await serveBattlefieldPreview(new Request('https://example.test',{headers:{'If-None-Match':head.headers.get('ETag')}}));assert.equal(cached.status,304);
globalThis.fetch=async()=>new Response(bytes.subarray(0,20),{headers:{'Content-Length':String(bytes.length)}});
assert.equal((await serveBattlefieldPreview(new Request('https://example.test',{headers:{Range:'bytes=0-1'}}))).status,502);
globalThis.fetch=async()=>new Response(bytes);
await check('bytes=0-1',0,1);
globalThis.fetch=async()=>new Response(Buffer.concat([bytes,Buffer.from([1])]),{headers:{'Content-Length':String(bytes.length)}});
assert.equal((await serveBattlefieldPreview(new Request('https://example.test',{headers:{Range:'bytes=0-1'}}))).status,502);
console.log('Passed exact bytes, bounded/open/suffix ranges, invalid ranges, HEAD, If-Range, validators and truncated-source checks.');
