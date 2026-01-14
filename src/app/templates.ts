import type { GameTemplate } from "../types/types";

// Game UI preview templates (screenshots)
// 24×12 uses the original, 16×12 uses the second one.
// Slot coords are the same (both screenshots are the same resolution/UI).

export const GAME_TEMPLATE_24: GameTemplate = {
  src: "/templates/l2_nameplate_01.jpg",
  baseW: 2560,
  baseH: 1440,
  // NOTE: user tuned to match screenshot
  slotX: 1160,
  slotY: 218,
  slotW: 48,
  slotH: 24,
};

export const GAME_TEMPLATE_16: GameTemplate = {
  src: "/templates/l2_nameplate_02.jpg",
  baseW: 2560,
  baseH: 1440,
  slotX: 1164,
  slotY: 218,
  slotW: 36,
  slotH: 24,
};

export function getGameTemplate(mode: "24x12" | "16x12"): GameTemplate {
  return mode === "16x12" ? GAME_TEMPLATE_16 : GAME_TEMPLATE_24;
}
