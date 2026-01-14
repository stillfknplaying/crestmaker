import type { GameTemplate } from "../types/types";

// Game UI preview templates (screenshots)

export const GAME_TEMPLATE_24: GameTemplate = {
  src: "/templates/l2_nameplate_01.jpg",
  baseW: 2560,
  baseH: 1440,
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
