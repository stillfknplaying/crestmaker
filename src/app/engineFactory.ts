import type { PipelineEngine } from "./pipeline/engine";
import { LocalPipelineEngine } from "./pipeline/localEngine";
import { WorkerPipelineEngine } from "./pipeline/workerEngine";

export type EngineFactoryDeps = ConstructorParameters<typeof LocalPipelineEngine>[0];

/**
 * Pipeline engine selection:
 * - prefer Web Worker to keep UI responsive
 * - fallback to local main-thread engine if unsupported
 *
 * NOTE: this is *selection only* (no behavior changes).
 */
export function createPipelineEngine(deps: EngineFactoryDeps): PipelineEngine {
  try {
    const canWorker = typeof Worker !== "undefined";
    const canOffscreen = typeof (globalThis as any).OffscreenCanvas !== "undefined";
    const canBitmap = typeof createImageBitmap !== "undefined";
    if (canWorker && canOffscreen && canBitmap) return new WorkerPipelineEngine();
  } catch {
    // ignore and fallback
  }

  return new LocalPipelineEngine(deps);
}
