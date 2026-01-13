// Pipeline controller: compute-only step with scheduling.
//
// This module intentionally does NOT draw anything.
// It computes indexed output (palette + indices) and publishes it to state
// via deps setters, then lets the caller render via callbacks.

import type { ToolRefs } from "./dom";
import type {
  CrestMode,
  DitherMode,
  PipelineMode,
  PixelPreset,
  Preset,
} from "../types/types";

export type QuantizeResult = { palette: Uint8Array; indices: Uint8Array };

export type PipelineComputeResult = {
  palette256: Uint8Array;
  iconAlly8x12Indexed: Uint8Array | null;
  iconClan16x12Indexed: Uint8Array | null;
  iconCombined24x12Indexed: Uint8Array | null;
  baseW: number;
  baseH: number;
  canDownload: boolean;
};

export type PipelineControllerDeps = {
  getRefs: () => ToolRefs | null;

  // read state
  getSourceImage: () => HTMLImageElement | null;
  getCurrentMode: () => CrestMode;
  getInvertColors: () => boolean;
  getPixelPreset: () => PixelPreset;
  getBrightness: () => number;
  getContrast: () => number;

  clamp255: (n: number) => number;

  // input source (already cropped/rotated/in canvas coords)
  getCroppedSource: () => HTMLCanvasElement | null;

  // compute helpers
  renderToSize: (src: CanvasImageSource, preset: Preset, twoStep: boolean, w: number, h: number) => ImageData;
  edgeAwareSharpen: (img: ImageData, amount: number) => ImageData;
  softNormalizeLevels: (img: ImageData, amount: number) => ImageData;

  clampDitherStrength: (preset: Preset, dither: DitherMode, raw: number) => number;
  quantizeTo256: (
    img: ImageData,
    dither: DitherMode,
    ditherAmount: number,
    centerWeighted: boolean,
    useOKLab: boolean,
    noiseOrdered: boolean
  ) => QuantizeResult;
  quantizePixel256: (img: ImageData, preset: PixelPreset) => QuantizeResult;
  cleanupIndicesMajoritySafe: (
    indices: Uint8Array,
    w: number,
    h: number,
    palette: Uint8Array,
    passes: number,
    minMajority: number,
    maxJump: number
  ) => void;

  // publish results to state
  setPalette256: (p: Uint8Array) => void;
  setIconAlly8: (v: Uint8Array | null) => void;
  setIconClan16: (v: Uint8Array | null) => void;
  setIconCombined24: (v: Uint8Array | null) => void;

  // notify caller to render
  afterCompute: (result: PipelineComputeResult | null) => void;
};

let deps: PipelineControllerDeps | null = null;
let timer: number | null = null;

export function initPipelineController(d: PipelineControllerDeps) {
  deps = d;
}

export function scheduleRecomputePipeline(delayMs = 120) {
  if (!deps) return;
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    requestAnimationFrame(() => recomputePipeline());
  }, delayMs);
}

export function recomputePipeline(): PipelineComputeResult | null {
  if (!deps) return null;

  const refs = deps.getRefs();
  if (!refs) return null;
  if (!deps.getSourceImage()) return null;

  const src = deps.getCroppedSource();
  if (!src) return null;

  const pipeline = refs.pipelineSel.value as PipelineMode;
  const presetVal = refs.presetSel.value;

  const isPixel = pipeline === "pixel";
  const preset: Preset = isPixel ? "balanced" : (presetVal as Preset);
  const pixelPreset: PixelPreset = isPixel ? (presetVal as PixelPreset) : deps.getPixelPreset();

  const dither = refs.ditherSel.value as DitherMode;

  const useTwoStep = isPixel ? false : refs.twoStepChk.checked;
  const centerWeighted = isPixel ? false : refs.centerPaletteChk.checked;

  const dAmtRaw = Number(refs.ditherAmt.value) / 100;
  const dAmt = isPixel ? 0 : deps.clampDitherStrength(preset, dither, dAmtRaw);

  const useOKLab = refs.oklabChk.checked;
  const useNoiseOrdered = isPixel ? false : refs.noiseDitherChk.checked;
  const doEdgeSharpen = isPixel ? false : refs.edgeSharpenChk.checked;
  const doCleanup = refs.cleanupChk.checked;

  const baseW = deps.getCurrentMode() === "only_clan" ? 16 : 24;
  const baseH = 12;

  // 1) resize/render
  const imgBase = deps.renderToSize(src, preset, useTwoStep, baseW, baseH);

  // hard alpha cutoff for crisp edges
  for (let i = 0; i < imgBase.data.length; i += 4) {
    imgBase.data[i + 3] = imgBase.data[i + 3] < 128 ? 0 : 255;
  }

  // 2) invert (optional)
  if (deps.getInvertColors()) {
    for (let i = 0; i < imgBase.data.length; i += 4) {
      imgBase.data[i] = 255 - imgBase.data[i];
      imgBase.data[i + 1] = 255 - imgBase.data[i + 1];
      imgBase.data[i + 2] = 255 - imgBase.data[i + 2];
    }
  }

  // 3) brightness + contrast (universal)
  const brightness = deps.getBrightness();
  const contrast = deps.getContrast();
  if (brightness !== 0 || contrast !== 0) {
    const c = contrast;
    const k = (259 * (c + 255)) / (255 * (259 - c));
    for (let i = 0; i < imgBase.data.length; i += 4) {
      let rr = imgBase.data[i] + brightness;
      let gg = imgBase.data[i + 1] + brightness;
      let bb = imgBase.data[i + 2] + brightness;

      rr = deps.clamp255((rr - 128) * k + 128);
      gg = deps.clamp255((gg - 128) * k + 128);
      bb = deps.clamp255((bb - 128) * k + 128);

      imgBase.data[i] = rr;
      imgBase.data[i + 1] = gg;
      imgBase.data[i + 2] = bb;
    }
  }

  // 4) modern-only normalize & sharpen
  let imgForQuant: ImageData = imgBase;
  if (!isPixel) {
    imgForQuant = deps.softNormalizeLevels(imgForQuant, preset === "complex" ? 0.30 : 0.22);
    if (doEdgeSharpen) imgForQuant = deps.edgeAwareSharpen(imgForQuant, preset === "simple" ? 0.10 : 0.12);
  }

  // 5) quantize
  let palette256: Uint8Array;
  let indices: Uint8Array;
  if (isPixel) {
    const q = deps.quantizePixel256(imgForQuant, pixelPreset);
    palette256 = q.palette;
    indices = q.indices;
  } else {
    const q = deps.quantizeTo256(imgForQuant, dither, dAmt, centerWeighted, useOKLab, useNoiseOrdered);
    palette256 = q.palette;
    indices = q.indices;
  }

  // 6) split outputs
  let iconAlly8x12Indexed: Uint8Array | null = null;
  let iconClan16x12Indexed: Uint8Array | null = null;
  let iconCombined24x12Indexed: Uint8Array | null = null;

  if (baseW === 16) {
    iconClan16x12Indexed = indices;
  } else {
    iconCombined24x12Indexed = indices;

    iconAlly8x12Indexed = new Uint8Array(8 * 12);
    iconClan16x12Indexed = new Uint8Array(16 * 12);

    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 24; x++) {
        const v = indices[y * 24 + x];
        if (x < 8) iconAlly8x12Indexed[y * 8 + x] = v;
        else iconClan16x12Indexed[y * 16 + (x - 8)] = v;
      }
    }
  }

  // 7) optional cleanup (safe majority)
  if (doCleanup && iconCombined24x12Indexed) {
    const passes = 1;
    const minMaj = 0.55;
    const maxJump = 110;
    deps.cleanupIndicesMajoritySafe(iconCombined24x12Indexed, 24, 12, palette256, passes, minMaj, maxJump);
  }

  const canDownload =
    !!palette256 &&
    (deps.getCurrentMode() === "only_clan"
      ? !!iconClan16x12Indexed
      : !!iconCombined24x12Indexed && !!iconClan16x12Indexed && !!iconAlly8x12Indexed);

  const result: PipelineComputeResult = {
    palette256,
    iconAlly8x12Indexed,
    iconClan16x12Indexed,
    iconCombined24x12Indexed,
    baseW,
    baseH,
    canDownload,
  };

  // publish to state
  deps.setPalette256(palette256);
  deps.setIconAlly8(iconAlly8x12Indexed);
  deps.setIconClan16(iconClan16x12Indexed);
  deps.setIconCombined24(iconCombined24x12Indexed);

  deps.afterCompute(result);
  return result;
}
