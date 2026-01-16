import { describe, it, expect } from "vitest";
import { makeBmp8bitIndexed } from "../../src/bmp/writer";

describe("makeBmp8bitIndexed", () => {
  it("writes a BMP header with correct signature and dimensions", async () => {
    const width = 24;
    const height = 12;

    const palette = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      palette[i * 3 + 0] = i;
      palette[i * 3 + 1] = i;
      palette[i * 3 + 2] = i;
    }

    const indices = new Uint8Array(width * height);
    indices.fill(7);

    const blob = makeBmp8bitIndexed(width, height, palette, indices);
    const buf = await blob.arrayBuffer();
    const u8 = new Uint8Array(buf);

    // Signature
    expect(String.fromCharCode(u8[0], u8[1])).toBe("BM");

    // DIB header starts at 14
    const dv = new DataView(buf);
    const dibSize = dv.getUint32(14, true);
    expect(dibSize).toBe(40);

    const w = dv.getInt32(18, true);
    const h = dv.getInt32(22, true);
    expect(w).toBe(width);
    expect(h).toBe(height);
  });
});
