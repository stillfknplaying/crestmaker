import type { Lang } from "../i18n";
import type { CrestMode, CropAspect, DitherMode, Preset, PipelineMode } from "../types/types";
import type { ToolState } from "./state";

import { t, tipAttr, helpHtml } from "../i18n";
import { initHelpTooltips } from "../ui/helpTooltips";
import { createCropController, initCropToAspect } from "../ui/crop";
import { initToolUIEvents } from "../ui/events";
import { renderToolView } from "../ui/views/toolView";

import { collectToolRefs, escapeHtml } from "./dom";
import * as actions from "./actions";
import * as settings from "./settings";
import { getGameTemplate } from "./templates";

export type ToolPageDeps = {
  routeRoot: HTMLDivElement;
  state: ToolState;

  // language / routing
  getCurrentLang: () => Lang;
  setLang: (lang: Lang) => void;
  getRenderRoute: () => () => void;

  // mode + aspect
  getCurrentMode: () => CrestMode;
  setCurrentMode: (m: CrestMode) => void;
  setModeStorage: (m: CrestMode) => void;

  getCurrentCropAspect: () => CropAspect;
  setCurrentCropAspect: (a: CropAspect) => void;
  setCropAspectStorage: (a: CropAspect) => void;
  aspectRatio: (a: CropAspect) => number;

  // advanced toggle
  getAdvancedOpen: () => boolean;
  setAdvancedOpen: (v: boolean) => void;
  persistAdvancedOpen: (v: boolean) => void;

  // display/crop
  rebuildDisplayCanvas: () => void;

  // compute
  scheduleRecomputePipeline: () => void;
  recomputePipeline: () => Promise<void>;

  // preview/controller
  renderPreview: () => void;
  drawTrueSizeEmpty: (w: number, h: number) => void;

  // template loading
  loadImageFromUrl: (url: string) => Promise<HTMLImageElement>;

  // file loading
  loadFromFile: (file: File) => Promise<HTMLImageElement>;
  loadFromClipboard: (e: ClipboardEvent) => Promise<HTMLImageElement | null>;
  loadFromDataTransfer: (dt: DataTransfer | null) => Promise<HTMLImageElement | null>;
  loadFromUrlExternal: (url: string) => Promise<HTMLImageElement>;

  // downloads
  hasPalette: () => boolean;
  downloadCurrentMode: () => void;
};

export function createToolPage(deps: ToolPageDeps) {
  const { state, routeRoot } = deps;

  function renderToolPage() {
    // Crop aspect is tied to Mode (no separate selector)
    const currentMode = deps.getCurrentMode();
    const desired: CropAspect = currentMode === "only_clan" ? "16x12" : "24x12";
    if (deps.getCurrentCropAspect() !== desired) {
      deps.setCurrentCropAspect(desired);
      deps.setCropAspectStorage(desired);
      if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, deps.aspectRatio(desired)));
    }

    const trueW = currentMode === "only_clan" ? 16 : 24;
    const trueH = 12;
    const cropLabel = desired === "16x12" ? "4:3" : "2:1";
    const pipeline = settings.getPipeline();
    const pixelPreset = settings.getPixelPreset();
    const templateName = currentMode === "only_clan" ? "l2_nameplate_02.jpg" : "l2_nameplate_01.jpg";

    routeRoot.innerHTML = renderToolView({
      t,
      escapeHtml,
      tipAttr,
      helpHtml,

      currentLang: deps.getCurrentLang(),
      currentMode,
      pipeline,
      pixelPreset,
      advancedOpen: deps.getAdvancedOpen(),

      cropLabel,
      trueW,
      trueH,
      templateName,
    });

    initToolUI();
  }

  function initToolUI() {
    // Help tooltips (desktop hover + mobile tap)
    initHelpTooltips();
    // refs must be available only after tool HTML is rendered
    actions.setRefs(state, collectToolRefs(document));

    // Crop controller
    actions.setCropController(
      state,
      createCropController({
        getRefs: () => state.refs,
        getSourceImage: () => state.sourceImage,
        getDisplayCanvas: () => state.displayCanvas,
        rebuildDisplayCanvas: deps.rebuildDisplayCanvas,
        getCropRect: () => state.cropRect,
        setCropRect: (r) => actions.setCropRect(state, r),
        scheduleRecomputePipeline: deps.scheduleRecomputePipeline,

        getCropDragMode: () => state.cropDragMode,
        setCropDragMode: (m) => actions.setCropDragMode(state, m),
        getDragStart: () => state.dragStart,
        setDragStart: (v) => actions.setDragStart(state, v),
        getDragAnchor: () => state.dragAnchor,
        setDragAnchor: (v) => actions.setDragAnchor(state, v),
      })
    );

    // Pipeline persistence + UI toggles
    state.refs!.pipelineSel.value = settings.getPipeline();

    const applyPresetOptions = (p: PipelineMode) => {
      if (p === "pixel") {
        const px = settings.getPixelPreset();
        state.refs!.presetSel.innerHTML = `
          <option value="pixel-clean" ${px === "pixel-clean" ? "selected" : ""}>Clean</option>
          <option value="pixel-crisp" ${px === "pixel-crisp" ? "selected" : ""}>Crisp</option>
          <option value="pixel-stable" ${px === "pixel-stable" ? "selected" : ""}>Stable</option>
          <option value="pixel-indexed" ${px === "pixel-indexed" ? "selected" : ""}>Indexed</option>
        `;
        state.refs!.presetSel.value = px;
      } else {
        const mp = settings.getModernPreset();
        state.refs!.presetSel.innerHTML = `
          <option value="balanced" ${mp === "balanced" ? "selected" : ""}>${escapeHtml(t("Balanced","Баланс","Баланс"))}</option>
          <option value="simple" ${mp === "simple" ? "selected" : ""}>${escapeHtml(t("Simple","Обычно","Простий"))}</option>
          <option value="complex" ${mp === "complex" ? "selected" : ""}>${escapeHtml(t("Complex","Сложная","Складна"))}</option>
          <option value="legacy" ${mp === "legacy" ? "selected" : ""}>${escapeHtml(t("Legacy","Legacy","Legacy"))}</option>
        `;
        state.refs!.presetSel.value = mp;
      }
    };

    state.refs!.pipelineSel.value = settings.getPipeline();
    applyPresetOptions(state.refs!.pipelineSel.value as PipelineMode);

    let prevPipeline: PipelineMode = state.refs!.pipelineSel.value as PipelineMode;

    // UI events / bindings (src/ui/events.ts)
    initToolUIEvents({
      getRefs: () => state.refs,
      getLangButtonsRoot: () => document,

      // pipeline/presets
      getPrevPipeline: () => prevPipeline,
      setPrevPipeline: (p) => { prevPipeline = p; },

      getPipeline: () => settings.getPipeline(),
      setPipeline: (p) => settings.setPipeline(p),

      getPixelPreset: () => settings.getPixelPreset(),
      setPixelPreset: (p) => settings.setPixelPreset(p),

      getModernPreset: () => settings.getModernPreset(),
      setModernPreset: (p) => settings.setModernPreset(p),

      applyPresetOptions,
      applyPresetDefaults,
      updateControlAvailability,

      // mode/crop
      getCurrentMode: () => deps.getCurrentMode(),
      setCurrentMode: (m) => deps.setCurrentMode(m),
      setModeStorage: (m) => deps.setModeStorage(m),

      getCurrentCropAspect: () => deps.getCurrentCropAspect(),
      setCurrentCropAspect: (a) => deps.setCurrentCropAspect(a),
      setCropAspectStorage: (a) => deps.setCropAspectStorage(a),

      setCropRectNull: () => { actions.setCropRect(state, null); },
      rebuildCropRectToAspect: () => {
        const a = deps.getCurrentCropAspect();
        if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, deps.aspectRatio(a)));
      },
      drawCropUI: () => { state.cropController?.drawCropUI(); },
      initCropEvents: () => { state.cropController?.initCropEvents(); },

      renderRoute: deps.getRenderRoute(),

      // display / preview
      getSourceImage: () => state.sourceImage,
      setSourceImage: (img) => { actions.setSourceImage(state, img); },

      rebuildDisplayCanvas: () => deps.rebuildDisplayCanvas(),

      getInvertColors: () => state.invertColors,
      setInvertColors: (v) => { actions.setInvertColors(state, v); },

      rotateLeft: () => {
        actions.setRotation90(state, (((state.rotation90 + 270) % 360) as any));
        deps.rebuildDisplayCanvas();
        const a = deps.getCurrentCropAspect();
        if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, deps.aspectRatio(a)));
      },
      rotateRight: () => {
        actions.setRotation90(state, (((state.rotation90 + 90) % 360) as any));
        deps.rebuildDisplayCanvas();
        const a = deps.getCurrentCropAspect();
        if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, deps.aspectRatio(a)));
      },

      loadTemplate,

      scheduleRecomputePipeline: deps.scheduleRecomputePipeline,
      recomputePipeline: () => deps.recomputePipeline(),
      renderPreview: deps.renderPreview,

      drawTrueSizeEmpty: deps.drawTrueSizeEmpty,

      // advanced open
      getAdvancedOpen: () => deps.getAdvancedOpen(),
      setAdvancedOpen: (v) => deps.setAdvancedOpen(v),
      persistAdvancedOpen: (v) => deps.persistAdvancedOpen(v),

      // brightness/contrast
      getBrightness: () => settings.getBrightness(),
      setBrightness: (v) => settings.setBrightness(v),
      getContrast: () => settings.getContrast(),
      setContrast: (v) => settings.setContrast(v),

      // language
      setLang: deps.setLang,

      // file loading
      loadFromFile: deps.loadFromFile,
      loadFromClipboard: deps.loadFromClipboard,
      loadFromDataTransfer: deps.loadFromDataTransfer,
      loadFromUrl: (url) => deps.loadFromUrlExternal(url),

      // downloads
      hasPalette: deps.hasPalette,
      downloadCurrentMode: deps.downloadCurrentMode,
    });
  }

  // -------------------- PRESET DEFAULTS --------------------
  function applyPresetDefaults(p: Preset) {
    // `refs` is initialized after render; keep the function safe and TS-happy.
    const r = state.refs;
    if (!r) return;

    // Helper to set Strength slider consistently
    const setStrength = (val: number) => {
      const v = String(Math.max(0, Math.min(100, Math.round(val))));
      r.ditherAmt.value = v;
      r.ditherAmtVal.textContent = v;
    };

    // Defaults that most presets share
    r.oklabChk.checked = true;
    r.cleanupChk.checked = true;

    switch (p) {
      case "legacy":
        r.ditherSel.value = "none";
        setStrength(0);
        r.twoStepChk.checked = false;
        r.centerPaletteChk.checked = false;
        r.oklabChk.checked = false;
        r.noiseDitherChk.checked = false;
        r.edgeSharpenChk.checked = false;
        r.cleanupChk.checked = false;
        break;

      case "simple":
        r.ditherSel.value = "none";
        setStrength(25);
        r.twoStepChk.checked = true;
        r.centerPaletteChk.checked = true;
        r.oklabChk.checked = true;
        r.noiseDitherChk.checked = false;
        r.edgeSharpenChk.checked = true;
        r.cleanupChk.checked = true;
        break;

      case "balanced":
        r.ditherSel.value = "ordered4";
        setStrength(45);
        r.twoStepChk.checked = true;
        r.centerPaletteChk.checked = true; // "Balance colors"
        r.oklabChk.checked = true;
        r.noiseDitherChk.checked = true;
        r.edgeSharpenChk.checked = true;
        r.cleanupChk.checked = true;
        break;

      case "complex":
      default:
        r.ditherSel.value = "floyd";
        setStrength(22);
        r.twoStepChk.checked = true;
        r.centerPaletteChk.checked = false;
        r.oklabChk.checked = true;
        r.noiseDitherChk.checked = false;
        r.edgeSharpenChk.checked = false;
        r.cleanupChk.checked = true;
        break;
    }
  }

  function updateControlAvailability(p: Preset) {
    const r = state.refs;
    if (!r) return;

    const isPixel = (r.pipelineSel.value as PipelineMode) === "pixel";

    // Helper: hide/show whole control rows without changing layout structure elsewhere
    const setRowVisibleByInput = (input: HTMLElement, visible: boolean) => {
      const row =
        input.closest(".adv-opt") ||
        input.closest(".range") ||
        input.closest(".select");
      if (!row) return;
      row.classList.toggle("hidden", !visible);
    };

    const setToggleVisible = (el: HTMLInputElement, visible: boolean, forceOffWhenHidden = true) => {
      setRowVisibleByInput(el, visible);
      if (!visible && forceOffWhenHidden) el.checked = false;
    };

    // -----------------
    // 1) Strength slider: currently observed as non-functional across all presets -> hide entirely
    // -----------------
    const strengthRow = document.getElementById("strengthRow");
    if (strengthRow) strengthRow.classList.add("hidden");
    r.ditherAmt.disabled = true;

    // -----------------
    // 2) Color smoothing options: MUST BE ALWAYS HIDDEN
    // -----------------
    const smoothingRow = document.getElementById("smoothingRow");
    if (smoothingRow) smoothingRow.classList.add("hidden");

    const allowedDithersByPreset: Record<Preset, DitherMode[]> = {
      legacy: ["none", "ordered4", "ordered8", "atkinson", "floyd"],
      simple: ["none"],
      balanced: ["none", "ordered4", "ordered8", "atkinson", "floyd"],
      complex: ["none"],
    };

    const ditherLabel = (v: DitherMode) => {
      switch (v) {
        case "none":
          return t("Off", "Выкл", "Вимк");
        case "ordered4":
          return t("Pattern 4×4", "Шаблон 4×4", "Візерунок 4×4");
        case "ordered8":
          return t("Pattern 8×8", "Шаблон 8×8", "Візерунок 8×8");
        case "atkinson":
          return t("Smooth (Atkinson)", "Плавно (Atkinson)", "Плавно (Atkinson)");
        case "floyd":
          return t("Smooth (Floyd–Steinberg)", "Плавно (Floyd–Steinberg)", "Плавно (Floyd–Steinberg)");
      }
    };

    const allowed = allowedDithersByPreset[p];
    // Rebuild options only if needed (keeps selection stable when possible)
    const current = (r.ditherSel.value as DitherMode) || "none";
    const allowedSafe = allowed ?? ["none"];
    const nextValue: DitherMode = allowedSafe.includes(current) ? current : "none";

    r.ditherSel.innerHTML = allowedSafe
      .map((v) => `<option value="${v}">${escapeHtml(ditherLabel(v))}</option>`)
      .join("");

    r.ditherSel.value = nextValue;

    // If preset supports only Off, keep the dropdown visible but make it non-interactive (no misleading choices)
    r.ditherSel.disabled = allowedSafe.length <= 1;

    // -----------------
    // 3) Advanced toggles: hide those that have no effect in the current preset (based on current implementation)
    // -----------------
    const showSmootherResize = !isPixel;
    const showBalance = !isPixel && p === "balanced";
    const showSubtleNoise = !isPixel && p === "balanced";
    const showSharpen = !isPixel && p !== "legacy";
    const showBetterMatch = false;
    const showCleanup = false;

    // Smoother resize stays visible always
    setToggleVisible(r.twoStepChk, showSmootherResize, false);

    // Hide per-preset controls
    setToggleVisible(r.centerPaletteChk, showBalance);
    setToggleVisible(r.noiseDitherChk, showSubtleNoise);
    setToggleVisible(r.edgeSharpenChk, showSharpen);

    // Dead / disabled globally
    setToggleVisible(r.oklabChk, showBetterMatch);
    setToggleVisible(r.cleanupChk, showCleanup);
  }

  async function loadTemplate() {
    const currentMode = deps.getCurrentMode();
    const tpl = getGameTemplate(currentMode === "only_clan" ? "16x12" : "24x12");

    // Avoid reloading the same template on every render
    if (state.loadedTemplateSrc === tpl.src && state.gameTemplateImg) {
      deps.renderPreview();
      return;
    }

    try {
      actions.setGameTemplateImg(state, await deps.loadImageFromUrl(tpl.src));
      actions.setLoadedTemplateSrc(state, tpl.src);
      deps.renderPreview();
    } catch {
      actions.setGameTemplateImg(state, null);
      actions.setLoadedTemplateSrc(state, null);
      deps.renderPreview();
    }
  }

  return { renderToolPage };
}
