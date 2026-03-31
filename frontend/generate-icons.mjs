/**
 * generate-icons.mjs — 一鍵生成 SplitQuest PWA 像素風格圖示
 *
 * 使用方式:
 *   node generate-icons.mjs
 */

import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "public", "icons");
mkdirSync(OUTPUT, { recursive: true });

// 像素風格金幣圖示 (64x64 base, scaled up)
function createPixelArt(size) {
  const scale = size / 64;
  const pixels = [];

  // Colors
  const bg = { r: 10, g: 14, b: 26 };       // #0a0e1a
  const gold = { r: 251, g: 191, b: 36 };   // #fbbf24
  const darkGold = { r: 217, g: 119, b: 6 }; // #d97706

  // Create base 64x64 grid
  const grid = Array(64).fill(null).map(() => Array(64).fill(bg));

  function fillRect(x, y, w, h, color) {
    for (let ry = y; ry < y + h && ry < 64; ry++) {
      for (let rx = x; rx < x + w && rx < 64; rx++) {
        if (rx >= 0 && ry >= 0) grid[ry][rx] = color;
      }
    }
  }

  // Coin shape
  fillRect(16, 8, 32, 4, gold);
  fillRect(12, 12, 40, 4, gold);
  fillRect(8, 16, 48, 32, gold);
  fillRect(12, 48, 40, 4, gold);
  fillRect(16, 52, 32, 4, gold);

  // Coin inner
  fillRect(12, 20, 40, 24, darkGold);

  // Pixel "S" letter
  fillRect(20, 24, 20, 4, gold);
  fillRect(20, 28, 4, 4, gold);
  fillRect(20, 32, 20, 4, gold);
  fillRect(36, 36, 4, 4, gold);
  fillRect(20, 40, 20, 4, gold);

  // Convert to raw pixels (scaled)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcY = Math.floor(y / scale);
      const srcX = Math.floor(x / scale);
      const c = grid[srcY]?.[srcX] || bg;
      pixels.push(c.r, c.g, c.b);
    }
  }

  return Buffer.from(pixels);
}

// Generate icons
for (const size of [96, 192, 512]) {
  const raw = createPixelArt(size);
  const outputPath = join(OUTPUT, `pwa-${size}.png`);

  await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
    .png()
    .toFile(outputPath);

  console.log(`✓ ${outputPath}`);
}

// Also create favicon.ico (32x32)
const favicon32 = createPixelArt(32);
await sharp(favicon32, { raw: { width: 32, height: 32, channels: 3 } })
  .png()
  .toFile(join(OUTPUT, "..", "favicon.png"));

console.log(`✓ ${join(OUTPUT, "..", "favicon.png")}`);
console.log("\n🎮 SplitQuest PWA icons generated!");
