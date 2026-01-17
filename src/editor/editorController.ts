import type { ToolRefs } from "../app/dom";
import type { ToolState } from "../app/state";
import type { CrestMode } from "../types/types";

export type EditorTool = "pencil" | "picker";

type EditorSnapshot = {
  mode: CrestMode;
  buf: Uint8Array;
};

export type EditorControllerDeps = {
  getRefs: () => ToolRefs | null;
  getState: () => ToolState;
  getCurrentMode: () => CrestMode;
  getAdvancedOpen: () => boolean;

  /** Called after any edit/undo/redo to refresh Result canvases + preview. */
  requestRender: () => void;
};

export type EditorController = {
  /** Reset editor stacks when pipeline output changes (new image / recompute). */
  resetHistory: () => void;
  /** Enable/disable based on whether we have output palette + indices. */
  syncAvailability: () => void;
};

const ZOOM_24 = 10;
const ZOOM_16 = 10;

function rgbHex(r: number, g: number, b: number): string {
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

function getPaletteRgb(palette: Uint8Array, idx: number): { r: number; g: number; b: number } {
  const i = idx * 3;
  return { r: palette[i + 0], g: palette[i + 1], b: palette[i + 2] };
}

function clone(u8: Uint8Array): Uint8Array {
  return new Uint8Array(u8);
}

function splitFromCombined24(combined: Uint8Array): { ally8: Uint8Array; clan16: Uint8Array } {
  // Layout is 24×12: left 8×12 (ally), right 16×12 (clan)
  const w = 24;
  const h = 12;
  const ally = new Uint8Array(8 * h);
  const clan = new Uint8Array(16 * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    ally.set(combined.subarray(row, row + 8), y * 8);
    clan.set(combined.subarray(row + 8, row + 24), y * 16);
  }
  return { ally8: ally, clan16: clan };
}

function mostPopularColorIndices(indices: Uint8Array, topN: number): number[] {
  // indices are 0..255
  const counts = new Uint32Array(256);
  for (let i = 0; i < indices.length; i++) counts[indices[i]]++;
  const arr: Array<{ idx: number; c: number }> = [];
  for (let i = 0; i < 256; i++) {
    const c = counts[i];
    if (c) arr.push({ idx: i, c });
  }
  arr.sort((a, b) => b.c - a.c);
  return arr.slice(0, topN).map((x) => x.idx);
}

function canvasToPixel(canvas: HTMLCanvasElement, e: PointerEvent, zoom: number, w: number, h: number) {
  const rect = canvas.getBoundingClientRect();
  // Clamp into the drawable area to avoid "off-by-one" on the right/bottom edges.
  const rx = (e.clientX - rect.left) / rect.width;
  const ry = (e.clientY - rect.top) / rect.height;
  const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(rx * canvas.width)));
  const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(ry * canvas.height)));
  const px = Math.floor(x / zoom);
  const py = Math.floor(y / zoom);
  if (px < 0 || py < 0 || px >= w || py >= h) return null;
  return { px, py };
}

export function createEditorController(deps: EditorControllerDeps): EditorController {
  let tool: EditorTool = "pencil";
  let currentColorIdx = 0;
  let drawing = false;
  let strokePushed = false;

  const undo: EditorSnapshot[] = [];
  const redo: EditorSnapshot[] = [];
  const UNDO_LIMIT = 20;

  let uiBound = false;
  let boundToUndoBtn: HTMLButtonElement | null = null;
  let hotkeysBound = false;

  function hasOutput(state: ToolState): boolean {
    return !!state.palette256 && (!!state.iconCombined24x12Indexed || !!state.iconClan16x12Indexed);
  }

  function editorEnabled(state: ToolState): boolean {
    return deps.getAdvancedOpen() && hasOutput(state);
  }

  function snapshot(state: ToolState, mode: CrestMode): EditorSnapshot {
    const active = getActiveBuffer(state, mode);
    if (!active) {
      // Should not happen when snapshot is called, but keep it safe.
      return { mode, buf: new Uint8Array(0) };
    }
    return { mode, buf: clone(active.buf) };
  }

  function restore(state: ToolState, snap: EditorSnapshot) {
    if (snap.mode === "only_clan") {
      state.iconClan16x12Indexed = clone(snap.buf);
      state.iconCombined24x12Indexed = null;
      state.iconAlly8x12Indexed = null;
      return;
    }

    // 24×12 (combined)
    state.iconCombined24x12Indexed = clone(snap.buf);
    const parts = splitFromCombined24(state.iconCombined24x12Indexed);
    state.iconAlly8x12Indexed = parts.ally8;
    state.iconClan16x12Indexed = parts.clan16;
  }

  function pushUndo(state: ToolState, mode: CrestMode) {
    undo.push(snapshot(state, mode));
    if (undo.length > UNDO_LIMIT) undo.shift();
    redo.length = 0;
  }

  function updateCursorIcon(_r: ToolRefs) {
    // We use a 1px crosshair overlay cursor in zoom; no per-tool SVG cursor.
    // Keep the nodes but leave their src untouched.
  }

  function applyCanvasCursor(r: ToolRefs) {
    // Use a tiny custom crosshair overlay (1px) for both tools.
    // Hide the system cursor inside the zoom canvases.
    const css = "none";
    r.dstZoom24Canvas.style.cursor = css;
    r.dstZoom16Canvas.style.cursor = css;
    updateCursorIcon(r);
  }

  function syncButtons(r: ToolRefs, state: ToolState) {
    const enabled = editorEnabled(state);
    r.undoBtn.disabled = !enabled || undo.length === 0;
    r.redoBtn.disabled = !enabled || redo.length === 0;

    r.toolPickerBtn.setAttribute("aria-pressed", tool === "picker" ? "true" : "false");
    r.toolPencilBtn.setAttribute("aria-pressed", tool === "pencil" ? "true" : "false");

    r.toolPickerBtn.classList.toggle("active", tool === "picker");
    r.toolPencilBtn.classList.toggle("active", tool === "pencil");

    r.gridToggleBtn.setAttribute("aria-pressed", state.editorGrid ? "true" : "false");
    r.gridToggleBtn.classList.toggle("active", state.editorGrid);

    // If Advances panel is closed, editor must not be usable.
    // Important: restore the system cursor so it doesn't "disappear" over the zoom canvases.
    if (!deps.getAdvancedOpen()) {
      r.zoomCursor24.style.display = "none";
      r.zoomCursor16.style.display = "none";
      r.dstZoom24Canvas.style.cursor = "default";
      r.dstZoom16Canvas.style.cursor = "default";
    } else {
      r.zoomCursor24.style.display = "";
      r.zoomCursor16.style.display = "";
      applyCanvasCursor(r);
    }
  }

  function syncColorUi(r: ToolRefs, state: ToolState) {
    const palette = state.palette256;
    if (!palette) {
      r.editorColorSwatch.style.background = "#000";
      r.editorColorLabel.textContent = "#000000";
      return;
    }
    const { r: rr, g, b } = getPaletteRgb(palette, currentColorIdx);
    const hex = rgbHex(rr, g, b);
    r.editorColorSwatch.style.background = hex;
    r.editorColorLabel.textContent = hex;
  }

  function syncPopularColors(r: ToolRefs, state: ToolState) {
    const palette = state.palette256;
    if (!palette) {
      r.editorPopularColors.innerHTML = "";
      return;
    }

    const mode = deps.getCurrentMode();
    const active = getActiveBuffer(state, mode);
    if (!active) {
      r.editorPopularColors.innerHTML = "";
      return;
    }

    // Take the most frequent palette indices, but de-duplicate by actual RGB.
    // Some quantizers may emit duplicate colors at different indices.
    const ranked = mostPopularColorIndices(active.buf, 256);
    const uniq: number[] = [];
    const seen = new Set<string>();
    for (const idx of ranked) {
      const { r: rr, g, b } = getPaletteRgb(palette, idx);
      const hex = rgbHex(rr, g, b);
      if (seen.has(hex)) continue;
      seen.add(hex);
      uniq.push(idx);
      if (uniq.length >= 8) break;
    }

    const parts: string[] = [];
    for (const idx of uniq) {
      const { r: rr, g, b } = getPaletteRgb(palette, idx);
      const hex = rgbHex(rr, g, b);
      const isActive = idx === currentColorIdx;
      parts.push(
        `<button type="button" class="color-chip${isActive ? " active" : ""}" data-idx="${idx}" aria-label="${hex}"></button>`
      );
    }
    r.editorPopularColors.innerHTML = parts.join("");

    // Apply swatch colors after DOM is in place (avoid HTML escaping issues)
    const chips = r.editorPopularColors.querySelectorAll<HTMLButtonElement>(".color-chip");
    chips.forEach((btn) => {
      const idx = Number(btn.getAttribute("data-idx") || "0") | 0;
      const { r: rr, g, b } = getPaletteRgb(palette, idx);
      btn.style.background = rgbHex(rr, g, b);
    });
  }

  function getActiveBuffer(state: ToolState, mode: CrestMode): { buf: Uint8Array; w: number; h: number } | null {
    if (mode === "only_clan") {
      if (!state.iconClan16x12Indexed) return null;
      return { buf: state.iconClan16x12Indexed, w: 16, h: 12 };
    }
    if (!state.iconCombined24x12Indexed) return null;
    return { buf: state.iconCombined24x12Indexed, w: 24, h: 12 };
  }

  function applyDerivedFromMode(state: ToolState, mode: CrestMode) {
    if (mode === "only_clan") {
      // No derived outputs for ally in this mode.
      state.iconCombined24x12Indexed = null;
      state.iconAlly8x12Indexed = null;
      return;
    }
    const combined = state.iconCombined24x12Indexed;
    if (!combined) return;
    const parts = splitFromCombined24(combined);
    state.iconAlly8x12Indexed = parts.ally8;
    state.iconClan16x12Indexed = parts.clan16;
  }

  function renderAfterEdit() {
    deps.requestRender();
    const r = deps.getRefs();
    if (!r) return;
    const state = deps.getState();
    syncButtons(r, state);
    syncColorUi(r, state);
    syncPopularColors(r, state);
  }

  function doUndo() {
    const r = deps.getRefs();
    if (!r) return;
    const state = deps.getState();
    if (undo.length === 0) return;
    const curMode = deps.getCurrentMode();
    redo.push(snapshot(state, curMode));
    const snap = undo.pop()!;
    restore(state, snap);
    renderAfterEdit();
  }

  function doRedo() {
    const r = deps.getRefs();
    if (!r) return;
    const state = deps.getState();
    if (redo.length === 0) return;
    const curMode = deps.getCurrentMode();
    undo.push(snapshot(state, curMode));
    const snap = redo.pop()!;
    restore(state, snap);
    renderAfterEdit();
  }

  function pickAt(px: number, py: number) {
    const r = deps.getRefs();
    if (!r) return;
    const state = deps.getState();
    const mode = deps.getCurrentMode();
    const active = getActiveBuffer(state, mode);
    if (!active) return;
    const idx = active.buf[py * active.w + px];
    currentColorIdx = idx;
    syncColorUi(r, state);
    syncButtons(r, state);
    syncPopularColors(r, state);
  }

  function setPixel(px: number, py: number) {
    const state = deps.getState();
    const mode = deps.getCurrentMode();
    const active = getActiveBuffer(state, mode);
    if (!active) return;

    if (!strokePushed) {
      pushUndo(state, mode);
      strokePushed = true;
    }

    const i = py * active.w + px;
    active.buf[i] = currentColorIdx;

    // Keep derived buffers consistent for downloads + preview.
    applyDerivedFromMode(state, mode);
    deps.requestRender();
  }



  function bindCanvasPointer(canvas: HTMLCanvasElement, zoom: number, w: number, h: number) {
    const getCursorEls = () => {
      const r = deps.getRefs();
      if (!r) return null;
      if (canvas.id === "dstZoom24") return { wrap: canvas.parentElement as HTMLElement, cur: r.zoomCursor24, img: r.zoomCursorImg24 };
      if (canvas.id === "dstZoom16") return { wrap: canvas.parentElement as HTMLElement, cur: r.zoomCursor16, img: r.zoomCursorImg16 };
      return null;
    };

    const updateOverlayCursor = (e: PointerEvent) => {
      const els = getCursorEls();
      if (!els) return;

      const state = deps.getState();
      // Editor tools must be inactive when Advances are closed or there is no output.
      if (!editorEnabled(state)) {
        els.cur.classList.add("hidden");
        return;
      }

      const rect = els.wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Position marker
      els.cur.style.left = `${x}px`;
      els.cur.style.top = `${y}px`;

      // Make the marker color contrast with the pixel under the cursor
      const palette = state.palette256;
      const mode = deps.getCurrentMode();
      const active = getActiveBuffer(state, mode);
      if (palette && active) {
        const p = canvasToPixel(canvas, e, zoom, w, h);
        if (p) {
          const idx = active.buf[p.py * active.w + p.px] | 0;
          const rgb = getPaletteRgb(palette, idx);
          const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
          const col = lum > 0.55 ? "#000" : "#fff";
          els.cur.style.setProperty("--cursor-color", col);
        }
      }

      els.cur.classList.remove("hidden");
    };

    const hideOverlayCursor = () => {
      const els = getCursorEls();
      if (!els) return;
      els.cur.classList.add("hidden");
    };

    canvas.addEventListener("pointerdown", (e) => {
      updateOverlayCursor(e);
      const r = deps.getRefs();
      if (!r) return;
      const state = deps.getState();
      if (!editorEnabled(state)) return;

      const p = canvasToPixel(canvas, e, zoom, w, h);
      if (!p) return;

      canvas.setPointerCapture(e.pointerId);
      drawing = true;
      strokePushed = false;

      if (tool === "picker") {
        pickAt(p.px, p.py);
        drawing = false;
        return;
      }

      // Pencil
      setPixel(p.px, p.py);
      renderAfterEdit();
    });

    canvas.addEventListener("pointermove", (e) => {
      updateOverlayCursor(e);
      const state = deps.getState();
      if (!editorEnabled(state)) return;
      if (!drawing) return;
      if (tool !== "pencil") return;
      const p = canvasToPixel(canvas, e, zoom, w, h);
      if (!p) return;
      setPixel(p.px, p.py);
      // Lightweight: avoid syncButtons on every move.
    });

    const end = () => {
      if (!drawing) return;
      drawing = false;
      strokePushed = false;
      renderAfterEdit();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", () => { hideOverlayCursor(); end(); });
    canvas.addEventListener("pointerleave", () => { hideOverlayCursor(); end(); });
  }

  function bindCanvasPointerOnce(canvas: HTMLCanvasElement, zoom: number, w: number, h: number) {
    const k = "__cmEditorBound";
    if ((canvas as any)[k]) return;
    (canvas as any)[k] = true;
    bindCanvasPointer(canvas, zoom, w, h);
  }

  function ensureUiBound() {
    const r = deps.getRefs();
    if (!r) return;

    // Re-bind on re-render (e.g. language switch) when DOM nodes are replaced.
    if (boundToUndoBtn === r.undoBtn && uiBound) return;

    uiBound = true;
    boundToUndoBtn = r.undoBtn;

    r.undoBtn.addEventListener("click", () => doUndo());
    r.redoBtn.addEventListener("click", () => doRedo());

    r.toolPickerBtn.addEventListener("click", () => {
      tool = "picker";
      const st = deps.getState();
      syncButtons(r, st);
      syncPopularColors(r, st);
    });
    r.toolPencilBtn.addEventListener("click", () => {
      tool = "pencil";
      const st = deps.getState();
      syncButtons(r, st);
      syncPopularColors(r, st);
    });


    r.gridToggleBtn.addEventListener("click", () => {
      const st = deps.getState();
      st.editorGrid = !st.editorGrid;
      syncButtons(r, st);
      deps.requestRender();
    });
// Popular colors (delegated)
    r.editorPopularColors.addEventListener("click", (e) => {
      const t = e.target as HTMLElement | null;
      const btn = t?.closest?.(".color-chip") as HTMLButtonElement | null;
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-idx") || "0") | 0;
      currentColorIdx = idx;
      const st = deps.getState();
      syncColorUi(r, st);
      syncPopularColors(r, st);
    });

    // Canvases are always present; cards are toggled via CSS.
    bindCanvasPointerOnce(r.dstZoom24Canvas, ZOOM_24, 24, 12);
    bindCanvasPointerOnce(r.dstZoom16Canvas, ZOOM_16, 16, 12);

    // Hotkeys
    if (!hotkeysBound) {
      hotkeysBound = true;
      window.addEventListener("keydown", (e) => {
        // Editor hotkeys only when Advances are open and editor has output
        if (!editorEnabled(deps.getState())) return;
        const isMac = navigator.platform.toLowerCase().includes("mac");
        const mod = isMac ? e.metaKey : e.ctrlKey;
        if (!mod) return;
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) doRedo();
          else doUndo();
        }
      });
    }
  }

  return {
    resetHistory: () => {
      ensureUiBound();
      undo.length = 0;
      redo.length = 0;
      strokePushed = false;
      drawing = false;
      const r = deps.getRefs();
      if (!r) return;
      const state = deps.getState();
      syncButtons(r, state);
      syncColorUi(r, state);
      syncPopularColors(r, state);
    },
    syncAvailability: () => {
      ensureUiBound();
      const r = deps.getRefs();
      if (!r) return;
      const state = deps.getState();
      syncButtons(r, state);
      syncColorUi(r, state);
      syncPopularColors(r, state);
    },
  };
}
