import { renderToSize, edgeAwareSharpen, softNormalizeLevels, clampDitherStrength, quantizeTo256 } from "../pipeline/modern";
import { cleanupIndicesMajoritySafe, quantizePixel256 } from "../pipeline/pixel";
import { initPolicyLangEvents } from "./policyEvents";
import { privacyPolicyHtml } from "../content/privacy";
import { termsHtml } from "../content/terms";
import { gdprHtml } from "../content/gdpr";
import { aboutHtml } from "../content/about";
import { faqHtml } from "../content/faq";
import type { Lang } from "../i18n";
import { currentLang, setLang as setLangCore, t, tipAttr, helpHtml } from "../i18n";
import { downloadCurrentMode as downloadCurrentModeFromState, hasPalette as hasPaletteFromState } from "./downloads";
import { initCookieConsentUI, renderCookieBannerIfNeeded, localizeCookieUI } from "../ui/cookieConsent";
import { initHelpTooltips } from "../ui/helpTooltips";
import { createCropController, initCropToAspect } from "../ui/crop";
import { initDisplayCanvas, rebuildDisplayCanvas } from "../ui/displayCanvas";
import { createRenderController } from "../ui/renderController";
import { initToolUIEvents } from "../ui/events";
import { renderToolView } from "../ui/views/toolView";
import { collectToolRefs, escapeHtml } from "./dom";
import { initRoutes } from "./routes";
import { createInitialState } from "./state";
import * as actions from "./actions";
import { initPipelineController, scheduleRecomputePipeline, recomputePipeline } from "./pipelineController";
import { LocalPipelineEngine } from "./pipeline/localEngine";
import { WorkerPipelineEngine } from "./pipeline/workerEngine";
import * as settings from "./settings";
import { loadImageFromClipboardEvent, loadImageFromDataTransfer, loadImageFromFile, loadImageFromUrl as loadExternalImageFromUrl } from "./fileLoader";
import type { DitherMode, Preset, PipelineMode, CrestMode, CropAspect } from "../types/types";
import { SITE_NAME } from "./constants";
import { getGameTemplate } from "./templates";

export function createApp() {


  // Persisted UI settings
  let advancedOpen = settings.getAdvancedOpen();
  function aspectRatio(a: CropAspect): number {
    return a === "16x12" ? (16 / 12) : 2;
  }

  let currentMode: CrestMode = settings.getMode();
  let currentCropAspect: CropAspect = settings.getCropAspect();

  document.documentElement.setAttribute("data-theme", "dark");

  const app = document.querySelector<HTMLDivElement>("#app")!;

  app.innerHTML = `
    <div class="wrap">
      <header class="header">
        <div class="brand">
          <h1>${SITE_NAME}</h1>
          <p class="muted hidden">BMP 8-bit (256-color) emblem converter — 24×12 (ally 8×12 + clan 16×12).</p>
        </div>

        <div class="top-actions">
          <label class="toggle compact" title="Switch theme">
            <span>Dark</span>
            <input id="themeToggle" type="checkbox" />
            <span class="track"><span class="thumb"></span></span>
            <span>Light</span>
          </label>
        </div>
      </header>

      <main id="routeRoot"></main>

      <footer class="footer">
        <nav class="footer-links">
          <a href="#/">Tool</a>
          <a href="#/about">About</a>
          <a href="#/faq">FAQ</a>
          <a href="#/privacy">Privacy Policy</a>
          <a href="#/terms">Terms of Service</a>
          <a href="#/gdpr">GDPR</a>
          <a href="#" id="cookieSettingsLink">Cookies</a>
        </nav>

          <div class="footer-contact">
           Contact:
            <a href="mailto:admin@crestmaker.org">admin@crestmaker.org</a>
           </div>

        <div class="footer-copy">
          <span id="year"></span> © ${SITE_NAME}. All rights reserved.
        </div>
      </footer>

      <div id="cookieRoot"></div>

      <div id="cookieModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle">
        <div class="modal-card">
          <h3 id="cookieModalTitle">Cookie preferences</h3>
          <p class="muted" id="cookieModalDesc"></p>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            <label class="toggle" style="justify-content:space-between;">
              <span><b id="cookieEssentialTitle">Essential</b><br/><span class="muted" id="cookieEssentialDesc"></span></span>
              <span style="display:flex; gap:8px; align-items:center;">
                <span class="muted" id="cookieEssentialAlways">Always on</span>
                <input id="cookieEssential" type="checkbox" checked disabled />
                <span class="track"><span class="thumb"></span></span>
              </span>
            </label>

            <label class="toggle" style="justify-content:space-between;">
              <span><b id="cookieAnalyticsTitle">Analytics</b><br/><span class="muted" id="cookieAnalyticsDesc"></span></span>
              <input id="cookieAnalytics" type="checkbox" />
              <span class="track"><span class="thumb"></span></span>
            </label>

            <label class="toggle" style="justify-content:space-between;">
              <span><b id="cookieAdsTitle">Advertising</b><br/><span class="muted" id="cookieAdsDesc"></span></span>
              <input id="cookieAds" type="checkbox" />
              <span class="track"><span class="thumb"></span></span>
            </label>
          </div>

          <div class="modal-actions">
            <button id="cookieCancel" class="btn">Cancel</button>
            <button id="cookieSave" class="btn primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const yearEl = document.querySelector<HTMLSpanElement>("#year")!;
  yearEl.textContent = String(new Date().getFullYear());

  // Centralized runtime state (keeps main.ts glue-only as we refactor)
  const state = createInitialState();

  // -------------------- I18N (EN/RU/UA) --------------------
  let renderRouteFn: () => void = () => {}; // будет назначено после initRoutes()

  function setLang(lang: Lang) {
    // Preserve advanced toggle state across language switches
    if (state.refs?.advancedChk) {
      advancedOpen = state.refs.advancedChk.checked;
      settings.setAdvancedOpen(advancedOpen);
    }

    setLangCore(lang);

    // rerender current route
    renderRouteFn();

    // re-render cookie banner text if visible
    renderCookieBannerIfNeeded();
    localizeCookieUI();
  }

  // -------------------- ROUTES --------------------
  const routeRoot = document.querySelector<HTMLDivElement>("#routeRoot")!;

  // policy page language buttons (delegated)
  initPolicyLangEvents({ routeRoot, setLang });

  // init router (single source of truth)
  const router = initRoutes({
    routeRoot,
    getLang: () => currentLang,
    t,
    escapeHtml,
    pages: {
      privacy: privacyPolicyHtml,
      terms: termsHtml,
      about: aboutHtml,
      gdpr: gdprHtml,
      faq: faqHtml,
    },
    renderToolPage,
  });

  // expose route renderer to the rest of the app
  renderRouteFn = router.renderRoute;

  function renderToolPage() {
    // Crop aspect is tied to Mode (no separate selector)
    const desired: CropAspect = currentMode === "only_clan" ? "16x12" : "24x12";
    if (currentCropAspect !== desired) {
      currentCropAspect = desired;
      settings.setCropAspect(currentCropAspect);
      if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, aspectRatio(currentCropAspect)));
    }
    const trueW = currentMode === "only_clan" ? 16 : 24;
    const trueH = 12;
    const cropLabel = currentCropAspect === "16x12" ? "4:3" : "2:1";
    const pipeline = settings.getPipeline();
    const pixelPreset = settings.getPixelPreset();
    const templateName = currentMode === "only_clan" ? "l2_nameplate_02.jpg" : "l2_nameplate_01.jpg";

    routeRoot.innerHTML = renderToolView({
      t,
      escapeHtml,
      tipAttr,
      helpHtml,

      currentLang,
      currentMode,
      pipeline,
      pixelPreset,
      advancedOpen,

      cropLabel,
      trueW,
      trueH,
      templateName,
    });

    initToolUI();
  }

  // -------------------- TOOL UI + STATE --------------------
  initDisplayCanvas({
    getSourceImage: () => state.sourceImage,
    getRotation90: () => state.rotation90,
    getDisplayCanvas: () => state.displayCanvas,
    setDisplayCanvas: (c) => actions.setDisplayCanvas(state, c),
  });

  const renderController = createRenderController({
    getRefs: () => state.refs,
    getCurrentMode: () => currentMode,

    getGameTemplate: () => getGameTemplate(currentMode === "only_clan" ? "16x12" : "24x12"),
    getGameTemplateImg: () => state.gameTemplateImg,

    getPalette256: () => state.palette256,
    getIconClan16: () => state.iconClan16x12Indexed,
    getIconCombined24: () => state.iconCombined24x12Indexed,
  });

  // Pipeline engine selection:
  // - prefer Web Worker to keep UI responsive
  // - fallback to local main-thread engine if unsupported
  const engine = (() => {
    try {
      const canWorker = typeof Worker !== "undefined";
      const canOffscreen = typeof (globalThis as any).OffscreenCanvas !== "undefined";
      const canBitmap = typeof createImageBitmap !== "undefined";
      if (canWorker && canOffscreen && canBitmap) return new WorkerPipelineEngine();
    } catch {
      // ignore and fallback
    }

    return new LocalPipelineEngine({
      renderToSize,
      edgeAwareSharpen,
      softNormalizeLevels,
      clamp255,
      clampDitherStrength,
      quantizeTo256,
      quantizePixel256,
      cleanupIndicesMajoritySafe,
    });
  })();

  // Compute pipeline controller (separates compute from render)
  initPipelineController({
    getRefs: () => state.refs,

    engine,

    getSourceImage: () => state.sourceImage,
    getCurrentMode: () => currentMode,
    getInvertColors: () => state.invertColors,

    getPixelPreset: () => settings.getPixelPreset(),
    getBrightness: () => settings.getBrightness(),
    getContrast: () => settings.getContrast(),

    getCroppedSource: () => state.cropController?.getCroppedSource() ?? null,

    setPalette256: (p) => actions.setPalette256(state, p),
    setIconAlly8: (v) => actions.setIconAlly8(state, v),
    setIconClan16: (v) => actions.setIconClan16(state, v),
    setIconCombined24: (v) => actions.setIconCombined24(state, v),

    afterCompute: (res) => renderController.renderAfterCompute(res),
  });

  function initToolUI() {

    // Help tooltips (desktop hover + mobile tap)
    initHelpTooltips();
    // refs must be available only after tool HTML is rendered
    actions.setRefs(state, collectToolRefs(document));

    // Crop controller (moved to src/ui/crop.ts)
    actions.setCropController(
      state,
      createCropController({
        getRefs: () => state.refs,
        getSourceImage: () => state.sourceImage,
        getDisplayCanvas: () => state.displayCanvas,
        rebuildDisplayCanvas,
        getCropRect: () => state.cropRect,
        setCropRect: (r) => actions.setCropRect(state, r),
        scheduleRecomputePipeline,

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


    // UI events / bindings (extracted to src/ui/events.ts)
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
      getCurrentMode: () => currentMode,
      setCurrentMode: (m) => { currentMode = m; },
      setModeStorage: (m) => settings.setMode(m),

      getCurrentCropAspect: () => currentCropAspect,
      setCurrentCropAspect: (a) => { currentCropAspect = a; },
      setCropAspectStorage: (a) => settings.setCropAspect(a),

      setCropRectNull: () => { actions.setCropRect(state, null); },
      rebuildCropRectToAspect: () => {
        if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, aspectRatio(currentCropAspect)));
      },
      drawCropUI: () => { state.cropController?.drawCropUI(); },
      initCropEvents: () => { state.cropController?.initCropEvents(); },

      renderRoute: renderRouteFn,

      // display / preview
      getSourceImage: () => state.sourceImage,
      setSourceImage: (img) => { actions.setSourceImage(state, img); },

      rebuildDisplayCanvas: () => rebuildDisplayCanvas(),

      getInvertColors: () => state.invertColors,
      setInvertColors: (v) => { actions.setInvertColors(state, v); },

      rotateLeft: () => {
        actions.setRotation90(state, (((state.rotation90 + 270) % 360) as any));
        rebuildDisplayCanvas();
        if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, aspectRatio(currentCropAspect)));
      },
      rotateRight: () => {
        actions.setRotation90(state, (((state.rotation90 + 90) % 360) as any));
        rebuildDisplayCanvas();
        if (state.displayCanvas) actions.setCropRect(state, initCropToAspect(state.displayCanvas, aspectRatio(currentCropAspect)));
      },

      loadTemplate,

      scheduleRecomputePipeline,
      recomputePipeline: () => { void recomputePipeline(); },
      renderPreview: renderController.renderPreview,

      drawTrueSizeEmpty: renderController.drawTrueSizeEmpty,

      // advanced open
      getAdvancedOpen: () => advancedOpen,
      setAdvancedOpen: (v) => { advancedOpen = v; },
      persistAdvancedOpen: (v) => settings.setAdvancedOpen(v),

      // brightness/contrast
      getBrightness: () => settings.getBrightness(),
      setBrightness: (v) => settings.setBrightness(v),
      getContrast: () => settings.getContrast(),
      setContrast: (v) => settings.setContrast(v),

      // language
      setLang,

      // file loading
      loadFromFile: loadImageFromFile,
      loadFromClipboard: loadImageFromClipboardEvent,
      loadFromDataTransfer: loadImageFromDataTransfer,
      loadFromUrl: (url) => loadExternalImageFromUrl(url),

      // downloads
      hasPalette: () => hasPaletteFromState(state),
      downloadCurrentMode: () => downloadCurrentModeFromState(state, currentMode),
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
    // Your observed behavior matrix:
    // - Legacy: only Smoother resize affects output (color smoothing selection itself affects output)
    // - Simple: Smoother resize + Sharpen edges
    // - Balanced: Smoother resize + Balance colors + Subtle noise + Sharpen edges + Strength (but Strength is globally hidden for now)
    // - Complex: Smoother resize + Sharpen edges
    //
    // Global dead / not wired:
    // - Better color match (OKLab) -> hide everywhere
    // - Cleanup pixels -> hide everywhere (currently no visible impact)
    // In Pixel conversion these controls must be completely hidden and must not re-appear
    // when switching Pixel presets.
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
    const tpl = getGameTemplate(currentMode === "only_clan" ? "16x12" : "24x12");

    // Avoid reloading the same template on every render
    if (state.loadedTemplateSrc === tpl.src && state.gameTemplateImg) {
      renderController.renderPreview();
      return;
    }

    try {
      actions.setGameTemplateImg(state, await loadExternalImageFromUrl(tpl.src));
      actions.setLoadedTemplateSrc(state, tpl.src);
      renderController.renderPreview();
    } catch {
      actions.setGameTemplateImg(state, null);
      actions.setLoadedTemplateSrc(state, null);
      renderController.renderPreview();
    }
  }

  // -------------------- SMALL UTIL --------------------
  function clamp255(x: number): number { return x < 0 ? 0 : x > 255 ? 255 : x; }

  function boot() {
    // one-time init that does not depend on tool page being rendered
    initCookieConsentUI();
  }
  return { boot, renderRoute: renderRouteFn };
}
