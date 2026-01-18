import { createPipelineEngine } from "../engineFactory";
import type { PipelineEngine } from "../../engines/engine";

type CreateEngineDeps = {
  renderToSize: (...args: any[]) => any;
  edgeAwareSharpen: (...args: any[]) => any;
  softNormalizeLevels: (...args: any[]) => any;
  clamp255: (x: number) => number;
  clampDitherStrength: (...args: any[]) => any;
  quantizeTo256: (...args: any[]) => any;
  quantizePixel256: (...args: any[]) => any;
  cleanupIndicesMajoritySafe: (...args: any[]) => any;
};

/**
 * Creates a pipeline engine and binds lifecycle cleanup.
 * Worker engines can allocate resources and should be terminated on page unload.
 */
export function createEngineWithLifecycle(deps: CreateEngineDeps): PipelineEngine {
  const engine = createPipelineEngine({
    renderToSize: deps.renderToSize,
    edgeAwareSharpen: deps.edgeAwareSharpen,
    softNormalizeLevels: deps.softNormalizeLevels,
    clamp255: deps.clamp255,
    clampDitherStrength: deps.clampDitherStrength,
    quantizeTo256: deps.quantizeTo256,
    quantizePixel256: deps.quantizePixel256,
    cleanupIndicesMajoritySafe: deps.cleanupIndicesMajoritySafe,
  });

  window.addEventListener("beforeunload", () => {
    try {
      engine.terminate?.();
    } catch {
      // ignore
    }
  });

  return engine;
}
