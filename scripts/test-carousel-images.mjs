import assert from 'node:assert/strict';
import { carouselThumbnail } from '../src/lib/carousel-images.ts';

const base = 'https://example.supabase.co';
const original = `${base}/storage/v1/object/public/comic-pages/carousel/Cover%20One.png?v=2&download=1&format=origin&height=2000`;
const thumbnail = carouselThumbnail(original, base);
assert.ok(thumbnail);
const src = new URL(thumbnail.src);
assert.equal(src.pathname, '/storage/v1/render/image/public/comic-pages/carousel/Cover%20One.png');
assert.equal(src.searchParams.get('v'), '2');
assert.equal(src.searchParams.get('resize'), 'contain');
assert.equal(src.searchParams.get('quality'), '80');
for (const key of ['download', 'format', 'height']) assert.equal(src.searchParams.has(key), false);
for (const candidate of thumbnail.srcSet.split(', ')) {
  const [url, descriptor] = candidate.split(' ');
  assert.equal(Number(new URL(url).searchParams.get('width')), Number(descriptor.slice(0, -1)));
  assert.ok(!url.includes('/object/public/'), 'Responsive candidates must never request originals');
}
for (const unsupported of [
  `${base}/storage/v1/object/sign/comic-pages/cover.png?token=private`,
  'https://other.example/storage/v1/object/public/comic-pages/cover.png',
  '/local-cover.png',
  'not a URL',
]) assert.equal(carouselThumbnail(unsupported, base), null);
assert.equal(carouselThumbnail(original, 'invalid config'), null);
console.log('Carousel thumbnails preserve paths/versioning, bound responsive widths, and never rewrite private or external sources.');
