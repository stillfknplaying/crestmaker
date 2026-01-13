import type { ToolRefs } from "../app/dom";
import type {
  CrestMode,
  DitherMode,
  GameTemplate,
  PixelPreset,
  Preset,
} from "../types/types";

/**
 * Minimal explicit contract between main.ts (state + algorithms) and ui/preview.ts (render + recompute).
 * Keep this type lean: only what preview.ts actually uses.
 */
export type PreviewDeps = {
  // refs + state getters
  getRefs: () => ToolRefs | null;
  getSourceImage: () => HTMLImageElement | null;
  getCurrentMode: () => CrestMode;
  getInvertColors: () => boolean;

  // game template
  getGameTemplate: () => GameTemplate;
  getGameTemplateImg: () => HTMLImageElement | null;

  // processed result state
  getPalette256: () => Uint8Array | null;
  setPalette256: (p: Uint8Array | null) => void;

  getIconAlly8: () => Uint8Array | null;
  setIconAlly8: (v: Uint8Array | null) => void;

  getIconClan16: () => Uint8Array | null;
  setIconClan16: (v: Uint8Array | null) => void;

  getIconCombined24: () => Uint8Array | null;
  setIconCombined24: (v: Uint8Array | null) => void;

  // options / helpers
  getPixelPreset: () => PixelPreset;
  getBrightness: () => number;
  getContrast: () => number;
  clamp255: (v: number) => number;

  // crop access
  getCroppedSource: () => HTMLCanvasElement | null;

  // image ops
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

  cleanupIndicesMajoritySafe: (
    indices: Uint8Array,
    w: number,
    h: number,
    palette: Uint8Array,
    passes: number,
    minMaj: number,
    maxJump: number
  ) => void;

  // drawing
  drawTrueSizeEmpty: (w: number, h: number) => void;
  drawTrueSize: (indices: Uint8Array, palette: Uint8Array, w: number, h: number) => void;
  drawZoomTo: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    indices: Uint8Array,
    palette: Uint8Array,
    w: number,
    h: number
  ) => void;

  // download toggle
  setCanDownload: (can: boolean) => void;
};
