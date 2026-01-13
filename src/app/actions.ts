import type { ToolRefs } from "./dom";
import type { CropRect, CropDragMode } from "../types/types";
import type { ToolState } from "./state";
import type { CropController } from "../ui/crop";

export function setRefs(state: ToolState, refs: ToolRefs | null) {
  state.refs = refs;
}

export function setCropController(state: ToolState, ctrl: CropController | null) {
  state.cropController = ctrl;
}

export function setSourceImage(state: ToolState, img: HTMLImageElement | null) {
  state.sourceImage = img;
}

export function setDisplayCanvas(state: ToolState, c: HTMLCanvasElement | null) {
  state.displayCanvas = c;
}

export function setRotation90(state: ToolState, rot: 0 | 90 | 180 | 270) {
  state.rotation90 = rot;
}

export function setInvertColors(state: ToolState, inv: boolean) {
  state.invertColors = inv;
}

export function setCropRect(state: ToolState, rect: CropRect | null) {
  state.cropRect = rect;
}

export function setCropDragMode(state: ToolState, mode: CropDragMode) {
  state.cropDragMode = mode;
}

export function setDragStart(state: ToolState, v: { mx: number; my: number; x: number; y: number }) {
  state.dragStart = v;
}

export function setDragAnchor(
  state: ToolState,
  v: { ax: number; ay: number; start: { x: number; y: number; w: number; h: number } }
) {
  state.dragAnchor = v;
}

export function setPalette256(state: ToolState, p: Uint8Array | null) {
  state.palette256 = p;
}

export function setIconAlly8(state: ToolState, v: Uint8Array | null) {
  state.iconAlly8x12Indexed = v;
}

export function setIconClan16(state: ToolState, v: Uint8Array | null) {
  state.iconClan16x12Indexed = v;
}

export function setIconCombined24(state: ToolState, v: Uint8Array | null) {
  state.iconCombined24x12Indexed = v;
}

export function setGameTemplateImg(state: ToolState, img: HTMLImageElement | null) {
  state.gameTemplateImg = img;
}

export function setLoadedTemplateSrc(state: ToolState, src: string | null) {
  state.loadedTemplateSrc = src;
}
