import type { ToolRefs } from "../app/dom";
import type { CropRect, CropDragMode } from "../types/types";

/**
 * Explicit contract for crop controller.
 */
export type CropDeps = {
  getRefs: () => ToolRefs | null;
  getSourceImage: () => HTMLImageElement | null;
  getDisplayCanvas: () => HTMLCanvasElement | null;
  rebuildDisplayCanvas: () => void;
  getCropRect: () => CropRect | null;
  setCropRect: (r: CropRect | null) => void;
  scheduleRecomputePipeline: () => void;

  getCropDragMode: () => CropDragMode;
  setCropDragMode: (m: CropDragMode) => void;
  getDragStart: () => { mx: number; my: number; x: number; y: number };
  setDragStart: (v: { mx: number; my: number; x: number; y: number }) => void;
  getDragAnchor: () => { ax: number; ay: number; start: CropRect };
  setDragAnchor: (v: { ax: number; ay: number; start: CropRect }) => void;
};
