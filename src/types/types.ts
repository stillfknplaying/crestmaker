// Shared app-wide types to avoid drift between modules.

export type DitherMode = "none" | "ordered4" | "ordered8" | "floyd" | "atkinson";

// Modern pipeline presets (UX-facing)
export type Preset = "legacy" | "simple" | "balanced" | "complex";

// Pipeline mode selector
export type PipelineMode = "old" | "pixel";

// Pixel pipeline presets
export type PixelPreset = "pixel-clean" | "pixel-crisp" | "pixel-stable" | "pixel-indexed";

// Tool output mode selector
export type CrestMode = "ally_clan" | "only_clan";

// Crop aspect tied to mode (24×12 or 16×12 tool)
export type CropAspect = "24x12" | "16x12";

// Crop rectangle in source pixels
export type CropRect = { x: number; y: number; w: number; h: number };

// Crop handle mode
export type CropDragMode = "none" | "move" | "nw" | "ne" | "sw" | "se";

// Game preview template metadata
export type GameTemplate = {
  src: string;
  baseW: number;
  baseH: number;
  slotX: number;
  slotY: number;
  slotW: number;
  slotH: number;
};
