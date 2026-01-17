import type { ToolState } from "./state";
import type { CrestMode } from "../types/types";
import { exportBmp } from "../post/postProcess";

function makeFile(blob: Blob, name: string): File {
  // Some platforms are picky about mime types, but image/bmp is usually fine.
  return new File([blob], name, { type: blob.type || "image/bmp" });
}

export function canWebShareFiles(): boolean {
  // navigator.share exists on many desktop browsers too, but file sharing support varies.
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function webShareFromState(
  state: ToolState,
  crestMode: CrestMode,
  text: string
): Promise<boolean> {
  const palette = state.palette256;
  if (!palette) return false;

  const h = 12;
  const files: File[] = [];

  // Current size only (as requested):
  // - 24×12 mode => combined_24x12
  // - 16×12 mode => clan_16x12
  if (crestMode === "only_clan") {
    const clan = state.iconClan16x12Indexed;
    if (!clan) return false;
    const clanBmp = exportBmp(16, h, palette, clan);
    files.push(makeFile(clanBmp, "clan_16x12_256.bmp"));
  } else {
    const combined = state.iconCombined24x12Indexed;
    if (!combined) return false;
    const combinedBmp = exportBmp(24, h, palette, combined);
    files.push(makeFile(combinedBmp, "combined_24x12_256.bmp"));
  }

  if (!canWebShareFiles()) return false;

  // Best-effort compatibility check.
  const canShare =
    typeof (navigator as any).canShare === "function" ? (navigator as any).canShare({ files }) : true;
  if (!canShare) return false;

  try {
    await navigator.share({
      title: "CrestMaker",
      text,
      files,
    } as any);
    return true;
  } catch {
    // User canceled / not supported / blocked.
    return false;
  }
}
