// Regression guard: a valid build can still eagerly import browser-only 3D code in the Worker.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port = 8791;
const worker = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', '.output/server/wrangler.json', '--local', '--ip', '127.0.0.1', '--port', String(port)], {stdio:'ignore'});
let exited = false;
worker.on('exit', () => { exited = true; });
try {
  let response;
  for (let i=0; i<90; i++) {
    assert(!exited, 'Local Worker exited before rendering the homepage');
    try { response = await fetch(`http://127.0.0.1:${port}/`, {signal:AbortSignal.timeout(3000)}); break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert(response, 'Local Worker did not become reachable');
  assert.equal(response.status, 200, 'Compiled homepage must render successfully in the Worker runtime');
  const html = await response.text();
  assert(html.includes('id="main-content"'), 'Server response must contain the main content');
  assert(!html.includes('This page didn\'t load'), 'Server response must not be the branded error page');
  console.log('Compiled Worker homepage: HTTP 200 and server-rendered main content');
} finally { worker.kill('SIGTERM'); }
