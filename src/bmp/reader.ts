export type ParsedBmp8 = {
  width: number;
  height: number;
  paletteRGB: Uint8Array; // 256*3, RGB order
  indices: Uint8Array;   // top-down, row-major
};

function u32(dv: DataView, off: number) { return dv.getUint32(off, true); }
function i32(dv: DataView, off: number) { return dv.getInt32(off, true); }
function u16(dv: DataView, off: number) { return dv.getUint16(off, true); }

export function parseBmp8bitIndexed(buf: ArrayBuffer): ParsedBmp8 {
  const dv = new DataView(buf);
  if (dv.byteLength < 54) throw new Error("BMP too small");

  const b0 = dv.getUint8(0);
  const b1 = dv.getUint8(1);
  if (b0 !== 0x42 || b1 !== 0x4d) throw new Error("Not a BMP");

  const pixelOffset = u32(dv, 10);
  const dibSize = u32(dv, 14);
  if (dibSize < 40) throw new Error("Unsupported DIB header");

  const width = i32(dv, 18);
  const heightRaw = i32(dv, 22);
  const planes = u16(dv, 26);
  const bpp = u16(dv, 28);
  const compression = u32(dv, 30);
  const colorsUsed = u32(dv, 46);

  if (planes !== 1) throw new Error("Invalid BMP planes");
  if (bpp !== 8) throw new Error("Only 8-bit indexed BMP is supported");
  if (compression !== 0) throw new Error("Compressed BMP not supported");
  if (width <= 0) throw new Error("Invalid BMP width");

  const height = Math.abs(heightRaw);
  if (height <= 0) throw new Error("Invalid BMP height");

  const paletteCount = colorsUsed === 0 ? 256 : Math.min(colorsUsed, 256);
  const paletteOffset = 14 + dibSize;
  const paletteRGB = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const p = paletteOffset + i * 4;
    const b = dv.getUint8(p + 0);
    const g = dv.getUint8(p + 1);
    const r = dv.getUint8(p + 2);
    const t = i * 3;
    paletteRGB[t + 0] = r;
    paletteRGB[t + 1] = g;
    paletteRGB[t + 2] = b;
  }

  // If paletteCount < 256, the remaining slots are zeros - still valid for our use.
  if (paletteCount < 256) {
    // nothing
  }

  const rowSize = Math.ceil(width / 4) * 4; // 4-byte aligned
  const u8 = new Uint8Array(buf);
  const indices = new Uint8Array(width * height);

  const isBottomUp = heightRaw > 0;
  for (let y = 0; y < height; y++) {
    const srcRow = isBottomUp ? (height - 1 - y) : y;
    const srcOff = pixelOffset + srcRow * rowSize;
    const dstOff = y * width;
    indices.set(u8.subarray(srcOff, srcOff + width), dstOff);
  }

  return { width, height, paletteRGB, indices };
}
