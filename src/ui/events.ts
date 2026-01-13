/**
 * IMPORTANT: No algorithms/pipeline/crop/preview logic is modified here — only wiring.
 */
import type { Lang } from "../i18n";
import type { Preset, PipelineMode, PixelPreset, CrestMode, CropAspect } from "../types/types";

// These are re-declared minimal union types used by bindings.
// Keep them aligned with main.ts.

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

  debugCard24: HTMLDivElement;
  debugCard16: HTMLDivElement;
  confirmModal: HTMLDivElement;
  confirmYes: HTMLButtonElement;
  confirmNo: HTMLButtonElement;
};

export interface ToolUIEventDeps {
  // refs + state
  getRefs: () => ToolRefs | null;

  getLangButtonsRoot: () => ParentNode; // usually document

  // pipeline/presets
  getPrevPipeline: () => PipelineMode;
  setPrevPipeline: (p: PipelineMode) => void;

  getPipeline: () => PipelineMode;
  setPipeline: (p: PipelineMode) => void;

  getPixelPreset: () => PixelPreset;
  setPixelPreset: (p: PixelPreset) => void;

  getModernPreset: () => Preset;
  setModernPreset: (p: Preset) => void;

  applyPresetOptions: (p: PipelineMode) => void;
  applyPresetDefaults: (p: Preset) => void;
  updateControlAvailability: (p: Preset) => void;

  // mode/crop
  renderRoute: () => void;
  getCurrentMode: () => CrestMode;
  setCurrentMode: (m: CrestMode) => void;

  setModeStorage: (m: CrestMode) => void;

  getCurrentCropAspect: () => CropAspect;
  setCurrentCropAspect: (a: CropAspect) => void;

  setCropAspectStorage: (a: CropAspect) => void;

  setCropRectNull: () => void;
  rebuildCropRectToAspect: () => void;
  drawCropUI: () => void;
  initCropEvents: () => void;

  // display / preview
  getSourceImage: () => HTMLImageElement | null;
  setSourceImage: (img: HTMLImageElement | null) => void;

  rebuildDisplayCanvas: () => void;

  getInvertColors: () => boolean;
  setInvertColors: (v: boolean) => void;

  rotateLeft: () => void;
  rotateRight: () => void;

  loadTemplate: () => void;

  scheduleRecomputePreview: (delay?: number) => void;
  recomputePreview: () => void;
  renderPreview: () => void;

  drawTrueSizeEmpty: (w: number, h: number) => void;

  // advanced-open persistence
  getAdvancedOpen: () => boolean;
  setAdvancedOpen: (v: boolean) => void;
  persistAdvancedOpen: (v: boolean) => void;

  // brightness/contrast persistence
  getBrightness: () => number;
  setBrightness: (v: number) => void;
  getContrast: () => number;
  setContrast: (v: number) => void;

  // language
  setLang: (l: Lang) => void;

  // file loading
  loadImageFromFile: (file: File) => Promise<HTMLImageElement>;

  // downloads
  hasPalette: () => boolean;
  downloadCurrentMode: () => void;
}

/**
 * Binds ALL tool-page events. Call once per tool page render, after refs are assigned.
 */
export function initToolUIEvents(deps: ToolUIEventDeps) {
  const refs = deps.getRefs();
  if (!refs) return;

  const syncPipelineUI = () => {
    const r = deps.getRefs();
    if (!r) return;

    const next = r.pipelineSel.value as PipelineMode;
    const prev = deps.getPrevPipeline();

    // Persist current preset before switching options
    if (prev === "old") {
      const cur = r.presetSel.value as Preset;
      if (cur === "legacy" || cur === "simple" || cur === "balanced" || cur === "complex") {
        deps.setModernPreset(cur);
      }
    } else {
      const cur = r.presetSel.value as PixelPreset;
      if (cur === "pixel-clean" || cur === "pixel-crisp" || cur === "pixel-stable" || cur === "pixel-indexed") {
        deps.setPixelPreset(cur);
      } else {
        deps.setPixelPreset("pixel-clean");
      }
    }

    // Update pipeline storage/state
    deps.setPipeline(next);

    // Choose the preset for the target pipeline.
    if (next === "pixel") {
      const target = prev !== "pixel" ? "pixel-clean" : deps.getPixelPreset();
      deps.setPixelPreset(target);
    } else {
      deps.setModernPreset(deps.getModernPreset());
    }

    // Rebuild preset options for selected pipeline
    deps.applyPresetOptions(next);

    // Hide Modern-only controls when Pixel pipeline is active
    const isPixel = next === "pixel";
    document.querySelectorAll<HTMLElement>(".old-only").forEach((el) => {
      el.classList.toggle("hidden", isPixel);
    });

    // Dither controls are Modern-only
    r.ditherSel.disabled = isPixel;
    r.ditherAmt.disabled = isPixel;
    r.oklabChk.disabled = isPixel;

    // Ensure shown preset is applied
    if (!isPixel) {
      const mp = r.presetSel.value as Preset;
      deps.applyPresetDefaults(mp);
      deps.updateControlAvailability(mp);
    } else {
      deps.updateControlAvailability("balanced");
    }

    deps.setPrevPipeline(next);
  };

  refs.pipelineSel.addEventListener("change", () => {
    syncPipelineUI();
    deps.recomputePreview();
  });
  syncPipelineUI();

  // Language switcher (tool page)
  deps.getLangButtonsRoot()
    .querySelectorAll<HTMLButtonElement>(".toolbar-right button[data-lang]")
    .forEach((btn) => {
      btn.addEventListener("click", () => deps.setLang(btn.dataset.lang as Lang));
    });

  // Mode + crop ratio
  refs.modeSel.addEventListener("change", () => {
    const r = deps.getRefs();
    if (!r) return;

    const nextMode = r.modeSel.value as CrestMode;
    if (nextMode === deps.getCurrentMode()) return;

    deps.setCurrentMode(nextMode);
    deps.setModeStorage(nextMode);

    // Crop aspect is locked to Mode (24×12 for full, 16×12 for clan)
    const desired: CropAspect = nextMode === "only_clan" ? "16x12" : "24x12";
    deps.setCurrentCropAspect(desired);
    deps.setCropAspectStorage(desired);

    // Force immediate crop rect rebuild after re-render
    deps.setCropRectNull();

    deps.renderRoute();
  });

  // Theme
  refs.themeToggle.checked = false;
  refs.themeToggle.addEventListener("change", () => {
    const r = deps.getRefs();
    if (!r) return;
    document.documentElement.setAttribute("data-theme", r.themeToggle.checked ? "light" : "dark");
  });

  // Template load
  deps.loadTemplate();

  // Restore advanced state on render
  refs.advancedPanel.classList.toggle("hidden", !refs.advancedChk.checked);
  refs.debugCard24.classList.toggle("hidden", deps.getCurrentMode() !== "ally_clan");
  refs.debugCard16.classList.toggle("hidden", deps.getCurrentMode() !== "only_clan");
  refs.resetBtn.classList.toggle("hidden", !refs.advancedChk.checked);

  // Advanced toggle
  refs.advancedChk.addEventListener("change", () => {
    const r = deps.getRefs();
    if (!r) return;

    const on = r.advancedChk.checked;
    deps.setAdvancedOpen(on);
    deps.persistAdvancedOpen(on);

    r.advancedPanel.classList.toggle("hidden", !on);
    r.debugCard24.classList.toggle("hidden", deps.getCurrentMode() !== "ally_clan");
    r.debugCard16.classList.toggle("hidden", deps.getCurrentMode() !== "only_clan");
    r.resetBtn.classList.toggle("hidden", !on);

    deps.scheduleRecomputePreview(0);
  });

  // Reset with confirm
  refs.resetBtn.addEventListener("click", () => {
    const r = deps.getRefs();
    if (!r) return;
    r.confirmModal.classList.remove("hidden");
  });
  refs.confirmNo.addEventListener("click", () => deps.getRefs()?.confirmModal.classList.add("hidden"));
  refs.confirmYes.addEventListener("click", () => {
    const r = deps.getRefs();
    if (!r) return;
    r.confirmModal.classList.add("hidden");

    // Reset should also reset Brightness / Contrast
    deps.setBrightness(0);
    deps.setContrast(0);
    r.brightness.value = "0";
    r.brightnessVal.textContent = "0";
    r.contrast.value = "0";
    r.contrastVal.textContent = "0";

    // Reset other advanced defaults only for non-pixel pipeline
    const pipe = r.pipelineSel.value as PipelineMode;
    if (pipe !== "pixel") {
      deps.applyPresetDefaults(r.presetSel.value as Preset);
      deps.updateControlAvailability(r.presetSel.value as Preset);
    } else {
      deps.updateControlAvailability("balanced");
    }

    deps.scheduleRecomputePreview(0);
  });

  // Preset defaults + change
  if ((refs.pipelineSel.value as PipelineMode) !== "pixel") {
    deps.applyPresetDefaults(refs.presetSel.value as Preset);
    deps.updateControlAvailability(refs.presetSel.value as Preset);
  } else {
    deps.updateControlAvailability("balanced");
  }

  refs.presetSel.addEventListener("change", () => {
    const r = deps.getRefs();
    if (!r) return;

    const p = r.pipelineSel.value as PipelineMode;
    if (p === "pixel") {
      deps.setPixelPreset(r.presetSel.value as PixelPreset);
      deps.updateControlAvailability("balanced");
    } else {
      deps.applyPresetDefaults(r.presetSel.value as Preset);
      deps.updateControlAvailability(r.presetSel.value as Preset);
    }
    deps.scheduleRecomputePreview(0);
  });

  // Brightness / Contrast (universal)
  refs.brightness.value = String(deps.getBrightness());
  refs.brightnessVal.textContent = String(deps.getBrightness());
  refs.contrast.value = String(deps.getContrast());
  refs.contrastVal.textContent = String(deps.getContrast());

  refs.brightness.addEventListener("input", () => {
    const r = deps.getRefs();
    if (!r) return;
    const v = Number(r.brightness.value) || 0;
    r.brightnessVal.textContent = String(v);
    deps.setBrightness(v);
    deps.scheduleRecomputePreview(50);
  });

  refs.contrast.addEventListener("input", () => {
    const r = deps.getRefs();
    if (!r) return;
    const v = Number(r.contrast.value) || 0;
    r.contrastVal.textContent = String(v);
    deps.setContrast(v);
    deps.scheduleRecomputePreview(50);
  });

  refs.ditherAmt.addEventListener("input", () => {
    const r = deps.getRefs();
    if (!r) return;
    r.ditherAmtVal.textContent = String(r.ditherAmt.value);
    deps.scheduleRecomputePreview(70);
  });

  // Rotate buttons
  refs.rotL.addEventListener("click", () => {
    if (!deps.getSourceImage()) return;
    deps.rotateLeft();
    deps.drawCropUI();
    deps.scheduleRecomputePreview(0);
  });

  refs.rotR.addEventListener("click", () => {
    if (!deps.getSourceImage()) return;
    deps.rotateRight();
    deps.drawCropUI();
    deps.scheduleRecomputePreview(0);
  });

  // Invert toggle button
  refs.invertBtn.addEventListener("click", () => {
    const next = !deps.getInvertColors();
    deps.setInvertColors(next);
    deps.getRefs()?.invertBtn.classList.toggle("active", next);
    deps.scheduleRecomputePreview(0);
  });

  // File upload
  refs.fileInput.addEventListener("change", async () => {
    const r = deps.getRefs();
    if (!r) return;

    const file = r.fileInput.files?.[0];
    if (!file) return;

    const img = await deps.loadImageFromFile(file);
    deps.setSourceImage(img);

    // Reset per-image transforms
    deps.setInvertColors(false);
    r.invertBtn.classList.remove("active");

    deps.rebuildDisplayCanvas();
    deps.rebuildCropRectToAspect();
    deps.drawCropUI();

    r.resetBtn.disabled = false;
    deps.scheduleRecomputePreview(0);
  });

  // Download
  refs.downloadBtn.addEventListener("click", () => {
    if (!deps.hasPalette()) return;
    deps.downloadCurrentMode();
  });

  // Live recompute for advanced controls
  const live: Array<HTMLElement> = [
    refs.ditherSel,
    refs.twoStepChk,
    refs.centerPaletteChk,
    refs.oklabChk,
    refs.noiseDitherChk,
    refs.edgeSharpenChk,
    refs.cleanupChk,
    refs.useCropChk,
  ];
  for (const el of live) {
    el.addEventListener("change", () => {
      deps.drawCropUI();
      deps.updateControlAvailability(refs.presetSel.value as Preset);
      deps.scheduleRecomputePreview(70);
    });
    el.addEventListener("input", () => {
      deps.drawCropUI();
      deps.scheduleRecomputePreview(70);
    });
  }

  // Crop interactions
  deps.initCropEvents();

  // Initial preview / restore state after re-render
  const trueW = deps.getCurrentMode() === "only_clan" ? 16 : 24;
  const trueH = 12;

  if (deps.getSourceImage()) {
    refs.invertBtn.classList.toggle("active", deps.getInvertColors());
    deps.rebuildDisplayCanvas();
    deps.rebuildCropRectToAspect();
    deps.drawCropUI();

    refs.resetBtn.disabled = false;
    deps.scheduleRecomputePreview(0);
  } else {
    deps.renderPreview();
    deps.drawTrueSizeEmpty(trueW, trueH);
  }
}