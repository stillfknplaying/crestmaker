import { parseBmp8bitIndexed } from "../bmp/reader";
import { downloadBMPs, downloadBlob } from "../bmp/writer";
import { exportBmp } from "../post/postProcess";

let bound = false;

function split24x12(indices: Uint8Array) {
  const clan = new Uint8Array(16 * 12);
  const ally = new Uint8Array(8 * 12);
  for (let y = 0; y < 12; y++) {
    const rowOff = y * 24;
    // LEFT 8x12 = alliance, RIGHT 16x12 = clan
    ally.set(indices.subarray(rowOff, rowOff + 8), y * 8);
    clan.set(indices.subarray(rowOff + 8, rowOff + 24), y * 16);
  }
  return { clan, ally };
}

export function initIconsGallery() {
  if (bound) return;
  bound = true;

  document.addEventListener("click", async (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;

    const a = t.closest<HTMLAnchorElement>("a[data-gallery-bmp='1']");
    if (!a) return;

    // Only handle on /{lang}/icons
    if (!document.querySelector("[data-icons-gallery='1']")) return;

    const href = a.getAttribute("href");
    if (!href) return;
    e.preventDefault();

    try {
      const res = await fetch(href, { cache: "force-cache" });
      if (!res.ok) throw new Error(`Failed to fetch BMP: ${res.status}`);
      const buf = await res.arrayBuffer();
      const bmp = parseBmp8bitIndexed(buf);

      if (bmp.width === 24 && bmp.height === 12) {
        const { clan, ally } = split24x12(bmp.indices);
        downloadBMPs(ally, clan, bmp.indices, bmp.paletteRGB);
        return;
      }

      if (bmp.width === 16 && bmp.height === 12) {
        const blob = exportBmp(16, 12, bmp.paletteRGB, bmp.indices);
        downloadBlob(blob, "clan_16x12_256.bmp");
        return;
      }

      if (bmp.width === 8 && bmp.height === 12) {
        const blob = exportBmp(8, 12, bmp.paletteRGB, bmp.indices);
        downloadBlob(blob, "alliance_8x12_256.bmp");
        return;
      }

      // Fallback: download original
      downloadBlob(new Blob([buf], { type: "image/bmp" }), a.getAttribute("download") || "crest.bmp");
    } catch (err) {
      console.error(err);
      // If something goes wrong, fallback to the direct download behavior
      window.location.href = href;
    }
  });
}
