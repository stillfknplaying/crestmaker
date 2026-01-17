import type { ToolRefs } from "../app/dom";
import type { PipelineComputeResult } from "../app/pipelineController";
import type { CrestMode, GameTemplate } from "../types/types";

import { initPreview, renderPreview } from "./preview";
import { createResultsRenderer } from "./resultsRender";

export type RenderController = {
  /** Render after pipeline compute (true-size + zoom + preview + download state, etc.) */
  renderAfterCompute: (res: PipelineComputeResult | null) => void;
  /** Trigger game preview re-render using current state */
  renderPreview: () => void;
  /** Draw empty placeholders for true-size canvases */
  drawTrueSizeEmpty: (w: number, h: number) => void;
};

export type RenderControllerDeps = {
  getRefs: () => ToolRefs | null;
  getCurrentMode: () => CrestMode;
  getEditorGrid: () => boolean;

  // Game preview
  getGameTemplate: () => GameTemplate;
  getGameTemplateImg: () => HTMLImageElement | null;

  // Compute outputs used by preview
  getPalette256: () => Uint8Array | null;
  getIconClan16: () => Uint8Array | null;
  getIconCombined24: () => Uint8Array | null;
};

/**
 * Centralizes UI rendering orchestration.
 *
 * - Preview module remains render-only and uses getters from deps.
 * - Results renderer draws true-size + zoom and toggles Download availability.
 */
export function createRenderController(deps: RenderControllerDeps): RenderController {
  // Preview is render-only and pulls state via getters.
  initPreview({
    getRefs: deps.getRefs,
    getCurrentMode: deps.getCurrentMode,
    getGameTemplate: deps.getGameTemplate,
    getGameTemplateImg: deps.getGameTemplateImg,
    getPalette256: deps.getPalette256,
    getIconClan16: deps.getIconClan16,
    getIconCombined24: deps.getIconCombined24,
  });

  const resultsRenderer = createResultsRenderer({
    getRefs: deps.getRefs,
    getCurrentMode: deps.getCurrentMode,
    renderPreview,
    getEditorGrid: deps.getEditorGrid,
  });

  return {
    renderAfterCompute: (res) => resultsRenderer.render(res),
    renderPreview: () => renderPreview(),
    drawTrueSizeEmpty: (w, h) => resultsRenderer.drawTrueSizeEmpty(w, h),
  };
}
