import type { PipelineEngine } from "../engines/engine";
import { LocalPipelineEngine } from "../engines/localEngine";
import { WorkerPipelineEngine } from "../engines/workerEngine";

export type EngineFactoryDeps = ConstructorParameters<typeof LocalPipelineEngine>[0];

/**
 * Pipeline engine selection:
 * - default to local main-thread engine (deterministic baseline)
 * - optional Worker engine can be enabled via a hidden beta flag
 * - fallback to local main-thread engine if unsupported
 *
 * NOTE: this is *selection only* (no behavior changes).
 */
export function createPipelineEngine(deps: EngineFactoryDeps): PipelineEngine {
  try {
    const useWorkerBeta = (() => {
      try {
        // Hidden flag for testing/debugging.
        // - localStorage: cm_use_worker_beta = "1" | "true"
        // - query param: ?worker=1
        const qs = new URLSearchParams(window.location.search);
        if (qs.get("worker") === "1") return true;
        const v = window.localStorage?.getItem("cm_use_worker_beta") || "";
        return v === "1" || v.toLowerCase() === "true";
      } catch {
        return false;
      }
    })();

    const canWorker = typeof Worker !== "undefined";
    const canOffscreen = typeof (globalThis as any).OffscreenCanvas !== "undefined";
    const canBitmap = typeof createImageBitmap !== "undefined";
    if (useWorkerBeta && canWorker && canOffscreen && canBitmap) return new WorkerPipelineEngine();
  } catch {
    // ignore and fallback
  }

  return new LocalPipelineEngine(deps);
}
