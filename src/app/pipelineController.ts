// Pipeline controller: compute-only step with scheduling.
//
// This module intentionally does NOT draw anything.
// It computes indexed output (palette + indices) and publishes it to state
// via deps setters, then lets the caller render via callbacks.

import type { PipelineEngine, PipelineSettings } from "../engines/engine";

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
  /**
   * Read current pipeline settings from UI/state.
   * Controller should not depend on DOM refs directly.
   */
  getSettings: () => PipelineSettings | null;

  // compute engine (local today, worker later)
  engine: PipelineEngine;

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

  const src = deps.getCroppedSource();
  if (!src) return null;

  const settings = deps.getSettings();
  if (!settings) return null;

  const seq = ++computeSeq;
  let bitmap: ImageBitmap | null = null;
  const sourceForEngine: CanvasImageSource = (() => {
    if (!deps.engine.needsImageBitmap) return src;
    return null as any;
  })();

  if (deps.engine.needsImageBitmap) {
    try {
      bitmap = await createImageBitmap(src);
    } catch {
      return null;
    }
  }

  let result: PipelineComputeResult;
  try {
    const maybe = deps.engine.compute({
      source: (deps.engine.needsImageBitmap ? (bitmap as any) : sourceForEngine) as any,
      settings,
      crop: null,
    });
    result = (maybe instanceof Promise ? await maybe : maybe) as PipelineComputeResult;
  } finally {
    if (bitmap) {
      try {
        bitmap.close();
      } catch {
        /* ignore */
      }
    }
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
