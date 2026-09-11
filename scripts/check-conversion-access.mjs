import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(path) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', source)(module.exports, module);
  return module.exports;
}
const { publicPreviewPage } = load('src/lib/public-preview.ts');
const { safeReaderReturn } = load('src/lib/reader-return.ts');
const now = Date.parse('2026-09-11T00:00:00Z');
const page = { is_free: true, published_at: '2026-09-01T00:00:00Z', image_path: 'test/art.jpg' };
assert.equal(publicPreviewPage(page, now).image_path, page.image_path);
for (const change of [{ is_free: false }, { published_at: null }, { published_at: '2027-01-01' }, { published_at: 'invalid' }]) {
  assert.equal(publicPreviewPage({ ...page, ...change }, now).image_path, '');
}
assert.equal(safeReaderReturn('/reader/battlefield-atlantis/1?page=11'), '/reader/battlefield-atlantis/1?page=11');
for (const path of ['https://evil.example', '//evil.example', '/\\evil.example', '/reader/../admin', '/admin', '/reader/a/1?next=https://evil.example', '/reader/a/1#x']) {
  assert.equal(safeReaderReturn(path), undefined);
}
console.log('PASS: published anonymous previews, paid/draft/future path protection, and constrained checkout return URLs.');
