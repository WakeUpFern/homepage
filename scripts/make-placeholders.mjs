// Genera imágenes placeholder con sharp. Los slugs y ratios salen de src/data/projects.json,
// así que para reemplazar por fotos reales basta con sobrescribir los archivos con el mismo nombre.
// Uso: npm run placeholders
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'assets');
const projects = JSON.parse(await readFile(join(ROOT, 'src/data/projects.json'), 'utf8'));

const hue = (i, n) => Math.round((i / n) * 360);

const gradientSvg = (w, h, h1, h2, label, fontSize) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h1} 55% 62%)"/>
      <stop offset="1" stop-color="hsl(${h2} 60% 34%)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="800" font-size="${fontSize}"
        letter-spacing="-4" fill="#fff" fill-opacity="0.9">${label}</text>
</svg>`;

const noise = (w, h) =>
  sharp({ create: { width: w, height: h, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 10 } } })
    .png()
    .toBuffer();

async function gradientImage(file, w, h, h1, h2, label, fontSize = Math.round(Math.min(w, h) * 0.1)) {
  await mkdir(dirname(file), { recursive: true });
  await sharp(Buffer.from(gradientSvg(w, h, h1, h2, label, fontSize)))
    .composite([{ input: await noise(w, h), blend: 'soft-light' }])
    .webp({ quality: 60 })
    .toFile(file);
}

// Formas tipo sticker (círculo, blob, estrella, cuadrado redondeado) con borde blanco y número.
const stickerShape = (i) => {
  const shapes = [
    '<circle cx="240" cy="320" r="190"/>',
    '<rect x="70" y="120" width="340" height="400" rx="70"/>',
    '<path d="M240 80 L300 250 L440 260 L330 360 L370 520 L240 430 L110 520 L150 360 L40 260 L180 250Z"/>',
    '<path d="M240 90 C380 90 430 220 400 340 C370 470 280 540 200 520 C90 490 50 380 70 270 C90 160 140 90 240 90Z"/>'
  ];
  return shapes[i % shapes.length];
};

async function trail(i, n) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640">
  <g fill="hsl(${hue(i, n)} 70% 58%)" stroke="#fff" stroke-width="14" stroke-linejoin="round">${stickerShape(i)}</g>
  <text x="240" y="320" text-anchor="middle" dominant-baseline="central"
        font-family="sans-serif" font-weight="800" font-size="150" fill="#fff">${String(i + 1).padStart(2, '0')}</text>
</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 85, alphaQuality: 100 }).toFile(join(OUT, 'trail', `trail-${String(i + 1).padStart(2, '0')}.webp`));
}

const coverSize = (ratio) => {
  const h = ratio <= 1 ? 1200 : 960;
  return [Math.round(h * ratio), h];
};

await mkdir(join(OUT, 'trail'), { recursive: true });

// Hero: 3 imágenes 1600x2000
for (let i = 0; i < 3; i++) {
  await gradientImage(join(OUT, 'hero', `hero-${i + 1}.webp`), 1600, 2000, hue(i, 3) + 20, hue(i, 3) + 80, `HERO ${i + 1}`, 220);
}

// Trail: 12 recortes con transparencia 480x640
for (let i = 0; i < 12; i++) await trail(i, 12);

// Proyectos: cover + 6 imágenes de galería
for (const [pi, p] of projects.entries()) {
  const dir = join(OUT, 'projects', p.slug);
  const [cw, ch] = coverSize(p.coverRatio);
  const h1 = hue(pi, projects.length);
  await gradientImage(join(dir, 'cover.webp'), cw, ch, h1, h1 + 50, p.title);
  for (let g = 1; g <= 6; g++) {
    const landscape = g === 1 || g === 4;
    const [w, h] = landscape ? [1600, 1000] : [1000, 1250];
    await gradientImage(join(dir, `0${g}.webp`), w, h, h1 + g * 18, h1 + 60 + g * 18, `${p.title} · ${g}`);
  }
}

console.log(`placeholders listos en ${OUT}`);
