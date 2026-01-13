// Keeps the rotated "display canvas" in sync with the current source image + rotation.

type Rotation90 = 0 | 90 | 180 | 270;

type Deps = {
  getSourceImage: () => HTMLImageElement | null;
  getRotation90: () => Rotation90;
  getDisplayCanvas: () => HTMLCanvasElement | null;
  setDisplayCanvas: (c: HTMLCanvasElement | null) => void;
};

let deps: Deps | null = null;

export function initDisplayCanvas(d: Deps) {
  deps = d;
}

export function rebuildDisplayCanvas() {
  if (!deps) throw new Error("displayCanvas not initialized");
  const sourceImage = deps.getSourceImage();
  if (!sourceImage) {
    deps.setDisplayCanvas(null);
    return;
  }

  let displayCanvas = deps.getDisplayCanvas();
  if (!displayCanvas) displayCanvas = document.createElement("canvas");

  const sw = sourceImage.width;
  const sh = sourceImage.height;

  const dc = displayCanvas;
  const ctx = dc.getContext("2d")!;

  const rotation90 = deps.getRotation90();
  if (rotation90 === 90 || rotation90 === 270) {
    dc.width = sh;
    dc.height = sw;
  } else {
    dc.width = sw;
    dc.height = sh;
  }

  ctx.clearRect(0, 0, dc.width, dc.height);
  ctx.save();
  ctx.translate(dc.width / 2, dc.height / 2);
  ctx.rotate((rotation90 * Math.PI) / 180);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceImage, -sw / 2, -sh / 2);
  ctx.restore();

  deps.setDisplayCanvas(dc);
}