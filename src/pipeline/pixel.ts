import { edgeAwareSharpen, quantizeTo256 } from "./modern";
export type PixelPreset = "pixel-clean" | "pixel-crisp" | "pixel-stable" | "pixel-indexed";
function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x; }
function clamp255(x: number): number { return x < 0 ? 0 : x > 255 ? 255 : x; }
const BAYER8: number[] = [
  0, 48, 12, 60, 3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
  8, 56, 4, 52, 11, 59, 7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
  2, 50, 14, 62, 1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58, 6, 54, 9, 57, 5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
];



export function buildWinHalftone256Palette(): Uint8Array {
  const levels = [0, 51, 102, 153, 204, 255];
  const colors: number[] = [];

  // 216-color 6x6x6 cube
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) colors.push(levels[r], levels[g], levels[b]);
    }
  }

  // Avoid duplicates with cube-grays
  const cubeGraySet = new Set<number>();
  for (let i = 0; i < colors.length; i += 3) {
    const rr = colors[i], gg = colors[i + 1], bb = colors[i + 2];
    if (rr === gg && gg === bb) cubeGraySet.add(rr);
  }

  // Add grayscale ramp (non-duplicate)
  const grayCount = 40;
  for (let k = 0; k < grayCount; k++) {
    const v = Math.round((k * 255) / (grayCount - 1));
    if (!cubeGraySet.has(v)) colors.push(v, v, v);
  }

  // Pad/truncate to exactly 256
  const total = Math.floor(colors.length / 3);
  if (total < 256) {
    const pad = (256 - total) * 3;
    for (let i = 0; i < pad; i++) colors.push(0);
  } else if (total > 256) {
    colors.length = 256 * 3;
  }

  return Uint8Array.from(colors);
}

export function nearestPaletteIndexRGB(
  r: number, g: number, b: number,
  palR: Uint8Array, palG: Uint8Array, palB: Uint8Array
): number {
  let best = 0;
  let bestD = 1e9;
  for (let i = 0; i < 256; i++) {
    const dr = r - palR[i];
    const dg = g - palG[i];
    const db = b - palB[i];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = i;
      if (d === 0) break;
    }
  }
  return best;
}

export function quantizeOrderedDither256(
  img: ImageData,
  palette: Uint8Array,
  strength01: number,
  edgeFriendlyBias: boolean
): Uint8Array {
  const { width: w, height: h, data } = img;

  const palR = new Uint8Array(256);
  const palG = new Uint8Array(256);
  const palB = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    palR[i] = palette[i * 3 + 0];
    palG[i] = palette[i * 3 + 1];
    palB[i] = palette[i * 3 + 2];
  }

  const out = new Uint8Array(w * h);
  const amp = 24 * clamp01(strength01);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = data[i + 0];
      let g = data[i + 1];
      let b = data[i + 2];
      const a = data[i + 3];

      // Transparent -> black (typical crest behavior)
      if (a < 16) {
        out[y * w + x] = nearestPaletteIndexRGB(0, 0, 0, palR, palG, palB);
        continue;
      }

      const t = BAYER8[(y & 7) * 8 + (x & 7)]; // 0..63
      const d = ((t / 63) - 0.5) * 2;          // -1..+1

      if (edgeFriendlyBias) {
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = clamp255(r + d * amp);
        g = clamp255(g + d * amp);
        b = clamp255(b + d * amp);
        const l2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const dl = l - l2;
        r = clamp255(r + dl * 0.25);
        g = clamp255(g + dl * 0.25);
        b = clamp255(b + dl * 0.25);
      } else {
        r = clamp255(r + d * amp);
        g = clamp255(g + d * amp);
        b = clamp255(b + d * amp);
      }

      out[y * w + x] = nearestPaletteIndexRGB(r, g, b, palR, palG, palB);
    }
  }

  return out;
}

export function cleanupIndicesMajoritySafe(
  indices: Uint8Array,
  w: number,
  h: number,
  palette: Uint8Array,
  passCount = 1,
  minMajority = 6,
  maxColorJump = 90
) {
  let src = indices;

  const distRGB = (a: number, b: number) => {
    const ar = palette[a * 3], ag = palette[a * 3 + 1], ab = palette[a * 3 + 2];
    const br = palette[b * 3], bg = palette[b * 3 + 1], bb = palette[b * 3 + 2];
    const dr = ar - br, dg = ag - bg, db = ab - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  for (let pass = 0; pass < passCount; pass++) {
    const out = new Uint8Array(src.length);
    out.set(src);

    const at = (x: number, y: number) => src[y * w + x];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const self = at(x, y);

        let sameCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const v = at(x + dx, y + dy);
            if (v === self) sameCount++;
          }
        }
        if (sameCount >= 1) continue;

        const counts = new Map<number, number>();
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const v = at(x + dx, y + dy);
            counts.set(v, (counts.get(v) ?? 0) + 1);
          }
        }

        let bestVal = self;
        let bestCount = -1;
        for (const [val, c] of counts.entries()) {
          if (c > bestCount) {
            bestCount = c;
            bestVal = val;
          }
        }

        if (bestCount < minMajority) continue;
        if (distRGB(self, bestVal) > maxColorJump) continue;

        out[y * w + x] = bestVal;
      }
    }

    src = out;
  }

  indices.set(src);
}

export function quantizePixel256(img: ImageData, preset: PixelPreset): { palette: Uint8Array; indices: Uint8Array } {
  // Pixel presets are designed to be predictable and distinct from Modern:
  // - Clean: fixed 256 palette + light ordered dither
  // - Crisp: subtle edge emphasis (no blur), then fixed palette + ordered dither (sharper boundaries)
  // - Stable: fixed palette + ordered dither, then a mild majority cleanup pass to reduce isolated pixels/checkerboard
  // - Indexed: palette-first (adaptive 256-color), no dithering (preserve palette character)

  if (preset === "pixel-indexed") {
    // Adaptive palette from the image, no dithering.
    return quantizeTo256(img, "none", 0, false, false, false);
  }

  // Fixed palette + ordered dither (closest to classic "256 palette" tools)
  const palette = buildWinHalftone256Palette();

  let work = img;
  let strength = 0.28; // Clean default
  const edgeBias = true;

  if (preset === "pixel-crisp") {
    // Slight edge emphasis after resize to make boundaries more confident without Modern-like smoothing.
    work = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
    edgeAwareSharpen(work, 0.75, 12);
    strength = 0.38;
  } else if (preset === "pixel-stable") {
    strength = 0.45;
  } else {
    // pixel-clean
    strength = 0.28;
  }

  const indices = quantizeOrderedDither256(work, palette, strength, edgeBias);

  if (preset === "pixel-stable") {
    // Mild post cleanup to reduce isolated pixels / checkerboard artifacts.
    cleanupIndicesMajoritySafe(indices, work.width, work.height, palette, 2, 5, 85);
  }

  return { palette, indices };
}