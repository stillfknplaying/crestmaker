import type { ToolState } from "./state";
import type { CrestMode } from "../types/types";
import { downloadBMPs, downloadBlob, makeBmp8bitIndexed } from "../bmp/writer";

/**
 * Downloads controller (export-only).
 *
 * Keep all BMP building / download side-effects out of main.ts.
 * No DOM refs required here.
 */

export function hasPalette(state: ToolState): boolean {
  return !!state.palette256;
}

export function downloadCurrentMode(state: ToolState, mode: CrestMode): void {
  const palette = state.palette256;
  if (!palette) return;

  if (mode === "only_clan") {
    const clan = state.iconClan16x12Indexed;
    if (!clan) return;
    const clanBmp = makeBmp8bitIndexed(16, 12, palette, clan);
    downloadBlob(clanBmp, "clan_16x12_256.bmp");
    return;
  }

  const ally = state.iconAlly8x12Indexed;
  const clan = state.iconClan16x12Indexed;
  const combined = state.iconCombined24x12Indexed;
  if (!ally || !clan || !combined) return;

  downloadBMPs(ally, clan, combined, palette);
}
