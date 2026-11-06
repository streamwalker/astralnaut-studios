// Run after Nitro. Keep the document encrypted in both the public repo and CI artifacts.
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { loadEnv } from 'vite';
const configPath = '.output/server/wrangler.json';
const config = JSON.parse(await readFile(configPath, 'utf8'));
if (!config.assets?.binding || config.assets.binding !== 'ASSETS') throw new Error('Expected ASSETS binding');
const source = 'private-content/gridiron-zero/library-v1.enc';
const manifest = JSON.parse(await readFile('private-content/gridiron-zero/manifest.json', 'utf8'));
const { createHash } = await import('node:crypto');
const encrypted = await readFile(source);
if (createHash('sha256').update(encrypted).digest('hex') !== manifest.encryptedSha256) throw new Error('Encrypted library checksum mismatch');
if (encrypted.length > 25 * 1024 * 1024) throw new Error('Library exceeds asset size limit');
await mkdir('.output/public/assets/gridiron-zero', { recursive: true });
await copyFile(source, '.output/public/assets/gridiron-zero/library-v1.enc');
await copyFile('server/gridiron-zero/gate.mjs', '.output/server/gridiron-gate.mjs');
const buildEnv = loadEnv('production', process.cwd(), 'VITE_');
const publicConfig = { url: buildEnv.VITE_SUPABASE_URL, key: buildEnv.VITE_SUPABASE_PUBLISHABLE_KEY };
if (!publicConfig.url || !publicConfig.key) throw new Error('Missing public Supabase configuration');
const originalMain = config.main === 'gridiron-entry.mjs' ? 'index.mjs' : config.main;
await writeFile('.output/server/gridiron-entry.mjs', `import app from './${originalMain}';\nimport { LIBRARY_ENDPOINT, serveLibrary } from './gridiron-gate.mjs';\nconst publicConfig = ${JSON.stringify(publicConfig)};\nexport default { ...app, fetch(request, env, ctx) {\n  if (new URL(request.url).pathname.replace(/\\/$/, '') === LIBRARY_ENDPOINT) return serveLibrary(request, env, publicConfig);\n  return app.fetch(request, env, ctx);\n}};\n`);
config.main = 'gridiron-entry.mjs';
// Always execute the API gate even if a future build introduces a colliding asset.
const previous = config.assets.run_worker_first;
config.assets.run_worker_first = previous === true ? true : [...new Set([...(Array.isArray(previous) ? previous : []), '/api/admin/gridiron-zero/*'])];
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
console.log(`Packaged encrypted Gridiron Zero library (${encrypted.length} bytes); admin API gate enabled.`);
