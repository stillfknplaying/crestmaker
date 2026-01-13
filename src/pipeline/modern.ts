import { buildPaletteSync, utils } from "image-q";

export type DitherMode = "none" | "ordered4" | "ordered8" | "floyd" | "atkinson";
export type Preset = "legacy" | "simple" | "balanced" | "complex";

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function renderCoverToSize(
  img: CanvasImageSource,
  sw: number,
  sh: number,
  tw: number,
  th: number,
  smoothing: boolean
): ImageData {
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = smoothing;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, tw, th);

  const ir = sw / sh;
  const tr = tw / th;

  let cropW = sw, cropH = sh;
  if (ir > tr) {
    cropW = sh * tr;
    cropH = sh;
  } else {
    cropW = sw;
    cropH = sw / tr;
  }

  const sx = (sw - cropW) / 2;
  const sy = (sh - cropH) / 2;

  // @ts-ignore
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, tw, th);
  return ctx.getImageData(0, 0, tw, th);
}

export function renderToSize(src: HTMLCanvasElement, preset: Preset, useTwoStep: boolean, tw: number, th: number): ImageData {
  const sw = src.width;
  const sh = src.height;

  const smoothFirst = preset !== "simple" && preset !== "legacy";
  const smoothSingle = preset === "complex";
  const smoothLegacy = preset === "legacy";

  if (!useTwoStep) {
    return renderCoverToSize(src, sw, sh, tw, th, smoothLegacy ? false : smoothSingle);
  }

  // Upscale the intermediate stage proportionally (keeps details for tiny output)
  const midW = tw * 4;
  const midH = th * 4;

  const mid = renderCoverToSize(src, sw, sh, midW, midH, smoothLegacy ? false : smoothFirst);
  const midCanvas = document.createElement("canvas");
  midCanvas.width = midW;
  midCanvas.height = midH;
  const mctx = midCanvas.getContext("2d")!;
  mctx.putImageData(mid, 0, 0);

  // final step no smoothing for sharper pixels
  return renderCoverToSize(midCanvas, midW, midH, tw, th, false);
}

export function edgeAwareSharpen(img: ImageData, amount = 0.9, edgeThreshold = 10) {
  const w = img.width, h = img.height;
  const src = img.data;
  const out = new Uint8ClampedArray(src.length);

  const idx = (x: number, y: number) => (y * w + x) * 4;

  const lumaAt = (x: number, y: number) => {
    const p = idx(x, y);
    return 0.2126 * src[p] + 0.7152 * src[p + 1] + 0.0722 * src[p + 2];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p0 = idx(x, y);

      const xm1 = clamp(x - 1, 0, w - 1), xp1 = clamp(x + 1, 0, w - 1);
      const ym1 = clamp(y - 1, 0, h - 1), yp1 = clamp(y + 1, 0, h - 1);

      const gx =
        (lumaAt(xp1, ym1) + 2 * lumaAt(xp1, y) + lumaAt(xp1, yp1)) -
        (lumaAt(xm1, ym1) + 2 * lumaAt(xm1, y) + lumaAt(xm1, yp1));
      const gy =
        (lumaAt(xm1, yp1) + 2 * lumaAt(x, yp1) + lumaAt(xp1, yp1)) -
        (lumaAt(xm1, ym1) + 2 * lumaAt(x, ym1) + lumaAt(xp1, ym1));

      const edge = Math.sqrt(gx * gx + gy * gy);

      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = clamp(x + dx, 0, w - 1);
          const yy = clamp(y + dy, 0, h - 1);
          const p = idx(xx, yy);
          r += src[p];
          g += src[p + 1];
          b += src[p + 2];
          n++;
        }
      }
      const br = r / n, bg = g / n, bb = b / n;

      if (edge > edgeThreshold) {
        out[p0]     = clamp(src[p0]     + amount * (src[p0]     - br), 0, 255);
        out[p0 + 1] = clamp(src[p0 + 1] + amount * (src[p0 + 1] - bg), 0, 255);
        out[p0 + 2] = clamp(src[p0 + 2] + amount * (src[p0 + 2] - bb), 0, 255);
        out[p0 + 3] = src[p0 + 3];
      } else {
        out[p0]     = src[p0];
        out[p0 + 1] = src[p0 + 1];
        out[p0 + 2] = src[p0 + 2];
        out[p0 + 3] = src[p0 + 3];
      }
    }
  }
  img.data.set(out);
}

export function softNormalizeLevels(img: ImageData, preset: Preset): void {
  if (preset === "legacy") return;
  // Strength is small on purpose to avoid "fried" photos and noisy gradients.
  let strength = 0.12;
  if (preset === "simple") strength = 0.18;
  else if (preset === "balanced") strength = 0.14;
  else if (preset === "complex") strength = 0.06;

  const d = img.data;
  let rMin = 255, gMin = 255, bMin = 255;
  let rMax = 0, gMax = 0, bMax = 0;

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (r < rMin) rMin = r;
    if (g < gMin) gMin = g;
    if (b < bMin) bMin = b;
    if (r > rMax) rMax = r;
    if (g > gMax) gMax = g;
    if (b > bMax) bMax = b;
  }

  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;

  // If image is already flat (or transparent), do nothing.
  if (rRange < 8 && gRange < 8 && bRange < 8) return;

  const rScale = rRange > 0 ? 255 / rRange : 1;
  const gScale = gRange > 0 ? 255 / gRange : 1;
  const bScale = bRange > 0 ? 255 / bRange : 1;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const rn = clamp((r - rMin) * rScale, 0, 255);
    const gn = clamp((g - gMin) * gScale, 0, 255);
    const bn = clamp((b - bMin) * bScale, 0, 255);
    d[i]     = clamp(Math.round(lerp(r, rn, strength)), 0, 255);
    d[i + 1] = clamp(Math.round(lerp(g, gn, strength)), 0, 255);
    d[i + 2] = clamp(Math.round(lerp(b, bn, strength)), 0, 255);
  }
}

export function clampDitherStrength(preset: Preset, mode: DitherMode, v01: number): number {
  let v = clamp(v01, 0, 1);
  if (mode === "none") return 0;

  // Ordered patterns can tolerate a bit more; error-diffusion gets "fried" easily on tiny 24×12.
  const capsOrdered: Record<Preset, number> = {
    legacy: 0.0,
    simple: 0.45,
    balanced: 0.60,
    complex: 0.45,
  };

  const capsDiffusion: Record<Preset, number> = {
    legacy: 0.0,
    simple: 0.22,
    balanced: 0.30,
    complex: 0.26,
  };

  if (mode === "ordered4" || mode === "ordered8") return Math.min(v, capsOrdered[preset]);
  if (mode === "floyd" || mode === "atkinson") return Math.min(v, capsDiffusion[preset]);
  return v;
}

export function quantizeTo256(
  img: ImageData,
  ditherMode: DitherMode,
  ditherStrength01: number,
  _balanceColors: boolean,
  _useOKLab: boolean,
  useNoiseOrdered: boolean
): { palette: Uint8Array; indices: Uint8Array } {
  // Build 256-color palette with image-q defaults (rollback from NeuQuant/Wu choices).
  const pc = utils.PointContainer.fromImageData(img);
  // image-q expects an array of PointContainers
  const pal = buildPaletteSync([pc], { colors: 256, colorDistanceFormula: "euclidean" } as any);

  // Extract palette into packed RGB bytes (256 * 3).
  const palette = new Uint8Array(256 * 3);
  const palPC = (pal as any).getPointContainer?.() ?? (pal as any)._pointContainer;
  const pts: any[] = palPC?.getPointArray?.() ?? palPC?.points ?? [];
  const count = Math.min(256, pts.length);
  for (let i = 0; i < count; i++) {
    const p = pts[i];
    palette[i * 3 + 0] = p.r ?? p[0] ?? 0;
    palette[i * 3 + 1] = p.g ?? p[1] ?? 0;
    palette[i * 3 + 2] = p.b ?? p[2] ?? 0;
  }

  // Nearest palette index (brute force is fine for 24×12 / 16×12).
  const nearestIndex = (r8: number, g8: number, b8: number): number => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < 256; i++) {
      const pr = palette[i * 3 + 0];
      const pg = palette[i * 3 + 1];
      const pb = palette[i * 3 + 2];
      const dr = r8 - pr;
      const dg = g8 - pg;
      const db = b8 - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
        if (dist === 0) break;
      }
    }
    return best;
  };

  const w = img.width;
  const h = img.height;
  const rgba = img.data;
  const indices = new Uint8Array(w * h);

  const strength = clamp(ditherStrength01, 0, 1);

  // Small deterministic noise for ordered dithering.
  const hash01 = (x: number, y: number): number => {
    let n = (x * 374761393) ^ (y * 668265263);
    n = (n ^ (n >>> 13)) * 1274126177;
    n = (n ^ (n >>> 16)) >>> 0;
    return n / 0xffffffff;
  };

  // Error diffusion dithering (linear scan only; serpentine was rolled back).
  if (ditherMode === "floyd" || ditherMode === "atkinson") {
    const errR = new Float32Array(w * h);
    const errG = new Float32Array(w * h);
    const errB = new Float32Array(w * h);

    const addErr = (x: number, y: number, er: number, eg: number, eb: number, wgt: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const j = y * w + x;
      errR[j] += er * wgt;
      errG[j] += eg * wgt;
      errB[j] += eb * wgt;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const p = i * 4;

        const r = clamp(rgba[p + 0] + errR[i], 0, 255);
        const g = clamp(rgba[p + 1] + errG[i], 0, 255);
        const b = clamp(rgba[p + 2] + errB[i], 0, 255);

        const idx = nearestIndex(r, g, b);
        indices[i] = idx;

        const pr = palette[idx * 3 + 0];
        const pg = palette[idx * 3 + 1];
        const pb = palette[idx * 3 + 2];

        const er = (r - pr) * strength;
        const eg = (g - pg) * strength;
        const eb = (b - pb) * strength;

        if (ditherMode === "atkinson") {
          // Atkinson diffusion: 6 neighbors, each 1/8
          const wgt = 1 / 8;
          addErr(x + 1, y,     er, eg, eb, wgt);
          addErr(x + 2, y,     er, eg, eb, wgt);
          addErr(x - 1, y + 1, er, eg, eb, wgt);
          addErr(x,     y + 1, er, eg, eb, wgt);
          addErr(x + 1, y + 1, er, eg, eb, wgt);
          addErr(x,     y + 2, er, eg, eb, wgt);
        } else {
          // Floyd–Steinberg diffusion
          addErr(x + 1, y,     er, eg, eb, 7 / 16);
          addErr(x - 1, y + 1, er, eg, eb, 3 / 16);
          addErr(x,     y + 1, er, eg, eb, 5 / 16);
          addErr(x + 1, y + 1, er, eg, eb, 1 / 16);
        }
      }
    }

    return { palette, indices };
  }

  // Ordered dithering (Bayer) + optional noise.
  const bayer4 = [
    0,  8,  2, 10,
    12, 4, 14, 6,
    3, 11, 1,  9,
    15, 7, 13, 5,
  ];
  const bayer8 = [
    0, 48, 12, 60, 3, 51, 15, 63,
    32, 16, 44, 28, 35, 19, 47, 31,
    8, 56, 4, 52, 11, 59, 7, 55,
    40, 24, 36, 20, 43, 27, 39, 23,
    2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29,
    10, 58, 6, 54, 9, 57, 5, 53,
    42, 26, 38, 22, 41, 25, 37, 21,
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const p = i * 4;

      let r = rgba[p + 0];
      let g = rgba[p + 1];
      let b = rgba[p + 2];

      if (ditherMode === "ordered4" || ditherMode === "ordered8") {
        if (useNoiseOrdered) {
          const t = hash01(x, y) - 0.5;
          const offset = t * 36 * strength;
          r = clamp(r + offset, 0, 255);
          g = clamp(g + offset, 0, 255);
          b = clamp(b + offset, 0, 255);
        } else {
          const is8 = ditherMode === "ordered8";
          const t = is8
            ? (bayer8[(y % 8) * 8 + (x % 8)] / 63)
            : (bayer4[(y % 4) * 4 + (x % 4)] / 15);
          const offset = (t - 0.5) * 32 * strength;
          r = clamp(r + offset, 0, 255);
          g = clamp(g + offset, 0, 255);
          b = clamp(b + offset, 0, 255);
        }
      }

      indices[i] = nearestIndex(r, g, b);
    }
  }

  return { palette, indices };
}