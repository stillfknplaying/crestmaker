export function initDeferredMedia(root: HTMLElement) {
  // Loads heavy media only when a spoiler is opened and stops playback when closed.
  const spoilers = Array.from(root.querySelectorAll<HTMLDetailsElement>("details.spoiler"));

  for (const d of spoilers) {
    d.addEventListener("toggle", () => {
      if (d.open) {
        // Images
        for (const img of Array.from(d.querySelectorAll<HTMLImageElement>("img[data-src]"))) {
          if (!img.getAttribute("src")) {
            const src = img.dataset.src;
            if (src) img.setAttribute("src", src);
          }
        }

        // Iframe (YouTube) lazy-load
        for (const iframe of Array.from(d.querySelectorAll<HTMLIFrameElement>("iframe[data-src]"))) {
          if (!iframe.getAttribute("src")) {
            const src = (iframe as any).dataset?.src as string | undefined;
            if (src) iframe.setAttribute("src", src);
          }
        }

        // Video (single src)
        for (const v of Array.from(d.querySelectorAll<HTMLVideoElement>("video[data-src]"))) {
          if (!v.getAttribute("src")) {
            const src = v.dataset.src;
            if (src) v.setAttribute("src", src);
          }
          if (v.preload === "none") v.preload = "metadata";
          try { v.load(); } catch { /* noop */ }
        }

        // <source data-src="..."> inside video (supported as well)
        for (const s of Array.from(d.querySelectorAll<HTMLSourceElement>("source[data-src]"))) {
          if (!s.getAttribute("src")) {
            const src = (s as any).dataset?.src as string | undefined;
            if (src) s.setAttribute("src", src);
          }
          const video = s.closest("video");
          if (video) {
            if (video.preload === "none") video.preload = "metadata";
            try { video.load(); } catch { /* noop */ }
          }
        }

        return;
      }

      // Closed: stop playback (YouTube iframes + videos)
      for (const v of Array.from(d.querySelectorAll<HTMLVideoElement>("video"))) {
        try { v.pause(); } catch { /* noop */ }
        try { v.currentTime = 0; } catch { /* noop */ }
      }

      for (const iframe of Array.from(d.querySelectorAll<HTMLIFrameElement>("iframe"))) {
        const hasData = (iframe as any).dataset?.src;
        if (!hasData) continue; // only manage lazy iframes
        // Remove src to stop playback; keep data-src so it can be restored on next open.
        iframe.removeAttribute("src");
      }
    });
  }
}
