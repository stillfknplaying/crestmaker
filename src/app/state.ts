import type { ToolRefs } from "./dom";
import type { CropRect, CropDragMode } from "../types/types";
import type { CropController } from "../ui/crop";

export type ToolState = {
  // DOM
  refs: ToolRefs | null;

  // Controllers
  cropController: CropController | null;

  // Images + view
  sourceImage: HTMLImageElement | null;
  displayCanvas: HTMLCanvasElement | null; // rotated view
  rotation90: 0 | 90 | 180 | 270;
  invertColors: boolean;

  // Crop state
  cropRect: CropRect | null;
  cropDragMode: CropDragMode;
  dragStart: { mx: number; my: number; x: number; y: number };
  dragAnchor: { ax: number; ay: number; start: { x: number; y: number; w: number; h: number } };

  // Result buffers
  iconCombined24x12Indexed: Uint8Array | null;
  iconClan16x12Indexed: Uint8Array | null;
  iconAlly8x12Indexed: Uint8Array | null;
  palette256: Uint8Array | null;

  // Game preview template cache
  gameTemplateImg: HTMLImageElement | null;
  loadedTemplateSrc: string | null;

  // Editor-only view options
  editorGrid: boolean;

  // Guards
  suspendRecompute: boolean; // used during i18n re-render to avoid wiping editor progress
};

export function createInitialState(): ToolState {
  return {
    refs: null,
    cropController: null,

    sourceImage: null,
    displayCanvas: null,
    rotation90: 0,
    invertColors: false,

    cropRect: null,
    cropDragMode: "none",
    dragStart: { mx: 0, my: 0, x: 0, y: 0 },
    dragAnchor: { ax: 0, ay: 0, start: { x: 0, y: 0, w: 0, h: 0 } },

    iconCombined24x12Indexed: null,
    iconClan16x12Indexed: null,
    iconAlly8x12Indexed: null,
    palette256: null,

    gameTemplateImg: null,
    loadedTemplateSrc: null,

    editorGrid: false,

    suspendRecompute: false,
  };
}
