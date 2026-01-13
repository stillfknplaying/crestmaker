import type {
  CrestMode,
  CropRect,
  DitherMode,
  PixelPreset,
  PipelineMode,
  Preset,
} from "../../types/types";

// Contract for pipeline computation.
//
// Commit 20 goal: make the controller/UI independent from the compute implementation.
// We keep compute synchronous for now. A future Worker engine can implement the same
// interface (likely with an async wrapper), but this commit keeps behavior unchanged.

export type PipelineSettings = {
  // Tool mode affects base output size (24×12 vs 16×12)
  crestMode: CrestMode;

  // Pipeline selection + presets
  pipelineMode: PipelineMode;
  preset: Preset; // modern preset (used when pipelineMode === "old")
  pixelPreset: PixelPreset; // pixel preset (used when pipelineMode === "pixel")

  // Dithering / quantize controls (modern pipeline)
  dither: DitherMode;
  ditherAmountRaw: number; // 0..1
  twoStep: boolean;
  centerWeighted: boolean;
  useOKLab: boolean;
  noiseOrdered: boolean;
  edgeSharpen: boolean;
  cleanup: boolean;

  // Universal adjustments
  invertColors: boolean;
  brightness: number; // -50..50
  contrast: number; // -50..50 (mapped to [-255..255] math in compute)
};

export type PipelineInput = {
  // Source ready for compute (already cropped/rotated in UI pipeline).
  // CanvasImageSource covers HTMLCanvasElement, HTMLImageElement, ImageBitmap, etc.
  source: CanvasImageSource;
  settings: PipelineSettings;
  // Reserved for worker-ready refactors (not used by Local engine right now).
  crop: CropRect | null;
};

export type PipelineResult = {
  palette256: Uint8Array;
  iconAlly8x12Indexed: Uint8Array | null;
  iconClan16x12Indexed: Uint8Array | null;
  iconCombined24x12Indexed: Uint8Array | null;
  baseW: number;
  baseH: number;
  canDownload: boolean;
};

export interface PipelineEngine {
  // Local engine may be synchronous; worker engine will be async.
  compute(input: PipelineInput): PipelineResult | Promise<PipelineResult>;
}
