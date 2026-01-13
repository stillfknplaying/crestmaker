export function makeBmp8bitIndexed(
  width: number,
  height: number,
  paletteRGB: Uint8Array,
  indices: Uint8Array
): Blob {
  const rowSize = Math.ceil(width / 4) * 4;
  const pixelArraySize = rowSize * height;

  const fileHeaderSize = 14;
  const dibHeaderSize = 40;
  const paletteSize = 256 * 4;
  const pixelDataOffset = fileHeaderSize + dibHeaderSize + paletteSize;
  const fileSize = pixelDataOffset + pixelArraySize;

  const buf = new ArrayBuffer(fileSize);
  const dv = new DataView(buf);
  let p = 0;

  dv.setUint8(p++, 0x42);
  dv.setUint8(p++, 0x4D);
  dv.setUint32(p, fileSize, true); p += 4;
  dv.setUint16(p, 0, true); p += 2;
  dv.setUint16(p, 0, true); p += 2;
  dv.setUint32(p, pixelDataOffset, true); p += 4;

  dv.setUint32(p, dibHeaderSize, true); p += 4;
  dv.setInt32(p, width, true); p += 4;
  dv.setInt32(p, height, true); p += 4;
  dv.setUint16(p, 1, true); p += 2;
  dv.setUint16(p, 8, true); p += 2;
  dv.setUint32(p, 0, true); p += 4;
  dv.setUint32(p, pixelArraySize, true); p += 4;
  dv.setInt32(p, 2835, true); p += 4;
  dv.setInt32(p, 2835, true); p += 4;
  dv.setUint32(p, 256, true); p += 4;
  dv.setUint32(p, 256, true); p += 4;

  for (let i = 0; i < 256; i++) {
    const r = paletteRGB[i * 3 + 0];
    const g = paletteRGB[i * 3 + 1];
    const b = paletteRGB[i * 3 + 2];
    dv.setUint8(p++, b);
    dv.setUint8(p++, g);
    dv.setUint8(p++, r);
    dv.setUint8(p++, 0);
  }

  const u8 = new Uint8Array(buf);
  let pixOffset = pixelDataOffset;

  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width;
    for (let x = 0; x < width; x++) u8[pixOffset + x] = indices[rowStart + x];
    for (let x = width; x < rowSize; x++) u8[pixOffset + x] = 0;
    pixOffset += rowSize;
  }

  return new Blob([u8], { type: "image/bmp" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function downloadBMPs(ally8: Uint8Array, clan16: Uint8Array, combined24: Uint8Array, palette: Uint8Array) {
  const h = 12;

  const allyBmp = makeBmp8bitIndexed(8, h, palette, ally8);
  const clanBmp = makeBmp8bitIndexed(16, h, palette, clan16);
  const combinedBmp = makeBmp8bitIndexed(24, h, palette, combined24);

  downloadBlob(allyBmp, "ally_8x12_256.bmp");
  downloadBlob(clanBmp, "clan_16x12_256.bmp");
  downloadBlob(combinedBmp, "crest_24x12_256.bmp");
}