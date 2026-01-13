// Extracted preview rendering (game template + stamped crest).
import type { ToolRefs } from "../app/dom";
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