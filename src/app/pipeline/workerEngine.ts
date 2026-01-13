import type { PipelineEngine, PipelineInput, PipelineResult } from "./engine";

type WorkerRequest = {
  id: number;
  input: {
    source: ImageBitmap;
    settings: PipelineInput["settings"];
  };
};

type WorkerResponse =
  | { id: number; ok: true; result: PipelineResult }
  | { id: number; ok: false; error: string };

/**
 * Pipeline engine backed by a Web Worker.
 *
 * Note: compute is async by nature.
 */
export class WorkerPipelineEngine implements PipelineEngine {
  private readonly worker: Worker;
  private nextId = 1;
  private readonly pending = new Map<number, { resolve: (r: PipelineResult) => void; reject: (e: Error) => void }>();

  constructor() {
    this.worker = new Worker(new URL("./pipeline.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const msg = ev.data;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error(msg.error || "Worker pipeline failed"));
    };
    this.worker.onerror = (e) => {
      // Reject all pending requests.
      const err = new Error(e.message || "Worker pipeline error");
      for (const [, p] of this.pending) p.reject(err);
      this.pending.clear();
    };
  }

  async compute(input: PipelineInput): Promise<PipelineResult> {
    // Worker requires a transferable ImageBitmap.
    if (!(input.source instanceof ImageBitmap)) {
      throw new Error("WorkerPipelineEngine expects ImageBitmap input");
    }

    const id = this.nextId++;
    const req: WorkerRequest = {
      id,
      input: {
        source: input.source,
        settings: input.settings,
      },
    };

    const p = new Promise<PipelineResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    // Transfer ownership of the bitmap to the worker.
    this.worker.postMessage(req, [input.source as any]);
    return p;
  }

  terminate() {
    this.worker.terminate();
  }
}
