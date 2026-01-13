// Extracted preview rendering + recompute pipeline scheduling.

type DitherMode = "none" | "ordered4" | "ordered8" | "floyd" | "atkinson";
type Preset = "legacy" | "simple" | "balanced" | "complex";
type PipelineMode = "old" | "pixel";
type PixelPreset = "pixel-clean" | "pixel-crisp" | "pixel-stable" | "pixel-indexed";
type CrestMode = "ally_clan" | "only_clan";

type ToolRefs = {
  // the module only uses a subset; main.ts can still have a wider ToolRefs
  previewCanvas: HTMLCanvasElement;
  previewCtx: CanvasRenderingContext2D;

  pipelineSel: HTMLSelectElement;
  presetSel: HTMLSelectElement;
  ditherSel: HTMLSelectElement;
  ditherAmt: HTMLInputElement;

  twoStepChk: HTMLInputElement;
  centerPaletteChk: HTMLInputElement;
  oklabChk: HTMLInputElement;
  noiseDitherChk: HTMLInputElement;
  edgeSharpenChk: HTMLInputElement;
  cleanupChk: HTMLInputElement;
};

type GameTemplate = {
  src: string;
  baseW: number;
  baseH: number;
  slotX: number;
  slotY: number;
  slotW: number;
  slotH: number;
};

type Deps = {
  // state getters
  getRefs: () => any; // ToolRefs | null (use any to avoid drift with main's ToolRefs)
  getSourceImage: () => HTMLImageElement | null;
  getCurrentMode: () => CrestMode;
  getInvertColors: () => boolean;

  getGameTemplate: () => GameTemplate;
  getGameTemplateImg: () => HTMLImageElement | null;

  getPalette256: () => Uint8Array | null;
  setPalette256: (p: Uint8Array | null) => void;

  getIconAlly8: () => Uint8Array | null;
  setIconAlly8: (v: Uint8Array | null) => void;

  getIconClan16: () => Uint8Array | null;
  setIconClan16: (v: Uint8Array | null) => void;

  getIconCombined24: () => Uint8Array | null;
  setIconCombined24: (v: Uint8Array | null) => void;

  // helpers / options
  getPixelPreset: () => PixelPreset;
  getBrightness: () => number;
  getContrast: () => number;
  clamp255: (v: number) => number;

  // image ops
  getCroppedSource: () => HTMLCanvasElement | null;

  renderToSize: (src: CanvasImageSource, preset: Preset, twoStep: boolean, w: number, h: number) => ImageData;
  edgeAwareSharpen: (img: ImageData, strength: number) => ImageData;
  softNormalizeLevels: (img: ImageData, amount: number) => ImageData;

  clampDitherStrength: (preset: Preset, mode: DitherMode, v01: number) => number;
  quantizeTo256: (
    img: ImageData,
    mode: DitherMode,
    amount: number,
    centerWeighted: boolean,
    useOKLab: boolean,
    useNoiseOrdered: boolean
  ) => { palette: Uint8Array; indices: Uint8Array };

  quantizePixel256: (img: ImageData, pixelPreset: PixelPreset) => { palette: Uint8Array; indices: Uint8Array };
  cleanupIndicesMajoritySafe: (indices: Uint8Array, w: number, h: number, palette: Uint8Array, passes: number, minMaj: number, maxJump: number) => void;

  // drawing
  drawTrueSizeEmpty: (w: number, h: number) => void;
  drawTrueSize: (indices: Uint8Array, palette: Uint8Array, w: number, h: number) => void;
  drawZoomTo: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, indices: Uint8Array, palette: Uint8Array, w: number, h: number) => void;
};

let deps: Deps | null = null;

export function initPreview(d: Deps) {
  deps = d;
}

export function renderPreview() {
  if (!deps) throw new Error("preview not initialized");
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

  const tmp = document.createElement("canvas");
  tmp.width = iw;
  tmp.height = ih;
  tmp.getContext("2d")!.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tmp, tpl.slotX, tpl.slotY, tpl.slotW, tpl.slotH);
}

// -------------------- RECOMPUTE PIPELINE --------------------
let previewTimer: number | null = null;

export function scheduleRecomputePreview(delayMs = 120) {
  if (!deps) throw new Error("preview not initialized");
  if (previewTimer) window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    previewTimer = null;
    requestAnimationFrame(() => recomputePreview());
  }, delayMs);
}

export function recomputePreview() {
  if (!deps) throw new Error("preview not initialized");
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

  for (let i = 0; i < imgBase.data.length; i += 4) imgBase.data[i + 3] = imgBase.data[i + 3] < 128 ? 0 : 255;

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
      let r = imgBase.data[i] + brightness;
      let g = imgBase.data[i + 1] + brightness;
      let b = imgBase.data[i + 2] + brightness;

      r = deps.clamp255((r - 128) * k + 128);
      g = deps.clamp255((g - 128) * k + 128);
      b = deps.clamp255((b - 128) * k + 128);

      imgBase.data[i] = r;
      imgBase.data[i + 1] = g;
      imgBase.data[i + 2] = b;
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

  // draw debug / previews
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

  const r: any = refs as any;
  if (r.downloadBtn) r.downloadBtn.disabled = !canDownload;

  // zoomed panels: support both naming conventions (older/newer main.ts)
  // - Newer main.ts uses dstZoom24Canvas/dstZoom16Canvas
  // - Older builds used dstZoomCanvas/dstClanZoomCanvas/dstAllyZoomCanvas
  if (deps.getCurrentMode() === "only_clan") {
    const zc = r.dstZoom16Canvas ?? r.dstClanZoomCanvas;
    const zx = r.dstZoom16Ctx ?? r.dstClanZoomCtx;
    if (zc && zx && iconClan16x12Indexed) {
      deps.drawZoomTo(zc, zx, iconClan16x12Indexed, palette256, 16, 12);
    }
  } else {
    const z24c = r.dstZoom24Canvas ?? r.dstZoomCanvas;
    const z24x = r.dstZoom24Ctx ?? r.dstZoomCtx;
    if (z24c && z24x && iconCombined24x12Indexed) {
      deps.drawZoomTo(z24c, z24x, iconCombined24x12Indexed, palette256, 24, 12);
    }

    const z16c = r.dstZoom16Canvas ?? r.dstClanZoomCanvas;
    const z16x = r.dstZoom16Ctx ?? r.dstClanZoomCtx;
    if (z16c && z16x && iconClan16x12Indexed) {
      deps.drawZoomTo(z16c, z16x, iconClan16x12Indexed, palette256, 16, 12);
    }

    if (r.dstAllyZoomCanvas && r.dstAllyZoomCtx && iconAlly8x12Indexed) {
      deps.drawZoomTo(r.dstAllyZoomCanvas, r.dstAllyZoomCtx, iconAlly8x12Indexed, palette256, 8, 12);
    }
  }

  // final in-game preview
  renderPreview();
}
