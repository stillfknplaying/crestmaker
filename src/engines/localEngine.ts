import type { DitherMode, PixelPreset, Preset } from "../types/types";
import type { PipelineEngine, PipelineInput, PipelineResult } from "./engine";

export type QuantizeResult = { palette: Uint8Array; indices: Uint8Array };

export type LocalPipelineEngineDeps = {
  // resize/render
  renderToSize: (
    src: CanvasImageSource,
    preset: Preset,
    twoStep: boolean,
    w: number,
    h: number
  ) => ImageData;

  // post-processing (modern only)
  edgeAwareSharpen: (img: ImageData, amount: number) => ImageData;
  softNormalizeLevels: (img: ImageData, amount: number) => ImageData;

  // basic math helper
  clamp255: (n: number) => number;

  // quantize
  clampDitherStrength: (preset: Preset, dither: DitherMode, raw: number) => number;
  quantizeTo256: (
    img: ImageData,
    dither: DitherMode,
    ditherAmount: number,
    centerWeighted: boolean,
    useOKLab: boolean,
    noiseOrdered: boolean
  ) => QuantizeResult;
  quantizePixel256: (img: ImageData, preset: PixelPreset) => QuantizeResult;

  // cleanup
  cleanupIndicesMajoritySafe: (
    indices: Uint8Array,
    w: number,
    h: number,
    palette: Uint8Array,
    passes: number,
    minMajority: number,
    maxJump: number
  ) => void;
};

/**
 * Local (main-thread) pipeline engine.
 *
 * It contains the *current* compute logic moved out of pipelineController,
 * without algorithm changes.
 */
export class LocalPipelineEngine implements PipelineEngine {
  private readonly deps: LocalPipelineEngineDeps;

  constructor(deps: LocalPipelineEngineDeps) {
    this.deps = deps;
  }

  compute(input: PipelineInput): PipelineResult {
    const { source } = input;
    const s = input.settings;

    const isPixel = s.pipelineMode === "pixel";
    const preset: Preset = isPixel ? "balanced" : s.preset;
    const pixelPreset: PixelPreset = isPixel ? s.pixelPreset : s.pixelPreset;

    const baseW = s.crestMode === "only_clan" ? 16 : 24;
    const baseH = 12;

    const useTwoStep = isPixel ? false : s.twoStep;
    const centerWeighted = isPixel ? false : s.centerWeighted;

    const dAmtRaw = Number.isFinite(s.ditherAmountRaw) ? s.ditherAmountRaw : 0;
    const dAmt = isPixel ? 0 : this.deps.clampDitherStrength(preset, s.dither, dAmtRaw);

    const useOKLab = s.useOKLab;
    const useNoiseOrdered = isPixel ? false : s.noiseOrdered;
    const doEdgeSharpen = isPixel ? false : s.edgeSharpen;
    const doCleanup = s.cleanup;

    // 1) resize/render
    const imgBase = this.deps.renderToSize(source, preset, useTwoStep, baseW, baseH);

    // hard alpha cutoff for crisp edges
    for (let i = 0; i < imgBase.data.length; i += 4) {
      imgBase.data[i + 3] = imgBase.data[i + 3] < 128 ? 0 : 255;
    }

    // 2) invert (optional)
    if (s.invertColors) {
      for (let i = 0; i < imgBase.data.length; i += 4) {
        imgBase.data[i] = 255 - imgBase.data[i];
        imgBase.data[i + 1] = 255 - imgBase.data[i + 1];
        imgBase.data[i + 2] = 255 - imgBase.data[i + 2];
      }
    }

    // 3) brightness + contrast (universal)
    const brightness = s.brightness;
    const contrast = s.contrast;
    if (brightness !== 0 || contrast !== 0) {
      // NOTE: existing math expects contrast in [-255..255]
      const c = contrast;
      const k = (259 * (c + 255)) / (255 * (259 - c));
      for (let i = 0; i < imgBase.data.length; i += 4) {
        let rr = imgBase.data[i] + brightness;
        let gg = imgBase.data[i + 1] + brightness;
        let bb = imgBase.data[i + 2] + brightness;

        rr = this.deps.clamp255((rr - 128) * k + 128);
        gg = this.deps.clamp255((gg - 128) * k + 128);
        bb = this.deps.clamp255((bb - 128) * k + 128);

        imgBase.data[i] = rr;
        imgBase.data[i + 1] = gg;
        imgBase.data[i + 2] = bb;
      }
    }

    // 4) modern-only normalize & sharpen
    let imgForQuant: ImageData = imgBase;
    if (!isPixel) {
      imgForQuant = this.deps.softNormalizeLevels(imgForQuant, preset === "complex" ? 0.3 : 0.22);
      if (doEdgeSharpen) {
        imgForQuant = this.deps.edgeAwareSharpen(imgForQuant, preset === "simple" ? 0.1 : 0.12);
      }
    }

    // 5) quantize
    let palette256: Uint8Array;
    let indices: Uint8Array;
    if (isPixel) {
      const q = this.deps.quantizePixel256(imgForQuant, pixelPreset);
      palette256 = q.palette;
      indices = q.indices;
    } else {
      const q = this.deps.quantizeTo256(imgForQuant, s.dither, dAmt, centerWeighted, useOKLab, useNoiseOrdered);
      palette256 = q.palette;
      indices = q.indices;
    }

    // 6) split outputs
    let iconAlly8x12Indexed: Uint8Array | null = null;
    let iconClan16x12Indexed: Uint8Array | null = null;
    let iconCombined24x12Indexed: Uint8Array | null = null;

    if (baseW === 16) {
      iconClan16x12Indexed = indices;
    } else {
      iconCombined24x12Indexed = indices;

      iconAlly8x12Indexed = new Uint8Array(8 * 12);
      iconClan16x12Indexed = new Uint8Array(16 * 12);

      for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 24; x++) {
          const v = indices[y * 24 + x];
          if (x < 8) iconAlly8x12Indexed[y * 8 + x] = v;
          else iconClan16x12Indexed[y * 16 + (x - 8)] = v;
        }
      }
    }

    // 7) optional cleanup (safe majority)
    if (doCleanup && iconCombined24x12Indexed) {
      const passes = 1;
      const minMaj = 0.55;
      const maxJump = 110;
      this.deps.cleanupIndicesMajoritySafe(iconCombined24x12Indexed, 24, 12, palette256, passes, minMaj, maxJump);
    }

    const canDownload =
      !!palette256 &&
      (s.crestMode === "only_clan"
        ? !!iconClan16x12Indexed
        : !!iconCombined24x12Indexed && !!iconClan16x12Indexed && !!iconAlly8x12Indexed);

    return {
      palette256,
      iconAlly8x12Indexed,
      iconClan16x12Indexed,
      iconCombined24x12Indexed,
      baseW,
      baseH,
      canDownload,
    };
  }
}
