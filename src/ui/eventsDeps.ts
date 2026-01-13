import type { ToolRefs } from "../app/dom";
import type { Lang } from "../i18n";
import type { CropAspect, CrestMode, PipelineMode, PixelPreset, Preset } from "../types/types";

/**
 * Minimal explicit contract between main.ts (state + helpers) and ui/events.ts (DOM bindings).
 */
export type EventsDeps = {
  // refs
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

  // route/mode/crop
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

  scheduleRecomputePipeline: (delay?: number) => void;
  recomputePipeline: () => void;
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
};
