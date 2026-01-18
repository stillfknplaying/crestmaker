import type { CrestMode } from "../../types/types";
import type { ToolState } from "../state";
import type { PipelineEngine, PipelineSettings } from "../../engines/engine";
import { initPipelineController, type PipelineComputeResult } from "../pipelineController";

type InitPipelineDeps = {
  engine: PipelineEngine;
  state: ToolState;
  getCurrentMode: () => CrestMode;
  getSettings: () => PipelineSettings | null;
  getCroppedSource: () => HTMLCanvasElement | null;
  setPalette256: (p: Uint8Array | null) => void;
  setIconAlly8: (v: Uint8Array | null) => void;
  setIconClan16: (v: Uint8Array | null) => void;
  setIconCombined24: (v: Uint8Array | null) => void;
  afterCompute: (res: PipelineComputeResult | null) => void;
};

/**
 * Wires compute pipeline controller with state setters and render callback.
 * Keeps createApp() focused on composition, not on controller plumbing.
 */
export function initComputePipeline(deps: InitPipelineDeps) {
  initPipelineController({
    engine: deps.engine,
    getSettings: deps.getSettings,
    getCroppedSource: deps.getCroppedSource,

    setPalette256: deps.setPalette256,
    setIconAlly8: deps.setIconAlly8,
    setIconClan16: deps.setIconClan16,
    setIconCombined24: deps.setIconCombined24,

    afterCompute: deps.afterCompute,
  });
}
