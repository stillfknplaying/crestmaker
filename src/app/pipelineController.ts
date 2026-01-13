// Pipeline controller: compute-only step with scheduling.
//
// This module intentionally does NOT draw anything.
// It computes indexed output (palette + indices) and publishes it to state
// via deps setters, then lets the caller render via callbacks.

import type { ToolRefs } from "./dom";
import type {
  CrestMode,
  DitherMode,
  PixelPreset,
  PipelineMode,
  Preset,
} from "../types/types";

import type { PipelineEngine, PipelineSettings } from "./pipeline/engine";

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

  // compute engine (local today, worker later)
  engine: PipelineEngine;

  // read state
  getSourceImage: () => HTMLImageElement | null;
  getCurrentMode: () => CrestMode;
  getInvertColors: () => boolean;
  getPixelPreset: () => PixelPreset;
  getBrightness: () => number;
  getContrast: () => number;

  // input source (already cropped/rotated/in canvas coords)
  getCroppedSource: () => HTMLCanvasElement | null;

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
let computeSeq = 0;

export function initPipelineController(d: PipelineControllerDeps) {
  deps = d;
}

export function scheduleRecomputePipeline(delayMs = 120) {
  if (!deps) return;
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    timer = null;
    requestAnimationFrame(() => void recomputePipeline());
  }, delayMs);
}

export async function recomputePipeline(): Promise<PipelineComputeResult | null> {
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

  const settings: PipelineSettings = {
    crestMode: deps.getCurrentMode(),
    pipelineMode: pipeline,
    preset,
    pixelPreset,
    dither: refs.ditherSel.value as DitherMode,
    ditherAmountRaw: Number(refs.ditherAmt.value) / 100,
    twoStep: refs.twoStepChk.checked,
    centerWeighted: refs.centerPaletteChk.checked,
    useOKLab: refs.oklabChk.checked,
    noiseOrdered: refs.noiseDitherChk.checked,
    edgeSharpen: refs.edgeSharpenChk.checked,
    cleanup: refs.cleanupChk.checked,
    invertColors: deps.getInvertColors(),
    brightness: deps.getBrightness(),
    contrast: deps.getContrast(),
  };

  // Always compute from an ImageBitmap to support Worker engines.
  const seq = ++computeSeq;
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(src);
  } catch {
    return null;
  }

  let result: PipelineComputeResult;
  try {
    const maybe = deps.engine.compute({
      source: bitmap,
      settings,
      crop: null,
    });
    result = (maybe instanceof Promise ? await maybe : maybe) as PipelineComputeResult;
  } finally {
    try { bitmap.close(); } catch { /* ignore */ }
  }

  // If a newer compute was scheduled while we were waiting, drop this result.
  if (seq !== computeSeq) return null;

  // publish to state
  deps.setPalette256(result.palette256);
  deps.setIconAlly8(result.iconAlly8x12Indexed);
  deps.setIconClan16(result.iconClan16x12Indexed);
  deps.setIconCombined24(result.iconCombined24x12Indexed);

  deps.afterCompute(result);
  return result;
}
