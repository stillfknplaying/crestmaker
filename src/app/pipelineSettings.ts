import type { ToolRefs } from "./dom";
import type { DitherMode, PixelPreset, PipelineMode, Preset } from "../types/types";
import type { PipelineSettings } from "../engines/engine";

export type BuildPipelineSettingsDeps = {
  refs: ToolRefs;
  crestMode: PipelineSettings["crestMode"];
  invertColors: boolean;
  pixelPreset: PixelPreset;
  brightness: number;
  contrast: number;
};

/**
 * Collect pipeline settings from UI refs + persisted settings.
 *
 * Note: this is intentionally isolated so pipelineController stays DOM-agnostic.
 */
export function buildPipelineSettings(d: BuildPipelineSettingsDeps): PipelineSettings {
  const { refs } = d;

  const pipeline = refs.pipelineSel.value as PipelineMode;
  const presetVal = refs.presetSel.value;

  const isPixel = pipeline === "pixel";
  const preset: Preset = isPixel ? "balanced" : (presetVal as Preset);
  const pixelPreset: PixelPreset = isPixel ? (presetVal as PixelPreset) : d.pixelPreset;

  return {
    crestMode: d.crestMode,
    pipelineMode: pipeline,
    preset,
    pixelPreset,
    dither: refs.ditherSel.value as DitherMode,
    ditherAmountRaw: Number(refs.ditherAmt.value) / 100,
    twoStep: refs.twoStepChk.checked,
    centerWeighted: refs.centerPaletteChk.checked,
    useOKLab: refs.oklabChk.checked,
    noiseOrdered: refs.noiseDitherChk.checked,
    edgeSharpen: refs.edgeSharpenChk.checked,
    cleanup: refs.cleanupChk.checked,
    invertColors: d.invertColors,
    brightness: d.brightness,
    contrast: d.contrast,
  };
}
