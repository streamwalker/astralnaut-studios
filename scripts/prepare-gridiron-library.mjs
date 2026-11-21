// Explicit one-time content update: encrypt locally, send key to GitHub via stdin.
// No plaintext manuscript or encryption key is written into this public repository.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, createCipheriv, createHash, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
if (!process.argv[2]) throw new Error('Pass the approved local library HTML path');
const existing = spawnSync('gh', ['secret', 'list', '--repo', 'streamwalker/astralnaut-studios', '--json', 'name'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
if (existing.status !== 0) throw new Error('Could not verify existing deployment secrets');
if (JSON.parse(existing.stdout).some(secret => secret.name === 'GRIDIRON_LIBRARY_KEY_V12')) throw new Error('Version 12 already exists. Use a new versioned key and payload; never replace the live key.');
let html = await readFile(process.argv[2], 'utf8');
const replacements = [
  ["if(location.hash!==hash)history.pushState(null,'',hash)", "if(window.parent.location.hash!==hash)window.parent.history.pushState(window.parent.history.state,'',hash)"],
  ["decodeURIComponent(location.hash.slice(1))", "decodeURIComponent(window.parent.location.hash.slice(1))"],
  ["if(location.hash!==hash)history.replaceState(null,'',hash)", "if(window.parent.location.hash!==hash)window.parent.history.replaceState(window.parent.history.state,'',hash)"],
  ["location.href.split('#')[0]", "window.parent.location.href.split('#')[0]"],
  ["Character link copied. This local link works on this computer.", "Character link copied. Admin sign-in is required to open it."],
  ["This local link points to the file on this computer.", "This character link opens the private library after admin sign-in."],
  ["window.addEventListener('hashchange'", "window.parent.addEventListener('hashchange'"],
];
for (const [before, after] of replacements) {
  if (!html.includes(before)) throw new Error('Hosted adaptation did not match the expected library source');
  html = html.replace(before, after);
}
html = html.replace('<head>', '<head><meta name="robots" content="noindex,nofollow,noarchive">');
const key = randomBytes(32);
const plain = Buffer.from(html);
const split = Math.ceil(plain.length / 2);
const chunks = [plain.subarray(0, split), plain.subarray(split)];
const files = chunks.map((chunk, i) => {
  const name = `library-v12-part-${i + 1}.enc`;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const bytes = Buffer.concat([iv, cipher.update(gzipSync(chunk)), cipher.final(), cipher.getAuthTag()]);
  if (bytes.length > 25 * 1024 * 1024) throw new Error('Encrypted part exceeds the hosting asset limit');
  const check = createDecipheriv('aes-256-gcm', key, iv);
  check.setAuthTag(bytes.subarray(-16));
  const restored = gunzipSync(Buffer.concat([check.update(bytes.subarray(12, -16)), check.final()]));
  if (!chunk.equals(restored)) throw new Error('Encrypted library round-trip failed');
  return { name, bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
});
const result = spawnSync('gh', ['secret', 'set', 'GRIDIRON_LIBRARY_KEY_V12', '--repo', 'streamwalker/astralnaut-studios'], { input: key.toString('base64'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
if (result.status !== 0) throw new Error('Could not save the private deployment key; no payload written');
await mkdir('private-content/gridiron-zero', { recursive: true });
for (const file of files) await writeFile('private-content/gridiron-zero/' + file.name, file.bytes);
const manifest = {
  version: 12, edition: new Date().toISOString().slice(0,10), format: 'UTF-8 HTML in ordered, independently AES-256-GCM authenticated gzip parts',
  keyBinding: 'GRIDIRON_LIBRARY_KEY_V12',
  files: files.map(f => ({ name: f.name, sha256: f.sha256, bytes: f.bytes.length })),
  htmlSha256: createHash('sha256').update(plain).digest('hex'),
  sourceSha256: createHash('sha256').update(await readFile(process.argv[2])).digest('hex'),
  htmlBytes: plain.length, encryptedBytes: files.reduce((sum,f) => sum + f.bytes.length,0),
};
await writeFile('private-content/gridiron-zero/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ encryptedBytes: manifest.encryptedBytes, htmlBytes: manifest.htmlBytes, parts: files.length, roundTripVerified: true }));
key.fill(0);
