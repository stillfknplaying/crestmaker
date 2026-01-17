export type ToolRefs = {
  dropOverlay: HTMLDivElement;
  themeToggle: HTMLInputElement;
  fileInput: HTMLInputElement;
  urlInput: HTMLInputElement;
  urlLoadBtn: HTMLButtonElement;
  urlError: HTMLDivElement;
  downloadBtn: HTMLButtonElement;
  shareBtn: HTMLButtonElement;

  modeSel: HTMLSelectElement;

  presetSel: HTMLSelectElement;
  pipelineSel: HTMLSelectElement;
  advancedChk: HTMLInputElement;
  resetBtn: HTMLButtonElement;
  resetToolbarBtn: HTMLButtonElement | null;
  advancedPanel: HTMLDivElement;

  ditherSel: HTMLSelectElement;
  twoStepChk: HTMLInputElement;
  centerPaletteChk: HTMLInputElement;
  ditherAmt: HTMLInputElement;
  ditherAmtVal: HTMLSpanElement;

  brightness: HTMLInputElement;
  brightnessVal: HTMLSpanElement;
  brightnessMinus: HTMLButtonElement;
  brightnessPlus: HTMLButtonElement;
  contrast: HTMLInputElement;
  contrastVal: HTMLSpanElement;
  contrastMinus: HTMLButtonElement;
  contrastPlus: HTMLButtonElement;

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

  // Editor
  undoBtn: HTMLButtonElement;
  redoBtn: HTMLButtonElement;
  toolPickerBtn: HTMLButtonElement;
  toolPencilBtn: HTMLButtonElement;
  gridToggleBtn: HTMLButtonElement;
  zoomCursor24: HTMLDivElement;
  zoomCursorImg24: HTMLImageElement;
  zoomCursor16: HTMLDivElement;
  zoomCursorImg16: HTMLImageElement;
  editorPopularColors: HTMLDivElement;
  editorColorSwatch: HTMLSpanElement;
  editorColorLabel: HTMLSpanElement;
}

export function collectToolRefs(root: Document = document): ToolRefs {
  return {
    dropOverlay: root.querySelector<HTMLDivElement>("#dropOverlay")!,
    themeToggle: root.querySelector<HTMLInputElement>("#themeToggle")!,
    fileInput: root.querySelector<HTMLInputElement>("#file")!,
    urlInput: root.querySelector<HTMLInputElement>("#url")!,
    urlLoadBtn: root.querySelector<HTMLButtonElement>("#loadUrl")!,
    urlError: root.querySelector<HTMLDivElement>("#urlError")!,
    downloadBtn: root.querySelector<HTMLButtonElement>("#download")!,
    shareBtn: root.querySelector<HTMLButtonElement>("#share")!,

    modeSel: root.querySelector<HTMLSelectElement>("#mode")!,

    presetSel: root.querySelector<HTMLSelectElement>("#preset")!,
    pipelineSel: root.querySelector<HTMLSelectElement>("#pipeline")!,
    advancedChk: root.querySelector<HTMLInputElement>("#advanced")!,
    resetBtn: root.querySelector<HTMLButtonElement>("#reset")!,
    resetToolbarBtn: root.querySelector<HTMLButtonElement>("#resetToolbar"),
    advancedPanel: root.querySelector<HTMLDivElement>("#advancedPanel")!,

    ditherSel: root.querySelector<HTMLSelectElement>("#dither")!,
    twoStepChk: root.querySelector<HTMLInputElement>("#twoStep")!,
    centerPaletteChk: root.querySelector<HTMLInputElement>("#centerPalette")!,
    ditherAmt: root.querySelector<HTMLInputElement>("#ditherAmt")!,
    ditherAmtVal: root.querySelector<HTMLSpanElement>("#ditherAmtVal")!,

    brightness: root.querySelector<HTMLInputElement>("#brightness")!,
    brightnessVal: root.querySelector<HTMLSpanElement>("#brightnessVal")!,
    brightnessMinus: root.querySelector<HTMLButtonElement>("#brightnessMinus")!,
    brightnessPlus: root.querySelector<HTMLButtonElement>("#brightnessPlus")!,
    contrast: root.querySelector<HTMLInputElement>("#contrast")!,
    contrastVal: root.querySelector<HTMLSpanElement>("#contrastVal")!,
    contrastMinus: root.querySelector<HTMLButtonElement>("#contrastMinus")!,
    contrastPlus: root.querySelector<HTMLButtonElement>("#contrastPlus")!,

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

    undoBtn: root.querySelector<HTMLButtonElement>("#undo")!,
    redoBtn: root.querySelector<HTMLButtonElement>("#redo")!,
    toolPickerBtn: root.querySelector<HTMLButtonElement>("#toolPicker")!,
    toolPencilBtn: root.querySelector<HTMLButtonElement>("#toolPencil")!,
    gridToggleBtn: root.querySelector<HTMLButtonElement>("#gridToggle")!,
    zoomCursor24: root.querySelector<HTMLDivElement>("#zoomCursor24")!,
    zoomCursorImg24: root.querySelector<HTMLImageElement>("#zoomCursorImg24")!,
    zoomCursor16: root.querySelector<HTMLDivElement>("#zoomCursor16")!,
    zoomCursorImg16: root.querySelector<HTMLImageElement>("#zoomCursorImg16")!,
    editorPopularColors: root.querySelector<HTMLDivElement>("#editorPopularColors")!,
    editorColorSwatch: root.querySelector<HTMLSpanElement>("#editorColorSwatch")!,
    editorColorLabel: root.querySelector<HTMLSpanElement>("#editorColorLabel")!,
  
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
