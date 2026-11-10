// Explicit one-time content update: encrypt locally, send key to GitHub via stdin.
// No plaintext manuscript or encryption key is written into this public repository.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, createCipheriv, createHash, createDecipheriv } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
if (!process.argv[2]) throw new Error('Pass the approved local library HTML path');
const existing = spawnSync('gh', ['secret', 'list', '--repo', 'streamwalker/astralnaut-studios', '--json', 'name'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
if (existing.status !== 0) throw new Error('Could not verify existing deployment secrets');
if (JSON.parse(existing.stdout).some(secret => secret.name === 'GRIDIRON_LIBRARY_KEY_V6')) throw new Error('Version 6 already exists. Use a new versioned key and payload; never replace the live key.');
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
const key = randomBytes(32), iv = randomBytes(12);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([iv, cipher.update(gzipSync(Buffer.from(html))), cipher.final(), cipher.getAuthTag()]);
const check = createDecipheriv('aes-256-gcm', key, iv);
check.setAuthTag(encrypted.subarray(-16));
const restored = gunzipSync(Buffer.concat([check.update(encrypted.subarray(12, -16)), check.final()]));
if (restored.toString() !== html) throw new Error('Encrypted library round-trip failed');
const result = spawnSync('gh', ['secret', 'set', 'GRIDIRON_LIBRARY_KEY_V6', '--repo', 'streamwalker/astralnaut-studios'], { input: key.toString('base64'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
if (result.status !== 0) throw new Error('Could not save the private deployment key; no payload written');
await mkdir('private-content/gridiron-zero', { recursive: true });
await writeFile('private-content/gridiron-zero/library-v6.enc', encrypted);
const manifest = {
  version: 6, edition: '2026-11-09', format: '12-byte IV + AES-256-GCM(gzip(HTML)) + 16-byte tag',
  keyBinding: 'GRIDIRON_LIBRARY_KEY_V6',
  encryptedSha256: createHash('sha256').update(encrypted).digest('hex'),
  htmlSha256: createHash('sha256').update(html).digest('hex'),
  sourceSha256: createHash('sha256').update(await readFile(process.argv[2])).digest('hex'),
  htmlBytes: Buffer.byteLength(html), encryptedBytes: encrypted.length,
};
await writeFile('private-content/gridiron-zero/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ encryptedBytes: encrypted.length, htmlBytes: manifest.htmlBytes, roundTripVerified: true, deploymentSecretConfigured: true }));
key.fill(0);
