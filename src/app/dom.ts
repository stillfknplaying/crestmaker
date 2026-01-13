export type ToolRefs = {
  themeToggle: HTMLInputElement;
  fileInput: HTMLInputElement;
  downloadBtn: HTMLButtonElement;

  modeSel: HTMLSelectElement;

  presetSel: HTMLSelectElement;
  pipelineSel: HTMLSelectElement;
advancedChk: HTMLInputElement;
  resetBtn: HTMLButtonElement;
  advancedPanel: HTMLDivElement;

  ditherSel: HTMLSelectElement;
  twoStepChk: HTMLInputElement;
  centerPaletteChk: HTMLInputElement;
  ditherAmt: HTMLInputElement;
  ditherAmtVal: HTMLSpanElement;

  brightness: HTMLInputElement;
  brightnessVal: HTMLSpanElement;
  contrast: HTMLInputElement;
  contrastVal: HTMLSpanElement;

  oklabChk: HTMLInputElement;
  noiseDitherChk: HTMLInputElement;
  edgeSharpenChk: HTMLInputElement;
  cleanupChk: HTMLInputElement;

  rotL: HTMLButtonElement;
  rotR: HTMLButtonElement;
  invertBtn: HTMLButtonElement;

  useCropChk: HTMLInputElement;

  cropCanvas: HTMLCanvasElement;
  cropCtx: CanvasRenderingContext2D;

  dstTrueCanvas: HTMLCanvasElement;
  dstTrueCtx: CanvasRenderingContext2D;

  dstZoom24Canvas: HTMLCanvasElement;
  dstZoom24Ctx: CanvasRenderingContext2D;

  dstZoom16Canvas: HTMLCanvasElement;
  dstZoom16Ctx: CanvasRenderingContext2D;

  previewCanvas: HTMLCanvasElement;
  previewCtx: CanvasRenderingContext2D;

  debugCard24: HTMLDivElement;
  debugCard16: HTMLDivElement;
  confirmModal: HTMLDivElement;
  confirmYes: HTMLButtonElement;
  confirmNo: HTMLButtonElement;
}

export function collectToolRefs(root: Document = document): ToolRefs {
  return {
    themeToggle: root.querySelector<HTMLInputElement>("#themeToggle")!,
    fileInput: root.querySelector<HTMLInputElement>("#file")!,
    downloadBtn: root.querySelector<HTMLButtonElement>("#download")!,

    modeSel: root.querySelector<HTMLSelectElement>("#mode")!,

    presetSel: root.querySelector<HTMLSelectElement>("#preset")!,
    pipelineSel: root.querySelector<HTMLSelectElement>("#pipeline")!,
advancedChk: root.querySelector<HTMLInputElement>("#advanced")!,
    resetBtn: root.querySelector<HTMLButtonElement>("#reset")!,
    advancedPanel: root.querySelector<HTMLDivElement>("#advancedPanel")!,

    ditherSel: root.querySelector<HTMLSelectElement>("#dither")!,
    twoStepChk: root.querySelector<HTMLInputElement>("#twoStep")!,
    centerPaletteChk: root.querySelector<HTMLInputElement>("#centerPalette")!,
    ditherAmt: root.querySelector<HTMLInputElement>("#ditherAmt")!,
    ditherAmtVal: root.querySelector<HTMLSpanElement>("#ditherAmtVal")!,

    brightness: root.querySelector<HTMLInputElement>("#brightness")!,
    brightnessVal: root.querySelector<HTMLSpanElement>("#brightnessVal")!,
    contrast: root.querySelector<HTMLInputElement>("#contrast")!,
    contrastVal: root.querySelector<HTMLSpanElement>("#contrastVal")!,

    oklabChk: root.querySelector<HTMLInputElement>("#oklab")!,
    noiseDitherChk: root.querySelector<HTMLInputElement>("#noiseDither")!,
    edgeSharpenChk: root.querySelector<HTMLInputElement>("#edgeSharpen")!,
    cleanupChk: root.querySelector<HTMLInputElement>("#cleanup")!,

    rotL: root.querySelector<HTMLButtonElement>("#rotL")!,
    rotR: root.querySelector<HTMLButtonElement>("#rotR")!,
    invertBtn: root.querySelector<HTMLButtonElement>("#invert")!,

    useCropChk: root.querySelector<HTMLInputElement>("#useCrop")!,

    cropCanvas: root.querySelector<HTMLCanvasElement>("#crop")!,
    cropCtx: root.querySelector<HTMLCanvasElement>("#crop")!.getContext("2d")!,

    dstTrueCanvas: root.querySelector<HTMLCanvasElement>("#dstTrue")!,
    dstTrueCtx: root.querySelector<HTMLCanvasElement>("#dstTrue")!.getContext("2d")!,

    dstZoom24Canvas: root.querySelector<HTMLCanvasElement>("#dstZoom24")!,
    dstZoom24Ctx: root.querySelector<HTMLCanvasElement>("#dstZoom24")!.getContext("2d")!,

    dstZoom16Canvas: root.querySelector<HTMLCanvasElement>("#dstZoom16")!,
    dstZoom16Ctx: root.querySelector<HTMLCanvasElement>("#dstZoom16")!.getContext("2d")!,

    previewCanvas: root.querySelector<HTMLCanvasElement>("#preview")!,
    previewCtx: root.querySelector<HTMLCanvasElement>("#preview")!.getContext("2d")!,

    debugCard24: root.querySelector<HTMLDivElement>("#debugCard24")!,
    debugCard16: root.querySelector<HTMLDivElement>("#debugCard16")!,
    confirmModal: root.querySelector<HTMLDivElement>("#confirmModal")!,
    confirmYes: root.querySelector<HTMLButtonElement>("#confirmYes")!,
    confirmNo: root.querySelector<HTMLButtonElement>("#confirmNo")!,
  
  };
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}