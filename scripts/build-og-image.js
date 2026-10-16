/**
 * build-og-image.js — renders the placeholder share card img/og-default.png (1200x630).
 * Purpose: default link-preview image until the real logo replaces it at the same path.
 * Uses sharp (already in node_modules) to rasterise an SVG on the site's green glass gradient.
 *   node scripts/build-og-image.js
 */
const path = require('path');
const sharp = require('sharp');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f5fbf8"/><stop offset="1" stop-color="#e8f6f0"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="160" cy="80" r="280" fill="#fff" fill-opacity=".45"/>
  <circle cx="1070" cy="610" r="250" fill="#c2e8d8" fill-opacity=".5"/>
  <rect x="100" y="170" width="1000" height="290" rx="28" fill="#fff" fill-opacity=".4" stroke="#fff" stroke-opacity=".8" stroke-width="3"/>
  <text x="600" y="340" text-anchor="middle" font-family="Space Grotesk, Segoe UI, Arial, sans-serif" font-weight="700" font-size="84" fill="#174431">Barnaskóli Kársness</text>
</svg>`;

sharp(Buffer.from(svg))
  .png({ palette: true, compressionLevel: 9 })
  .toFile(path.join(__dirname, '..', 'img', 'og-default.png'))
  .then((i) => console.log(`og-default.png ${i.width}x${i.height} ${i.size} bytes`));
