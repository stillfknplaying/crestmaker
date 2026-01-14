/// <reference lib="webworker" />

import type { PipelineInput, PipelineResult } from "./engine";
import { LocalPipelineEngine } from "./localEngine";

import type { Preset } from "../types/types";
import {
  edgeAwareSharpen,
  softNormalizeLevels,
  clampDitherStrength,
  quantizeTo256,
} from "../pipeline/modern";
import { quantizePixel256, cleanupIndicesMajoritySafe } from "../pipeline/pixel";

type WorkerRequest = {
  id: number;
  input: {
    source: ImageBitmap;
    settings: PipelineInput["settings"];
  };
};

type WorkerResponse =
  | { id: number; ok: true; result: PipelineResult }
  | { id: number; ok: false; error: string };

function clamp255(x: number): number {
  return x < 0 ? 0 : x > 255 ? 255 : x;
}

// Worker-safe resize/render implementation (no document access).
function renderToSizeWorker(
  src: CanvasImageSource,
  preset: Preset,
  useTwoStep: boolean,
  tw: number,
  th: number
): ImageData {
  const sw = (src as any).width ?? (src as any).naturalWidth ?? 1;
  const sh = (src as any).height ?? (src as any).naturalHeight ?? 1;

  const smoothFirst = preset !== "simple" && preset !== "legacy";
  const smoothSingle = preset === "complex";
  const smoothLegacy = preset === "legacy";

  const renderCover = (img: CanvasImageSource, w: number, h: number, outW: number, outH: number, smoothing: boolean): ImageData => {
    const c = new OffscreenCanvas(outW, outH);
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = smoothing;
    // @ts-ignore
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, outW, outH);

    const ir = w / h;
    const tr = outW / outH;

    let cropW = w, cropH = h;
    if (ir > tr) {
      cropW = h * tr;
      cropH = h;
    } else {
      cropW = w;
      cropH = w / tr;
    }

    const sx = (w - cropW) / 2;
    const sy = (h - cropH) / 2;
    // @ts-ignore
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);
    return ctx.getImageData(0, 0, outW, outH);
  };

  if (!useTwoStep) {
    return renderCover(src, sw, sh, tw, th, smoothLegacy ? false : smoothSingle);
  }

  const midW = tw * 4;
  const midH = th * 4;
  const mid = renderCover(src, sw, sh, midW, midH, smoothLegacy ? false : smoothFirst);

  const midCanvas = new OffscreenCanvas(midW, midH);
  const mctx = midCanvas.getContext("2d")!;
  mctx.putImageData(mid, 0, 0);

  return renderCover(midCanvas, midW, midH, tw, th, false);
}

const engine = new LocalPipelineEngine({
  renderToSize: renderToSizeWorker,
  edgeAwareSharpen,
  softNormalizeLevels,
  clamp255,
  clampDitherStrength,
  quantizeTo256,
  quantizePixel256,
  cleanupIndicesMajoritySafe,
});

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
  const { id, input } = ev.data;
  try {
    const res = engine.compute({
      source: input.source,
      settings: input.settings,
      crop: null,
    });

    // Transfer the underlying buffers back to the main thread.
    const payload: WorkerResponse = { id, ok: true, result: res };
    const transfers: Transferable[] = [];
    transfers.push(res.palette256.buffer);
    if (res.iconAlly8x12Indexed) transfers.push(res.iconAlly8x12Indexed.buffer);
    if (res.iconClan16x12Indexed) transfers.push(res.iconClan16x12Indexed.buffer);
    if (res.iconCombined24x12Indexed) transfers.push(res.iconCombined24x12Indexed.buffer);

    (self as any).postMessage(payload, transfers);
  } catch (e: any) {
    const payload: WorkerResponse = { id, ok: false, error: String(e?.message || e) };
    (self as any).postMessage(payload);
  }
};
