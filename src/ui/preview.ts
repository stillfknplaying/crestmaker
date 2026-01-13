// Extracted preview rendering + recompute pipeline scheduling.
import type { ToolRefs } from "../app/dom";
import type { DitherMode, PipelineMode, PixelPreset, Preset } from "../types/types";
import type { PreviewDeps } from "./previewDeps";

let deps: PreviewDeps | null = null;

// Reuse a temporary canvas for in-game preview stamping
let tmpStampCanvas: HTMLCanvasElement | null = null;

export function initPreview(d: PreviewDeps) {
  deps = d;
}

export function renderPreview() {
  // Be resilient during startup / HMR: silently no-op until initPreview() is called.
  if (!deps) return;

  const refs = deps.getRefs() as ToolRefs | null;
  if (!refs) return;

  const canvas = refs.previewCanvas;
  const ctx = refs.previewCtx;

  const tpl = deps.getGameTemplate();
  const tw = tpl.baseW;
  const th = tpl.baseH;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(tw * dpr);
  canvas.height = Math.round(th * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, tw, th);

  const gameTemplateImg = deps.getGameTemplateImg();

  if (gameTemplateImg) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(gameTemplateImg, 0, 0, tw, th);
  } else {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, tw, th);
    ctx.fillStyle = "#aaa";
    ctx.font = "28px system-ui, sans-serif";
    const name = tpl.src.split("/").pop() || tpl.src;
    ctx.fillText(`Template not found. Put ${name} in /public/templates/`, 40, 70);
    return;
  }

  const palette256 = deps.getPalette256();
  if (!palette256) return;

  const isClanOnly = deps.getCurrentMode() === "only_clan";
  const indices = isClanOnly ? deps.getIconClan16() : deps.getIconCombined24();
  const iw = isClanOnly ? 16 : 24;
  const ih = 12;
  if (!indices) return;

  const img = ctx.createImageData(iw, ih);
  for (let i = 0; i < iw * ih; i++) {
    const idx = indices[i];
    img.data[i * 4 + 0] = palette256[idx * 3 + 0];
    img.data[i * 4 + 1] = palette256[idx * 3 + 1];
    img.data[i * 4 + 2] = palette256[idx * 3 + 2];
    img.data[i * 4 + 3] = 255;
  }

  if (!tmpStampCanvas) tmpStampCanvas = document.createElement("canvas");
  tmpStampCanvas.width = iw;
  tmpStampCanvas.height = ih;
  tmpStampCanvas.getContext("2d")!.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tmpStampCanvas, tpl.slotX, tpl.slotY, tpl.slotW, tpl.slotH);
}

// -------------------- RECOMPUTE PIPELINE --------------------
let previewTimer: number | null = null;

export function scheduleRecomputePreview(delayMs = 120) {
  // Be resilient during startup / HMR.
  if (!deps) return;

  if (previewTimer) window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    previewTimer = null;
    requestAnimationFrame(() => recomputePreview());
  }, delayMs);
}

export function recomputePreview() {
  // Be resilient during startup / HMR.
  if (!deps) return;

  const refs = deps.getRefs() as ToolRefs | null;
  if (!refs) return;
  if (!deps.getSourceImage()) return;

  const pipeline = refs.pipelineSel.value as PipelineMode;
  const presetVal = refs.presetSel.value;
  const preset = pipeline === "pixel" ? "balanced" : (presetVal as Preset);
  const pixelPreset = pipeline === "pixel" ? (presetVal as PixelPreset) : deps.getPixelPreset();
  const dither = refs.ditherSel.value as DitherMode;
  const isPixel = pipeline === "pixel";

  const useTwoStep = isPixel ? false : refs.twoStepChk.checked;
  const centerWeighted = isPixel ? false : refs.centerPaletteChk.checked;
  const dAmtRaw = Number(refs.ditherAmt.value) / 100;
  const dAmt = pipeline === "pixel" ? 0 : deps.clampDitherStrength(preset, dither, dAmtRaw);

  const useOKLab = refs.oklabChk.checked;
  const useNoiseOrdered = isPixel ? false : refs.noiseDitherChk.checked;
  const doEdgeSharpen = isPixel ? false : refs.edgeSharpenChk.checked;
  const doCleanup = refs.cleanupChk.checked;

  const src = deps.getCroppedSource();
  if (!src) return;

  const baseW = deps.getCurrentMode() === "only_clan" ? 16 : 24;
  const baseH = 12;

  const imgBase = deps.renderToSize(src, preset, useTwoStep, baseW, baseH);

  // hard alpha cutoff for crisp edges
  for (let i = 0; i < imgBase.data.length; i += 4) {
    imgBase.data[i + 3] = imgBase.data[i + 3] < 128 ? 0 : 255;
  }

  if (deps.getInvertColors()) {
    for (let i = 0; i < imgBase.data.length; i += 4) {
      imgBase.data[i] = 255 - imgBase.data[i];
      imgBase.data[i + 1] = 255 - imgBase.data[i + 1];
      imgBase.data[i + 2] = 255 - imgBase.data[i + 2];
    }
  }

  // Brightness + Contrast (universal)
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

  // Modern: light normalize & sharpen
  let imgForQuant = imgBase;
  if (!isPixel) {
    imgForQuant = deps.softNormalizeLevels(imgForQuant, preset === "complex" ? 0.30 : 0.22);
    if (doEdgeSharpen) imgForQuant = deps.edgeAwareSharpen(imgForQuant, preset === "simple" ? 0.10 : 0.12);
  }

  let palette256: Uint8Array;
  let indices: Uint8Array;

  if (pipeline === "pixel") {
    const q = deps.quantizePixel256(imgForQuant, pixelPreset);
    palette256 = q.palette;
    indices = q.indices;
  } else {
    const q = deps.quantizeTo256(imgForQuant, dither, dAmt, centerWeighted, useOKLab, useNoiseOrdered);
    palette256 = q.palette;
    indices = q.indices;
  }

  // split/pad outputs
  let iconAlly8x12Indexed: Uint8Array | null = null;
  let iconClan16x12Indexed: Uint8Array | null = null;
  let iconCombined24x12Indexed: Uint8Array | null = null;

  if (baseW === 16) {
    // clan-only
    iconClan16x12Indexed = indices;
  } else {
    // 24×12 combined
    iconCombined24x12Indexed = indices;

    // split into ally 8×12 + clan 16×12
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

  // Optional cleanup (safe majority)
  if (doCleanup && iconCombined24x12Indexed) {
    const passes = 1;
    const minMaj = 0.55;
    const maxJump = 110;
    deps.cleanupIndicesMajoritySafe(iconCombined24x12Indexed, 24, 12, palette256, passes, minMaj, maxJump);
  }

  // publish state back to main.ts
  deps.setPalette256(palette256);
  deps.setIconAlly8(iconAlly8x12Indexed);
  deps.setIconClan16(iconClan16x12Indexed);
  deps.setIconCombined24(iconCombined24x12Indexed);

  // draw debug / previews (true size)
  if (deps.getCurrentMode() === "only_clan") {
    if (iconClan16x12Indexed) deps.drawTrueSize(iconClan16x12Indexed, palette256, 16, 12);
  } else if (iconCombined24x12Indexed) {
    deps.drawTrueSize(iconCombined24x12Indexed, palette256, 24, 12);
  } else {
    deps.drawTrueSizeEmpty(24, 12);
  }

  // enable/disable Download button (main.ts owns the click handler)
  const canDownload =
    !!palette256 &&
    (deps.getCurrentMode() === "only_clan"
      ? !!iconClan16x12Indexed
      : !!iconCombined24x12Indexed && !!iconClan16x12Indexed && !!iconAlly8x12Indexed);

  deps.setCanDownload(canDownload);

  // zoomed panels (new naming only)
  if (deps.getCurrentMode() === "only_clan") {
    if (iconClan16x12Indexed) {
      deps.drawZoomTo(refs.dstZoom16Canvas, refs.dstZoom16Ctx, iconClan16x12Indexed, palette256, 16, 12);
    }
  } else {
    if (iconCombined24x12Indexed) {
      deps.drawZoomTo(refs.dstZoom24Canvas, refs.dstZoom24Ctx, iconCombined24x12Indexed, palette256, 24, 12);
    }
    if (iconClan16x12Indexed) {
      deps.drawZoomTo(refs.dstZoom16Canvas, refs.dstZoom16Ctx, iconClan16x12Indexed, palette256, 16, 12);
    }
  }

  // final in-game preview
  renderPreview();
}
