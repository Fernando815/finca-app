#!/usr/bin/env node
// Generates solid-color PNG icons for the FincaApp PWA manifest.
// No external dependencies — uses only Node.js built-ins (zlib + fs).

const fs   = require("fs");
const path = require("path");
const zlib = require("zlib");

// CRC-32 table (used by PNG)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function mkChunk(type, data) {
  const len  = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const t    = Buffer.from(type, "ascii");
  const crcB = Buffer.allocUnsafe(4); crcB.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcB]);
}

function solidPNG(size, r, g, b) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rowLen = 1 + size * 3;
  const raw    = Buffer.allocUnsafe(size * rowLen);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const i = y * rowLen + 1 + x * 3;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([sig, mkChunk("IHDR", ihdr), mkChunk("IDAT", compressed), mkChunk("IEND", Buffer.alloc(0))]);
}

const SIZES  = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

// FincaApp brand green: #16a34a = rgb(22, 163, 74)
for (const size of SIZES) {
  const buf = solidPNG(size, 22, 163, 74);
  fs.writeFileSync(path.join(outDir, `icon-${size}x${size}.png`), buf);
  console.log(`✓ icon-${size}x${size}.png  (${buf.length} bytes)`);
}
console.log("\nIconos PWA generados en public/icons/ ✅");
