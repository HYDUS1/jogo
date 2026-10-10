const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate sleek, high-contrast, deadly JASHPI Shield & Pulse icon
function drawJashpiIcon(isMaskable) {
  return (x, y, width, height) => {
    const nx = (x / width) * 2 - 1; // -1 to 1
    const ny = (y / height) * 2 - 1; // -1 to 1
    const dist = Math.sqrt(nx * nx + ny * ny);

    // Deep modern dark background with subtle radial gradient
    let bgR = 10, bgG = 12, bgB = 22, bgA = 255;
    if (dist < 1.0) {
      const grad = 1 - dist;
      bgR = Math.min(255, Math.floor(10 + grad * 25));
      bgG = Math.min(255, Math.floor(12 + grad * 15));
      bgB = Math.min(255, Math.floor(24 + grad * 40));
    }

    // Safe zone scale for maskable icons
    const scale = isMaskable ? 0.72 : 0.85;
    const sx = nx / scale;
    const sy = ny / scale;

    // Shield Shape formula:
    // Top is flat with slight curve, sides go down, bottom curves into sharp tip
    const inTop = sy >= -0.75 && sy <= -0.15 && Math.abs(sx) <= 0.65;
    const inMid = sy > -0.15 && sy <= 0.25 && Math.abs(sx) <= (0.65 - (sy + 0.15) * 0.2);
    const inBottom = sy > 0.25 && sy <= 0.82 && Math.abs(sx) <= (0.57 * (0.82 - sy) / 0.57);

    const inShield = inTop || inMid || inBottom;

    if (!inShield) {
      // Glow outside shield
      const distShield = Math.sqrt(sx * sx + (sy - 0.05) * (sy - 0.05));
      if (distShield < 1.15 && !isMaskable) {
        const glow = (1.15 - distShield) / 0.3;
        const glowR = Math.floor(255 * glow * 0.3);
        const glowG = Math.floor(30 * glow * 0.1);
        const glowB = Math.floor(60 * glow * 0.2);
        return [Math.min(255, bgR + glowR), Math.min(255, bgG + glowG), Math.min(255, bgB + glowB), 255];
      }
      return [bgR, bgG, bgB, 255];
    }

    // Inside Shield:
    // Calculate border vs inner fill
    const margin = 0.08;
    const isInnerTop = sy >= (-0.75 + margin) && sy <= -0.15 && Math.abs(sx) <= (0.65 - margin);
    const isInnerMid = sy > -0.15 && sy <= 0.25 && Math.abs(sx) <= ((0.65 - margin) - (sy + 0.15) * 0.2);
    const isInnerBottom = sy > 0.25 && sy <= (0.82 - margin) && Math.abs(sx) <= (0.57 * ((0.82 - margin) - sy) / 0.57);
    const inInner = isInnerTop || isInnerMid || isInnerBottom;

    if (!inInner) {
      // Metallic red & cyan border
      const t = (sy + 0.75) / 1.57;
      const borderR = Math.floor(255 - t * 40);
      const borderG = Math.floor(24 + (1 - Math.abs(t - 0.5) * 2) * 50);
      const borderB = Math.floor(60 + (1 - t) * 80);
      return [borderR, borderG, borderB, 255];
    }

    // Inside Shield Body:
    // Dark carbon mesh with crimson glow
    const innerGrad = (sy + 0.75) / 1.5;
    let r = Math.floor(22 + innerGrad * 40);
    let g = Math.floor(10 + innerGrad * 10);
    let b = Math.floor(26 + innerGrad * 15);

    // Cross / Heartbeat Lightning Pulse Line:
    // Center cross element or lightning bolt
    // Vertical cross beam:
    const inVBeam = Math.abs(sx) <= 0.12 && sy >= -0.55 && sy <= 0.35;
    // Horizontal cross beam:
    const inHBeam = Math.abs(sy + 0.1) <= 0.12 && Math.abs(sx) <= 0.42;

    if (inVBeam || inHBeam) {
      // Intense Ruby Red with white-hot core
      const coreDist = inVBeam ? Math.abs(sx) : Math.abs(sy + 0.1);
      if (coreDist <= 0.04) {
        // Hot white core
        return [255, 245, 245, 255];
      } else {
        // Glowing red
        return [239, 35, 60, 255];
      }
    }

    // ECG Heartbeat line across center
    // sy = -0.1 + f(sx)
    const px = sx * 3.5;
    let ecgY = -0.1;
    if (px >= -1.0 && px <= -0.6) {
      ecgY = -0.1 + (px + 0.8) * 0.2;
    } else if (px > -0.6 && px <= -0.3) {
      ecgY = -0.1 - (px + 0.45) * 0.5;
    } else if (px > -0.3 && px <= 0.0) {
      ecgY = -0.1 + (px + 0.15) * 1.2; // sharp peak
    } else if (px > 0.0 && px <= 0.3) {
      ecgY = -0.1 - (0.15 - px) * 1.5; // sharp dip
    } else if (px > 0.3 && px <= 0.8) {
      ecgY = -0.1 + (px - 0.55) * 0.3;
    }

    if (Math.abs(sy - ecgY) <= 0.035 && Math.abs(sx) <= 0.5) {
      return [0, 243, 255, 255]; // Cyan pulse
    }

    return [r, g, b, 255];
  };
}

const pubDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

console.log('Generating PNG icons for PWA compliance...');

// 1. 192x192
const p192 = createPng(192, 192, drawJashpiIcon(false));
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), p192);
console.log('Created public/pwa-192x192.png');

// 2. 512x512
const p512 = createPng(512, 512, drawJashpiIcon(false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), p512);
console.log('Created public/pwa-512x512.png');

// 3. Maskable 512x512
const pMask = createPng(512, 512, drawJashpiIcon(true));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), pMask);
console.log('Created public/pwa-maskable-512x512.png');

// 4. Apple Touch Icon (180x180)
const pApple = createPng(180, 180, drawJashpiIcon(false));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), pApple);
console.log('Created public/apple-touch-icon.png');

// 5. Favicon PNG (64x64)
const pFavicon = createPng(64, 64, drawJashpiIcon(false));
fs.writeFileSync(path.join(pubDir, 'favicon.png'), pFavicon);
console.log('Created public/favicon.png');

console.log('All PWA PNG icons generated successfully!');
