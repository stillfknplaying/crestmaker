import type { ToolRefs } from "../app/dom";
import type { CrestMode } from "../types/types";
import type { PipelineComputeResult } from "../app/pipelineController";

export type ResultsRenderDeps = {
  getRefs: () => ToolRefs | null;
  getCurrentMode: () => CrestMode;
  renderPreview: () => void;
};

export type ResultsRenderer = {
  render: (res: PipelineComputeResult | null) => void;
  drawTrueSizeEmpty: (w: number, h: number) => void;
};

export function createResultsRenderer(deps: ResultsRenderDeps): ResultsRenderer {
  function setTrueSizeCanvasDims(r: ToolRefs, w: number, h: number) {
    if (r.dstTrueCanvas.width !== w) r.dstTrueCanvas.width = w;
    if (r.dstTrueCanvas.height !== h) r.dstTrueCanvas.height = h;
  }

  function drawTrueSizeEmpty(r: ToolRefs, w: number, h: number) {
    setTrueSizeCanvasDims(r, w, h);
    r.dstTrueCtx.clearRect(0, 0, w, h);
    r.dstTrueCtx.fillStyle = "rgba(255,255,255,0.06)";
    r.dstTrueCtx.fillRect(0, 0, w, h);
  }

  function drawTrueSize(r: ToolRefs, indices: Uint8Array, palette: Uint8Array, w: number, h: number) {
    setTrueSizeCanvasDims(r, w, h);
    const img = r.dstTrueCtx.createImageData(w, h);
    const data = img.data;
    for (let i = 0; i < w * h; i++) {
      const idx = indices[i];
      data[i * 4 + 0] = palette[idx * 3 + 0];
      data[i * 4 + 1] = palette[idx * 3 + 1];
      data[i * 4 + 2] = palette[idx * 3 + 2];
      data[i * 4 + 3] = 255;
    }
    r.dstTrueCtx.putImageData(img, 0, 0);
  }

  function drawZoomTo(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    indices: Uint8Array,
    palette: Uint8Array,
    w: number,
    h: number
  ) {
    const zoom = 10;
    const cw = w * zoom;
    const ch = h * zoom;
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = indices[y * w + x];
        const rr = palette[idx * 3 + 0];
        const gg = palette[idx * 3 + 1];
        const bb = palette[idx * 3 + 2];
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
  }

  function clearZoomCanvases(r: ToolRefs) {
    r.dstZoom24Ctx.clearRect(0, 0, r.dstZoom24Canvas.width, r.dstZoom24Canvas.height);
    r.dstZoom16Ctx.clearRect(0, 0, r.dstZoom16Canvas.width, r.dstZoom16Canvas.height);
  }

  return {
    drawTrueSizeEmpty: (w, h) => {
      const r = deps.getRefs();
      if (!r) return;
      drawTrueSizeEmpty(r, w, h);
    },
    render: (res) => {
      const r = deps.getRefs();
      if (!r) return;

      // Download button
      r.downloadBtn.disabled = !res?.canDownload;

      // No output yet
      if (!res || !res.palette256) {
        // Keep consistent placeholder: true-size shows faint block,
        // zoom canvases cleared.
        const mode = deps.getCurrentMode();
        drawTrueSizeEmpty(r, mode === "only_clan" ? 16 : 24, 12);
        clearZoomCanvases(r);
        deps.renderPreview();
        return;
      }

      const palette = res.palette256;
      const mode: CrestMode = deps.getCurrentMode();

      if (mode === "only_clan") {
        if (res.iconClan16x12Indexed) {
          drawTrueSize(r, res.iconClan16x12Indexed, palette, 16, 12);
          drawZoomTo(r.dstZoom16Canvas, r.dstZoom16Ctx, res.iconClan16x12Indexed, palette, 16, 12);
        } else {
          drawTrueSizeEmpty(r, 16, 12);
          r.dstZoom16Ctx.clearRect(0, 0, r.dstZoom16Canvas.width, r.dstZoom16Canvas.height);
        }
        r.dstZoom24Ctx.clearRect(0, 0, r.dstZoom24Canvas.width, r.dstZoom24Canvas.height);
      } else {
        if (res.iconCombined24x12Indexed) {
          drawTrueSize(r, res.iconCombined24x12Indexed, palette, 24, 12);
          drawZoomTo(r.dstZoom24Canvas, r.dstZoom24Ctx, res.iconCombined24x12Indexed, palette, 24, 12);
        } else {
          drawTrueSizeEmpty(r, 24, 12);
          r.dstZoom24Ctx.clearRect(0, 0, r.dstZoom24Canvas.width, r.dstZoom24Canvas.height);
        }

        if (res.iconClan16x12Indexed) {
          drawZoomTo(r.dstZoom16Canvas, r.dstZoom16Ctx, res.iconClan16x12Indexed, palette, 16, 12);
        } else {
          r.dstZoom16Ctx.clearRect(0, 0, r.dstZoom16Canvas.width, r.dstZoom16Canvas.height);
        }
      }

      deps.renderPreview();
    },
  };
}
