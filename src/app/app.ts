import { renderToSize, edgeAwareSharpen, softNormalizeLevels, clampDitherStrength, quantizeTo256 } from "../pipeline/modern";
import { cleanupIndicesMajoritySafe, quantizePixel256 } from "../pipeline/pixel";
import { initPolicyLangEvents } from "./policyEvents";
import { privacyPolicyHtml } from "../content/privacy";
import { termsHtml } from "../content/terms";
import { gdprHtml } from "../content/gdpr";
import { aboutHtml } from "../content/about";
import { faqHtml } from "../content/faq";
import type { Lang } from "../i18n";
import { currentLang, setLang as setLangCore, t } from "../i18n";
import { downloadCurrentMode as downloadCurrentModeFromState, hasPalette as hasPaletteFromState } from "./downloads";
import { initCookieConsentUI, renderCookieBannerIfNeeded, localizeCookieUI } from "../ui/cookieConsent";
import { initDisplayCanvas, rebuildDisplayCanvas } from "../ui/displayCanvas";
import { createRenderController } from "../ui/renderController";
import { escapeHtml } from "./dom";
import { initRoutes } from "./routes";
import { createInitialState } from "./state";
import * as actions from "./actions";
import { initPipelineController, scheduleRecomputePipeline, recomputePipeline } from "./pipelineController";
import { createPipelineEngine } from "./engineFactory";
import * as settings from "./settings";
import { loadImageFromClipboardEvent, loadImageFromDataTransfer, loadImageFromFile, loadImageFromUrl as loadExternalImageFromUrl } from "./fileLoader";
import type { CrestMode, CropAspect } from "../types/types";
import { getGameTemplate } from "./templates";
import { renderShell } from "./shell";
import { createToolPage } from "./toolPage";

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

  const { routeRoot } = renderShell(app);

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
    renderToolPage: () => toolPage.renderToolPage(),
  });

  // expose route renderer to the rest of the app
  renderRouteFn = router.renderRoute;

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

  const engine = createPipelineEngine({
    renderToSize,
    edgeAwareSharpen,
    softNormalizeLevels,
    clamp255,
    clampDitherStrength,
    quantizeTo256,
    quantizePixel256,
    cleanupIndicesMajoritySafe,
  });

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

  const toolPage = createToolPage({
    routeRoot,
    state,

    // language / routing
    getCurrentLang: () => currentLang,
    setLang,
    getRenderRoute: () => renderRouteFn,

    // mode + aspect
    getCurrentMode: () => currentMode,
    setCurrentMode: (m) => { currentMode = m; },
    setModeStorage: (m) => settings.setMode(m),

    getCurrentCropAspect: () => currentCropAspect,
    setCurrentCropAspect: (a) => { currentCropAspect = a; },
    setCropAspectStorage: (a) => settings.setCropAspect(a),
    aspectRatio,

    // advanced toggle
    getAdvancedOpen: () => advancedOpen,
    setAdvancedOpen: (v) => { advancedOpen = v; },
    persistAdvancedOpen: (v) => settings.setAdvancedOpen(v),

    // display/crop
    rebuildDisplayCanvas,

    // compute
    scheduleRecomputePipeline,
    recomputePipeline: async () => { await recomputePipeline(); },

    // preview/controller
    renderPreview: () => renderController.renderPreview(),
    drawTrueSizeEmpty: (w, h) => renderController.drawTrueSizeEmpty(w, h),

    // template loading
    loadImageFromUrl: (url) => loadExternalImageFromUrl(url),

    // file loading
    loadFromFile: loadImageFromFile,
    loadFromClipboard: loadImageFromClipboardEvent,
    loadFromDataTransfer: loadImageFromDataTransfer,
    loadFromUrlExternal: (url) => loadExternalImageFromUrl(url),

    // downloads
    hasPalette: () => hasPaletteFromState(state),
    downloadCurrentMode: () => downloadCurrentModeFromState(state, currentMode),
  });

  // -------------------- SMALL UTIL --------------------
  function clamp255(x: number): number { return x < 0 ? 0 : x > 255 ? 255 : x; }

  function boot() {
    // one-time init that does not depend on tool page being rendered
    initCookieConsentUI();
  }
  return { boot, renderRoute: renderRouteFn };
}
