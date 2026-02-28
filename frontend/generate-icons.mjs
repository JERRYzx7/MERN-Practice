/**
 * generate-icons.mjs — 一鍵生成 SplitQuest PWA 像素風格圖示
 *
 * 使用方式:
 *   node generate-icons.mjs
 *
 * 不需要額外安裝套件（純 Node.js，使用 Buffer 直接寫入 PNG）
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Minimal PNG encoder (pure JS, no dependencies) ──────────

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function adler32(buf) {
  let s1 = 1, s2 = 0;
  for (const b of buf) { s1 = (s1 + b) % 65521; s2 = (s2 + s1) % 65521; }
  return (s2 << 16) | s1;
}

function deflate(data) {
  // Store method (no compression) for simplicity
  const blocks = [];
  const BLOCK_SIZE = 32768;
  for (let i = 0; i < data.length; i += BLOCK_SIZE) {
    const block = data.slice(i, i + BLOCK_SIZE);
    const last = i + BLOCK_SIZE >= data.length ? 1 : 0;
    const header = Buffer.from([last, block.length & 0xff, (block.length >> 8) & 0xff,
      (~block.length) & 0xff, ((~block.length) >> 8) & 0xff]);
    blocks.push(Buffer.concat([header, block]));
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(adler32(data));
  return Buffer.concat([Buffer.from([0x78, 0x01]), ...blocks, adler]);
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA values, row by row
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB (no alpha for smaller file)
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw image data with filter bytes
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter type None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      raw.push(pixels[i], pixels[i + 1], pixels[i + 2]);
    }
  }
  const rawBuf = Buffer.from(raw);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflate(rawBuf)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Pixel art icon drawing ───────────────────────────────────

function hexToRgba(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 255];
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const s = size / 64;

  function fillRect(x, y, w, h, color) {
    const [r, g, b, a] = typeof color === "string" ? hexToRgba(color) : color;
    for (let ry = Math.round(y * s); ry < Math.round((y + h) * s); ry++) {
      for (let rx = Math.round(x * s); rx < Math.round((x + w) * s); rx++) {
        if (rx >= 0 && rx < size && ry >= 0 && ry < size) {
          const i = (ry * size + rx) * 4;
          pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a;
        }
      }
    }
  }

  // Background
  fillRect(0, 0, 64, 64, "#0a0e1a");

  // Coin shape
  fillRect(16, 8, 32, 4, "#fbbf24");
  fillRect(12, 12, 40, 4, "#fbbf24");
  fillRect(8, 16, 48, 32, "#fbbf24");
  fillRect(12, 48, 40, 4, "#fbbf24");
  fillRect(16, 52, 32, 4, "#fbbf24");

  // Coin inner (darker gold)
  fillRect(12, 20, 40, 24, "#d97706");

  // Pixel "S" letter
  fillRect(20, 24, 20, 4, "#fbbf24");
  fillRect(20, 28, 4, 4, "#fbbf24");
  fillRect(20, 32, 20, 4, "#fbbf24");
  fillRect(36, 36, 4, 4, "#fbbf24");
  fillRect(20, 40, 20, 4, "#fbbf24");

  return encodePNG(size, size, pixels);
}

// ── Generate icons ───────────────────────────────────────────

const OUTPUT = join(__dirname, "public", "icons");
mkdirSync(OUTPUT, { recursive: true });

for (const size of [96, 192, 512]) {
  const png = drawIcon(size);
  const out = join(OUTPUT, `pwa-${size}.png`);
  writeFileSync(out, png);
  console.log(`✓ ${out} (${png.length} bytes)`);
}

console.log("\n🎮 SplitQuest PWA icons generated!");
