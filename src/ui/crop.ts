import type { ToolRefs } from "../app/dom";

export type CropRect = { x: number; y: number; w: number; h: number };

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function initCropToAspect(
  img: { width: number; height: number },
  targetR: number
): CropRect {
  const iw = img.width, ih = img.height;
  const r = iw / ih;

  let w = iw, h = ih;
  if (r > targetR) {
    w = ih * targetR;
    h = ih;
  } else {
    w = iw;
    h = iw / targetR;
  }

  return { x: (iw - w) / 2, y: (ih - h) / 2, w, h };
}

function getContainTransformForCropCanvas(
  img: { width: number; height: number },
  canvas: HTMLCanvasElement
) {
  const cw = canvas.width, ch = canvas.height;
  const ir = img.width / img.height;
  const cr = cw / ch;

  let dw = cw, dh = ch;
  if (ir > cr) dh = cw / ir;
  else dw = ch * ir;

  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  return { dx, dy, dw, dh };
}

function cropRectToCanvasRect(
  img: { width: number; height: number },
  crop: CropRect,
  canvas: HTMLCanvasElement
) {
  const { dx, dy, dw, dh } = getContainTransformForCropCanvas(img, canvas);

  const rx = dx + (crop.x / img.width) * dw;
  const ry = dy + (crop.y / img.height) * dh;
  const rw = (crop.w / img.width) * dw;
  const rh = (crop.h / img.height) * dh;

  return { rx, ry, rw, rh, dx, dy, dw, dh };
}

type Corner = "nw" | "ne" | "sw" | "se" | null;

function hitCorner(
  mx: number,
  my: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): Corner {
  const handle = 16;
  const corners: Array<[Corner, number, number]> = [
    ["nw", rx, ry],
    ["ne", rx + rw, ry],
    ["sw", rx, ry + rh],
    ["se", rx + rw, ry + rh],
  ];

  for (const [name, cx, cy] of corners) {
    if (Math.abs(mx - cx) <= handle && Math.abs(my - cy) <= handle) return name;
  }
  return null;
}

export type CropDragMode = "none" | "move" | "nw" | "ne" | "sw" | "se";

export function createCropController(deps: {
  getRefs: () => ToolRefs | null;
  getSourceImage: () => HTMLImageElement | null;
  getDisplayCanvas: () => HTMLCanvasElement | null;
  rebuildDisplayCanvas: () => void;
  getCropRect: () => CropRect | null;
  setCropRect: (r: CropRect | null) => void;
  scheduleRecomputePreview: () => void;

  getCropDragMode: () => CropDragMode;
  setCropDragMode: (m: CropDragMode) => void;
  getDragStart: () => { mx: number; my: number; x: number; y: number };
  setDragStart: (v: { mx: number; my: number; x: number; y: number }) => void;
  getDragAnchor: () => { ax: number; ay: number; start: CropRect };
  setDragAnchor: (v: { ax: number; ay: number; start: CropRect }) => void;
}) {
  const {
    getRefs,
    getSourceImage,
    getDisplayCanvas,
    rebuildDisplayCanvas,
    getCropRect,
    setCropRect,
    scheduleRecomputePreview,
    getCropDragMode,
    setCropDragMode,
    getDragStart,
    setDragStart,
    getDragAnchor,
    setDragAnchor,
  } = deps;

  function drawCropUI() {
    const refs = getRefs();
    if (!refs) return;

    const { cropCanvas, cropCtx, useCropChk } = refs;

    cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    if (!getSourceImage()) return;

    rebuildDisplayCanvas();
    const dc = getDisplayCanvas();
    if (!dc) return;

    const img = dc;
    cropCtx.imageSmoothingEnabled = true;
    cropCtx.imageSmoothingQuality = "high";

    const { dx, dy, dw, dh } = getContainTransformForCropCanvas(img, cropCanvas);
    cropCtx.drawImage(img, dx, dy, dw, dh);

    const cropRect = getCropRect();
    if (!cropRect || !useCropChk.checked) return;

    const { rx, ry, rw, rh } = cropRectToCanvasRect(img, cropRect, cropCanvas);

    // darken outside
    cropCtx.save();
    cropCtx.fillStyle = "rgba(0,0,0,0.45)";
    cropCtx.beginPath();
    cropCtx.rect(dx, dy, dw, dh);
    cropCtx.rect(rx, ry, rw, rh);
    cropCtx.fill("evenodd");
    cropCtx.restore();

    // outline
    cropCtx.save();
    cropCtx.strokeStyle = "rgba(255,255,255,0.9)";
    cropCtx.lineWidth = 2;
    cropCtx.strokeRect(rx, ry, rw, rh);
    cropCtx.restore();

    // handles
    const handle = 14;
    cropCtx.fillStyle = "rgba(255,255,255,0.95)";
    cropCtx.strokeStyle = "rgba(0,0,0,0.9)";
    cropCtx.lineWidth = 2;

    const corners = [
      [rx, ry],
      [rx + rw, ry],
      [rx, ry + rh],
      [rx + rw, ry + rh],
    ] as Array<[number, number]>;

    for (const [cx, cy] of corners) {
      const x = cx - handle / 2;
      const y = cy - handle / 2;
      cropCtx.fillRect(x, y, handle, handle);
      cropCtx.strokeRect(x, y, handle, handle);
    }
  }

  function getCroppedSource(): HTMLCanvasElement | null {
    const refs = getRefs();
    const cropRect = getCropRect();
    if (!refs || !cropRect || !refs.useCropChk.checked) return null;

    rebuildDisplayCanvas();
    const dc = getDisplayCanvas();
    if (!dc) return null;

    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(cropRect.w));
    out.height = Math.max(1, Math.round(cropRect.h));

    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      dc,
      cropRect.x,
      cropRect.y,
      cropRect.w,
      cropRect.h,
      0,
      0,
      out.width,
      out.height
    );
    return out;
  }

  function initCropEvents() {
    const refs0 = getRefs();
    if (!refs0) return;
    const { cropCanvas } = refs0;

    type Pt = { x: number; y: number };
    const pointers = new Map<number, Pt>();
    let pinchStart: null | { dist: number; rect: CropRect; cx: number; cy: number } = null;

    const getCanvasPoint = (e: PointerEvent): Pt => {
      const rect = cropCanvas.getBoundingClientRect();
      const mxCss = e.clientX - rect.left;
      const myCss = e.clientY - rect.top;
      return {
        x: mxCss * (cropCanvas.width / rect.width),
        y: myCss * (cropCanvas.height / rect.height),
      };
    };

    const updateCursor = (mx: number, my: number) => {
      const refs = getRefs();
      const cropRect = getCropRect();
      if (!refs || !getSourceImage() || !cropRect || !refs.useCropChk.checked) {
        cropCanvas.style.cursor = "default";
        return;
      }
      if (getCropDragMode() !== "none") return;

      rebuildDisplayCanvas();
      const dc = getDisplayCanvas();
      if (!dc) return;

      const { rx, ry, rw, rh } = cropRectToCanvasRect(dc, cropRect, cropCanvas);
      const corner = hitCorner(mx, my, rx, ry, rw, rh);

      if (corner === "nw" || corner === "se") cropCanvas.style.cursor = "nwse-resize";
      else if (corner === "ne" || corner === "sw") cropCanvas.style.cursor = "nesw-resize";
      else if (mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh) cropCanvas.style.cursor = "move";
      else cropCanvas.style.cursor = "default";
    };

    cropCanvas.addEventListener("pointerdown", (e) => {
      const refs = getRefs();
      const cropRect = getCropRect();
      if (!refs || !getSourceImage() || !cropRect || !refs.useCropChk.checked) return;

      cropCanvas.setPointerCapture(e.pointerId);
      const pt = getCanvasPoint(e);
      pointers.set(e.pointerId, pt);

      // Pinch start (2 pointers)
      if (pointers.size === 2) {
        const arr = Array.from(pointers.values());
        const dx = arr[0].x - arr[1].x;
        const dy = arr[0].y - arr[1].y;
        const dist = Math.max(1, Math.hypot(dx, dy));

        rebuildDisplayCanvas();
        const dc = getDisplayCanvas();
        if (!dc) return;

        pinchStart = { dist, rect: { ...cropRect }, cx: (arr[0].x + arr[1].x) / 2, cy: (arr[0].y + arr[1].y) / 2 };
        setCropDragMode("none");
        return;
      }

      // Single-pointer drag (move/resize)
      rebuildDisplayCanvas();
      const dc = getDisplayCanvas();
      if (!dc) return;

      const { rx, ry, rw, rh } = cropRectToCanvasRect(dc, cropRect, cropCanvas);
      const corner = hitCorner(pt.x, pt.y, rx, ry, rw, rh);

      if (corner) {
        setCropDragMode(corner);
        const start = { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h };
        let ax = 0, ay = 0;

        if (corner === "nw") { ax = start.x + start.w; ay = start.y + start.h; }
        if (corner === "ne") { ax = start.x;           ay = start.y + start.h; }
        if (corner === "sw") { ax = start.x + start.w; ay = start.y; }
        if (corner === "se") { ax = start.x;           ay = start.y; }

        setDragAnchor({ ax, ay, start });
        return;
      }

      const inside = pt.x >= rx && pt.x <= rx + rw && pt.y >= ry && pt.y <= ry + rh;
      if (!inside) return;

      setCropDragMode("move");
      setDragStart({ mx: pt.x, my: pt.y, x: cropRect.x, y: cropRect.y });
    });

    cropCanvas.addEventListener("pointermove", (e) => {
      const pt = getCanvasPoint(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, pt);

      // cursor feedback
      updateCursor(pt.x, pt.y);

      const refs = getRefs();
      let cropRect = getCropRect();
      if (!refs || !getSourceImage() || !cropRect || !refs.useCropChk.checked) return;

      rebuildDisplayCanvas();
      const dc = getDisplayCanvas();
      if (!dc) return;

      // Pinch zoom (2 pointers)
      if (pointers.size === 2 && pinchStart) {
        const arr = Array.from(pointers.values());
        const dxp = arr[0].x - arr[1].x;
        const dyp = arr[0].y - arr[1].y;
        const dist = Math.max(1, Math.hypot(dxp, dyp));
        const ratio = dist / pinchStart.dist;

        const { dx, dy, dw, dh } = getContainTransformForCropCanvas(dc, cropCanvas);

        // normalize pinch center into image space
        const nx = clamp((pinchStart.cx - dx) / dw, 0, 1);
        const ny = clamp((pinchStart.cy - dy) / dh, 0, 1);
        const px = nx * dc.width;
        const py = ny * dc.height;

        const base = pinchStart.rect;

        const newW = clamp(base.w / ratio, 10, dc.width);
        const newH = clamp(base.h / ratio, 10, dc.height);

        const newRect: CropRect = {
          x: clamp(px - (px - base.x) / ratio, 0, dc.width - newW),
          y: clamp(py - (py - base.y) / ratio, 0, dc.height - newH),
          w: newW,
          h: newH,
        };

        setCropRect(newRect);
        drawCropUI();
        scheduleRecomputePreview();
        return;
      }

      const dragMode = getCropDragMode();
      if (dragMode === "none") return;

      const { dx, dy, dw, dh } = getContainTransformForCropCanvas(dc, cropCanvas);

      const canvasToSrcX = (val: number) => (val / dw) * dc.width;
      const canvasToSrcY = (val: number) => (val / dh) * dc.height;

      // Move
      if (dragMode === "move") {
        const ds = getDragStart();
        const deltaXCanvas = pt.x - ds.mx;
        const deltaYCanvas = pt.y - ds.my;

        const next: CropRect = {
          ...cropRect,
          x: ds.x + canvasToSrcX(deltaXCanvas),
          y: ds.y + canvasToSrcY(deltaYCanvas),
        };

        next.x = clamp(next.x, 0, dc.width - next.w);
        next.y = clamp(next.y, 0, dc.height - next.h);

        setCropRect(next);
        drawCropUI();
        scheduleRecomputePreview();
        return;
      }

      // Resize corner while keeping selected aspect
      const nx = (pt.x - dx) / dw;
      const ny = (pt.y - dy) / dh;
      const px = clamp(nx, 0, 1) * dc.width;
      const py = clamp(ny, 0, 1) * dc.height;

      const { ax, ay, start } = getDragAnchor();

      const dxAbs = Math.abs(px - ax);
      const dyAbs = Math.abs(py - ay);

      const wFromX = dxAbs;
      const hFromY = dyAbs;

      const aspect = start.w / start.h;
      // compute size preserving aspect
      let newW = wFromX;
      let newH = newW / aspect;

      if (newH < hFromY) {
        newH = hFromY;
        newW = newH * aspect;
      }

      newW = clamp(newW, 10, dc.width);
      newH = clamp(newH, 10, dc.height);

      // build rect from anchor opposite
      let x = ax, y = ay;
      if (dragMode === "nw") { x = ax - newW; y = ay - newH; }
      if (dragMode === "ne") { x = ax;        y = ay - newH; }
      if (dragMode === "sw") { x = ax - newW; y = ay; }
      if (dragMode === "se") { x = ax;        y = ay; }

      const next: CropRect = { x, y, w: newW, h: newH };
      next.x = clamp(next.x, 0, dc.width - next.w);
      next.y = clamp(next.y, 0, dc.height - next.h);

      setCropRect(next);
      drawCropUI();
      scheduleRecomputePreview();
    });

        // Mouse wheel zoom (desktop)
    cropCanvas.addEventListener(
      "wheel",
      (e) => {
        const refs = getRefs();
        const cropRect = getCropRect();
        if (!refs || !getSourceImage() || !cropRect || !refs.useCropChk.checked) return;

        // IMPORTANT: prevent page scroll
        e.preventDefault();

        rebuildDisplayCanvas();
        const dc = getDisplayCanvas();
        if (!dc) return;

        const rect = cropCanvas.getBoundingClientRect();
        const mxCss = e.clientX - rect.left;
        const myCss = e.clientY - rect.top;
        const mx = mxCss * (cropCanvas.width / rect.width);
        const my = myCss * (cropCanvas.height / rect.height);

        const { dx, dy, dw, dh } = getContainTransformForCropCanvas(dc, cropCanvas);

        // ignore wheel outside the drawn image area
        if (mx < dx || mx > dx + dw || my < dy || my > dy + dh) return;

        // mouse position in image space
        const nx = clamp((mx - dx) / dw, 0, 1);
        const ny = clamp((my - dy) / dh, 0, 1);
        const px = nx * dc.width;
        const py = ny * dc.height;

        // zoom factor: wheel up -> zoom in (smaller rect), wheel down -> zoom out (bigger rect)
        const zoomIn = e.deltaY < 0;
        const factor = zoomIn ? 1 / 1.1 : 1.1;

        const aspect = cropRect.w / cropRect.h;

        let newW = cropRect.w * factor;
        let newH = newW / aspect;

        // clamp
        newW = clamp(newW, 10, dc.width);
        newH = clamp(newH, 10, dc.height);

        // keep mouse point under cursor
        const newX = clamp(px - (px - cropRect.x) * (newW / cropRect.w), 0, dc.width - newW);
        const newY = clamp(py - (py - cropRect.y) * (newH / cropRect.h), 0, dc.height - newH);

        setCropRect({ x: newX, y: newY, w: newW, h: newH });
        drawCropUI();
        scheduleRecomputePreview();
      },
      { passive: false }
    );

    cropCanvas.addEventListener("pointerup", (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (pointers.size === 0) setCropDragMode("none");
    });

    cropCanvas.addEventListener("pointercancel", (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (pointers.size === 0) setCropDragMode("none");
    });
  }

  return { drawCropUI, getCroppedSource, initCropEvents };
}