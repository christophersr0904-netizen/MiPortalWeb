const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 Table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width, height, getPixel) {
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // 8-bit depth
  ihdr[9] = 6;  // RGBA color type
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', zlib.deflateSync(rawData, { level: 9 }));
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Point in polygon test
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance to rounded rect (squircle)
function distToRoundRect(x, y, w, h, r) {
  const dx = Math.max(Math.abs(x - w / 2) - (w / 2 - r), 0);
  const dy = Math.max(Math.abs(y - h / 2) - (h / 2 - r), 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function getPmoPixel(x, y, width, height) {
  const pad = width * 0.06;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const cornerR = width * 0.22;

  // Base canvas background: #040711
  let r = 4, g = 7, b = 17, a = 255;

  const localX = x - pad;
  const localY = y - pad;

  if (localX >= 0 && localX <= innerW && localY >= 0 && localY <= innerH) {
    const d = distToRoundRect(localX, localY, innerW, innerH, cornerR);
    if (d <= cornerR) {
      // Inside squircle: subtle gradient #0D1526 -> #040711
      const gradRatio = y / height;
      r = Math.round(13 * (1 - gradRatio) + 4 * gradRatio);
      g = Math.round(21 * (1 - gradRatio) + 7 * gradRatio);
      b = Math.round(38 * (1 - gradRatio) + 17 * gradRatio);

      // Microborder: highlight at top edge
      if (d >= cornerR - 2.5) {
        r = Math.min(255, r + 30);
        g = Math.min(255, g + 45);
        b = Math.min(255, b + 65);
      }
    }
  }

  // Draw Isometric PMO Hexagon / Cube in center
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.30;
  const sqrt3_2 = Math.sqrt(3) / 2;

  // Vertices
  const center = [cx, cy];
  const pTop = [cx, cy - radius];
  const pTopRight = [cx + radius * sqrt3_2, cy - radius * 0.5];
  const pBottomRight = [cx + radius * sqrt3_2, cy + radius * 0.5];
  const pBottom = [cx, cy + radius];
  const pBottomLeft = [cx - radius * sqrt3_2, cy + radius * 0.5];
  const pTopLeft = [cx - radius * sqrt3_2, cy - radius * 0.5];

  // Facet 1: Top Rhombus (#38BDF8 - Sky 400)
  const topRhombus = [center, pTopRight, pTop, pTopLeft];
  // Facet 2: Left Rhombus (#0284C7 - Sky 600)
  const leftRhombus = [center, pTopLeft, pBottomLeft, pBottom];
  // Facet 3: Right Rhombus (#0369A1 - Sky 700)
  const rightRhombus = [center, pBottom, pBottomRight, pTopRight];

  // Inner inset for facets (creating precision micro-grooves)
  const shrinkFacet = (poly, scale) => {
    let avgX = 0, avgY = 0;
    poly.forEach(pt => { avgX += pt[0]; avgY += pt[1]; });
    avgX /= poly.length;
    avgY /= poly.length;
    return poly.map(pt => [
      avgX + (pt[0] - avgX) * scale,
      avgY + (pt[1] - avgY) * scale
    ]);
  };

  const topInset = shrinkFacet(topRhombus, 0.94);
  const leftInset = shrinkFacet(leftRhombus, 0.94);
  const rightInset = shrinkFacet(rightRhombus, 0.94);

  if (pointInPoly(x, y, topInset)) {
    // #38BDF8 (56, 189, 248) with subtle specular shine
    const shine = (1 - (y - (cy - radius)) / radius) * 0.2;
    r = Math.min(255, Math.round(56 + shine * 80));
    g = Math.min(255, Math.round(189 + shine * 50));
    b = Math.min(255, Math.round(248 + shine * 7));
    a = 255;
  } else if (pointInPoly(x, y, leftInset)) {
    // #0284C7 (2, 132, 199)
    r = 2;
    g = 132;
    b = 199;
    a = 255;
  } else if (pointInPoly(x, y, rightInset)) {
    // #0369A1 (3, 105, 161)
    r = 3;
    g = 105;
    b = 161;
    a = 255;
  }

  return [r, g, b, a];
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate icon-192.png
console.log('Generando icon-192.png...');
const icon192Buf = createPng(192, 192, getPmoPixel);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192Buf);
console.log('✓ icon-192.png generado exitosamente (' + icon192Buf.length + ' bytes)');

// 2. Generate icon-512.png
console.log('Generando icon-512.png...');
const icon512Buf = createPng(512, 512, getPmoPixel);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512Buf);
console.log('✓ icon-512.png generado exitosamente (' + icon512Buf.length + ' bytes)');

// 3. Generate favicon.svg (optimized vector)
console.log('Generando favicon.svg...');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="28" fill="#040711" />
  <rect x="2" y="2" width="124" height="124" rx="26" stroke="#1E293B" stroke-width="2" />
  <path d="M64 24L100 45L64 66L28 45Z" fill="#38BDF8" fill-opacity="0.95" />
  <path d="M28 47L64 68V104L28 83Z" fill="#0284C7" />
  <path d="M64 68L100 47V83L64 104Z" fill="#0369A1" />
  <circle cx="64" cy="66" r="3" fill="#E0F2FE" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
console.log('✓ favicon.svg generado exitosamente');
