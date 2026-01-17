/**
 * Unified post-process layer.
 *
 * This module sits "above" both converters (Modern/Pixel).
 */

import { makeBmp8bitIndexed } from "../bmp/writer";

/**
 * Apply brightness/contrast in-place on an RGBA buffer.
 */
export function applyBrightnessContrast(
  rgba: Uint8ClampedArray,
  brightness: number,
  contrast: number,
  clamp255: (n: number) => number
): void {
  if (brightness === 0 && contrast === 0) return;

  const c = contrast;
  const k = (259 * (c + 255)) / (255 * (259 - c));

  for (let i = 0; i < rgba.length; i += 4) {
    let rr = rgba[i] + brightness;
    let gg = rgba[i + 1] + brightness;
    let bb = rgba[i + 2] + brightness;

    rr = clamp255((rr - 128) * k + 128);
    gg = clamp255((gg - 128) * k + 128);
    bb = clamp255((bb - 128) * k + 128);

    rgba[i] = rr;
    rgba[i + 1] = gg;
    rgba[i + 2] = bb;
  }
}

/**
 * Apply editor result "on top" of a base index buffer.
 *
 * Today the editor mutates indices directly, so this is a no-op unless an
 * explicit edited buffer is provided.
 */
export function applyEditor(base: Uint8Array, edited: Uint8Array | null): Uint8Array {
  return edited ? edited : base;
}

/**
 * Export to an 8-bit indexed BMP blob.
 */
export function exportBmp(
  w: number,
  h: number,
  palette256: Uint8Array,
  indices: Uint8Array
): Blob {
  return makeBmp8bitIndexed(w, h, palette256, indices);
}
