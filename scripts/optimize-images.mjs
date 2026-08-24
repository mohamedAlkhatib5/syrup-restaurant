import sharp from 'sharp';
import { readdir, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'src/assets/images';
const kb = (n) => (n / 1024).toFixed(0);

const jobs = [
  { in: 'heroimg.jpg',     out: 'heroimg.webp',     w: 1400, q: 78 },
  { in: 'storymain.jpg',   out: 'storymain.webp',   w: 1000, q: 78 },
  { in: 'storysmall.jpg',  out: 'storysmall.webp',  w: 700,  q: 78 },
  { in: 'storysection.jpg',out: 'storysection.webp',w: 1100, q: 78 },
  { in: 'cta-section.jpg', out: 'cta-section.webp', w: 1800, q: 72 },
  { in: 'logo.png',        out: 'logo.webp',        w: 320,  q: 88, alpha: true },
];

let before = 0, after = 0;
const dims = {};

for (const j of jobs) {
  const src = path.join(SRC, j.in);
  const dst = path.join(SRC, j.out);
  const meta = await sharp(src).metadata();
  const sBefore = (await stat(src)).size;

  await sharp(src)
    .resize({ width: Math.min(j.w, meta.width), withoutEnlargement: true })
    .webp({ quality: j.q, effort: 6, alphaQuality: j.alpha ? 100 : undefined })
    .toFile(dst);

  const m2 = await sharp(dst).metadata();
  const sAfter = (await stat(dst)).size;
  before += sBefore; after += sAfter;
  dims[j.out] = { w: m2.width, h: m2.height };
  console.log(
    `  ${j.in.padEnd(20)} ${String(kb(sBefore)).padStart(5)} KB  ->  ${j.out.padEnd(21)} ${String(kb(sAfter)).padStart(5)} KB  (${m2.width}x${m2.height})  -${(100 - (sAfter / sBefore) * 100).toFixed(0)}%`
  );
}

// أصول public
await mkdir('public', { recursive: true });
await sharp(path.join(SRC, 'logo.png')).resize(64, 64, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } }).png({ compressionLevel: 9 }).toFile('public/favicon.png');
await sharp(path.join(SRC, 'heroimg.jpg')).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile('public/og-image.jpg');
console.log(`\n  favicon.png  ${kb((await stat('public/favicon.png')).size)} KB (64x64)`);
console.log(`  og-image.jpg ${kb((await stat('public/og-image.jpg')).size)} KB (1200x630)`);
console.log(`\n  الإجمالي: ${kb(before)} KB  ->  ${kb(after)} KB   (توفير ${(100 - (after/before)*100).toFixed(0)}%)`);
console.log('\nDIMS=' + JSON.stringify(dims));
