/**
 * IMPORTANT: No algorithms/pipeline/crop/preview logic is modified here — only wiring.
 */

import type { Lang } from "../i18n";
import type { PipelineMode, PixelPreset, Preset, CropAspect, CrestMode } from "../types/types";
import type { EventsDeps } from "./eventsDeps";

// Document-level listeners (paste / drag&drop) must be bound once.
// We keep a pointer to the latest deps (set on every tool page render).
let activeDeps: EventsDeps | null = null;
let globalsBound = false;

function applyLoadedImageWithActiveDeps(img: HTMLImageElement) {
  const deps = activeDeps;
  if (!deps) return;
  const r = deps.getRefs();
  if (!r) return;

  deps.setSourceImage(img);

  // Reset per-image transforms
  deps.setInvertColors(false);
  r.invertBtn.classList.remove("active");

  deps.rebuildDisplayCanvas();
  deps.rebuildCropRectToAspect();
  deps.drawCropUI();

  r.resetBtn.disabled = false;
  deps.scheduleRecomputePipeline(0);
}

function bindGlobalFileListenersOnce() {
  if (globalsBound) return;
  globalsBound = true;

  // Paste image from clipboard (Ctrl+V)
  document.addEventListener("paste", async (e) => {
    if (!activeDeps || !activeDeps.getRefs()) return;
    const img = await activeDeps.loadFromClipboard(e);
    if (!img) return;
    e.preventDefault();
    applyLoadedImageWithActiveDeps(img);
  });

  // Drag & Drop image file (anywhere on the page)
  document.addEventListener("dragover", (e) => {
    if (!activeDeps || !activeDeps.getRefs()) return;
    e.preventDefault();
  });
  document.addEventListener("drop", async (e) => {
    if (!activeDeps || !activeDeps.getRefs()) return;
    e.preventDefault();
    const img = await activeDeps.loadFromDataTransfer(e.dataTransfer);
    if (!img) return;
    applyLoadedImageWithActiveDeps(img);
  });
}

/**
 * Binds ALL tool-page events. Call once per tool page render, after refs are assigned.
 */
export function initToolUIEvents(deps: EventsDeps) {
  activeDeps = deps;
  bindGlobalFileListenersOnce();
  const refs = deps.getRefs();
  if (!refs) return;

  const applyLoadedImage = (img: HTMLImageElement) => applyLoadedImageWithActiveDeps(img);

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
    deps.recomputePipeline();
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

    deps.scheduleRecomputePipeline(0);
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

    deps.scheduleRecomputePipeline(0);
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
    deps.scheduleRecomputePipeline(0);
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
    deps.scheduleRecomputePipeline(50);
  });

  refs.contrast.addEventListener("input", () => {
    const r = deps.getRefs();
    if (!r) return;
    const v = Number(r.contrast.value) || 0;
    r.contrastVal.textContent = String(v);
    deps.setContrast(v);
    deps.scheduleRecomputePipeline(50);
  });

  refs.ditherAmt.addEventListener("input", () => {
    const r = deps.getRefs();
    if (!r) return;
    r.ditherAmtVal.textContent = String(r.ditherAmt.value);
    deps.scheduleRecomputePipeline(70);
  });

  // Rotate buttons
  refs.rotL.addEventListener("click", () => {
    if (!deps.getSourceImage()) return;
    deps.rotateLeft();
    deps.drawCropUI();
    deps.scheduleRecomputePipeline(0);
  });

  refs.rotR.addEventListener("click", () => {
    if (!deps.getSourceImage()) return;
    deps.rotateRight();
    deps.drawCropUI();
    deps.scheduleRecomputePipeline(0);
  });

  // Invert toggle button
  refs.invertBtn.addEventListener("click", () => {
    const next = !deps.getInvertColors();
    deps.setInvertColors(next);
    deps.getRefs()?.invertBtn.classList.toggle("active", next);
    deps.scheduleRecomputePipeline(0);
  });

  // File upload
  refs.fileInput.addEventListener("change", async () => {
    const r = deps.getRefs();
    if (!r) return;

    const file = r.fileInput.files?.[0];
    if (!file) return;

    const img = await deps.loadFromFile(file);
    applyLoadedImage(img);
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
      deps.scheduleRecomputePipeline(70);
    });
    el.addEventListener("input", () => {
      deps.drawCropUI();
      deps.scheduleRecomputePipeline(70);
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
    deps.scheduleRecomputePipeline(0);
  } else {
    deps.renderPreview();
    deps.drawTrueSizeEmpty(trueW, trueH);
  }
}