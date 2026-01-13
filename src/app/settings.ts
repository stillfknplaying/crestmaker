import type { Preset, PipelineMode, PixelPreset, CrestMode, CropAspect } from "../types/types";

// LocalStorage-backed user settings.
// Keep all persistence concerns here so main.ts stays glue-only.

// Persist some UI state across language switches
const ADV_OPEN_KEY = "cm_adv_open";

// Persist pipeline + presets
const PIPELINE_KEY = "cm_pipeline_v1";
const PIXEL_PRESET_KEY = "cm_pixel_preset_v1";
const MODERN_PRESET_KEY = "cm_modern_preset_v1";

// Persist sliders
const BRIGHTNESS_KEY = "cm_brightness_v1";
const CONTRAST_KEY = "cm_contrast_v1";

// Persist crest mode + crop aspect
const MODE_KEY = "cm_mode_v1";
const CROP_ASPECT_KEY = "cm_crop_aspect_v1";

// ---------- Advanced settings open/close ----------

export function getAdvancedOpen(): boolean {
  return localStorage.getItem(ADV_OPEN_KEY) === "1";
}

export function setAdvancedOpen(v: boolean): void {
  localStorage.setItem(ADV_OPEN_KEY, v ? "1" : "0");
}

// ---------- Pipeline ----------

export function getPipeline(): PipelineMode {
  const v = localStorage.getItem(PIPELINE_KEY);
  return v === "pixel" ? "pixel" : "old";
}

export function setPipeline(p: PipelineMode): void {
  localStorage.setItem(PIPELINE_KEY, p);
}

// ---------- Presets ----------

export function getPixelPreset(): PixelPreset {
  const v = localStorage.getItem(PIXEL_PRESET_KEY) as PixelPreset | null;
  // Migrate removed presets (Mild/Soft) to Clean
  if ((v as any) === "pixel-l2" || (v as any) === "pixel-soft") return "pixel-clean";
  // Default Pixel preset should be Clean (when nothing saved yet)
  return v === "pixel-clean" || v === "pixel-crisp" || v === "pixel-stable" || v === "pixel-indexed" ? v : "pixel-clean";
}

export function setPixelPreset(p: PixelPreset): void {
  localStorage.setItem(PIXEL_PRESET_KEY, p);
}

export function getModernPreset(): Preset {
  const v = localStorage.getItem(MODERN_PRESET_KEY) as Preset | null;
  return v === "legacy" || v === "simple" || v === "balanced" || v === "complex" ? v : "balanced";
}

export function setModernPreset(p: Preset): void {
  localStorage.setItem(MODERN_PRESET_KEY, p);
}

// ---------- Brightness / Contrast ----------

function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

export function getBrightness(): number {
  const v = Number(localStorage.getItem(BRIGHTNESS_KEY) ?? "0");
  return clampInt(v, -50, 50);
}

export function setBrightness(v: number): void {
  localStorage.setItem(BRIGHTNESS_KEY, String(clampInt(v, -50, 50)));
}

export function getContrast(): number {
  const v = Number(localStorage.getItem(CONTRAST_KEY) ?? "0");
  return clampInt(v, -50, 50);
}

export function setContrast(v: number): void {
  localStorage.setItem(CONTRAST_KEY, String(clampInt(v, -50, 50)));
}

// ---------- Crest mode / Crop aspect ----------

export function getMode(): CrestMode {
  const v = localStorage.getItem(MODE_KEY);
  return v === "only_clan" ? "only_clan" : "ally_clan";
}

export function setMode(m: CrestMode): void {
  localStorage.setItem(MODE_KEY, m);
}

export function getCropAspect(): CropAspect {
  const v = localStorage.getItem(CROP_ASPECT_KEY);
  return v === "16x12" ? "16x12" : "24x12";
}

export function setCropAspect(a: CropAspect): void {
  localStorage.setItem(CROP_ASPECT_KEY, a);
}
