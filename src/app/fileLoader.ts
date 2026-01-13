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
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  const u = url.trim();
  if (!u) {
    throw new Error("URL is empty");
  }

  // Support data URLs (e.g. data:image/png;base64,...) so users can paste images directly.
  // fetch() supports data: URLs in modern browsers.
  if (u.startsWith("data:")) {
    const res = await fetch(u);
    if (!res.ok) {
      throw new Error(`Failed to fetch image (${res.status})`);
    }
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) {
      throw new Error("URL did not return an image");
    }
    return loadImageFromBlob(blob);
  }

  // Allow both absolute http(s) URLs and same-origin relative paths.
  // This is important for built-in templates like /templates/...
  let resolved: URL;
  try {
    resolved = new URL(u, window.location.href);
  } catch {
    throw new Error("Invalid URL");
  }
  // Allow http(s) and same-origin relative URLs resolved against the current page.
  // Other protocols are not supported here.
  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new Error("URL must be http(s)");
  }

  // Use fetch -> blob -> objectURL so the resulting canvas is not tainted.
  // This still requires CORS from the remote server (otherwise fetch will fail).
  const res = await fetch(resolved.toString(), { mode: "cors" });
  if (!res.ok) {
    throw new Error(`Failed to fetch image (${res.status})`);
  }
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("URL did not return an image");
  }
  return loadImageFromBlob(blob);
}
