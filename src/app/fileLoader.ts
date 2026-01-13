/**
 * Client-side image loading helpers.
 *
 * This module is intentionally UI-agnostic:
 * - No DOM refs
 * - No app state
 * - No pipeline calls
 *
 * It only turns user inputs (File / Clipboard / DataTransfer / URL) into an HTMLImageElement.
 */

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return loadImageFromBlob(file);
}

export async function loadImageFromDataTransfer(dt: DataTransfer | null): Promise<HTMLImageElement | null> {
  if (!dt) return null;

  const file = Array.from(dt.files || []).find((f) => f.type.startsWith("image/"));
  if (!file) return null;
  return loadImageFromFile(file);
}

export async function loadImageFromClipboardEvent(e: ClipboardEvent): Promise<HTMLImageElement | null> {
  const items = e.clipboardData?.items;
  if (!items || items.length === 0) return null;

  for (const it of Array.from(items)) {
    // Clipboard items may expose images as a file
    if (it.kind === "file") {
      const file = it.getAsFile();
      if (file && file.type.startsWith("image/")) {
        return loadImageFromFile(file);
      }
    }
  }
  return null;
}

// Optional helper for future "load by URL" feature.
// NOTE: CORS may block pixel access if the server does not allow it.
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image: " + url));
    img.src = url;
  });
}
