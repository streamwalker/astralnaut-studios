import { spawnSync } from 'node:child_process';
const key = process.env.GRIDIRON_LIBRARY_KEY_V1;
if (!key || Buffer.from(key, 'base64').length !== 32) throw new Error('Private library deployment key is missing');
const result = spawnSync('node', ['node_modules/wrangler/bin/wrangler.js', 'secret', 'put', 'GRIDIRON_LIBRARY_KEY_V1', '--config', '.output/server/wrangler.json'], { input: key + '\n', encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
if (result.status !== 0) throw new Error('Private library key provisioning failed; deployment stopped');
console.log('Private library runtime key configured.');
