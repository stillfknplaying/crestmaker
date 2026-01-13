import type { ToolRefs } from "../app/dom";
import type { CrestMode, GameTemplate } from "../types/types";

/**
 * Minimal explicit contract between main.ts (state) and ui/preview.ts (render only).
 * Keep this type lean: only what preview.ts actually uses.
 */
export type PreviewDeps = {
  // refs + state getters
  getRefs: () => ToolRefs | null;
  getCurrentMode: () => CrestMode;

  // game template
  getGameTemplate: () => GameTemplate;
  getGameTemplateImg: () => HTMLImageElement | null;

  // processed result state
  getPalette256: () => Uint8Array | null;
  getIconClan16: () => Uint8Array | null;
  getIconCombined24: () => Uint8Array | null;
};
