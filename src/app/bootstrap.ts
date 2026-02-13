// src/app/bootstrap.ts
// Centralized application bootstrap & lifecycle events

type Deps = {
  boot: () => void;
  renderRoute: () => void;
};

let initialized = false;

function isSameOrigin(url: URL) {
  return url.origin === window.location.origin;
}

function isFileLikePath(pathname: string) {
  // Ignore direct links to files/assets.
  return /\.[a-z0-9]{2,5}$/i.test(pathname);
}

export function initBootstrap({ boot, renderRoute }: Deps) {
  if (initialized) return;
  initialized = true;

  const onReady = () => {
    boot();
    renderRoute();
  };

  // History-based SPA routing
  window.addEventListener("popstate", () => {
    renderRoute();
  });

  // Intercept internal navigation clicks (same-origin anchors)
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;

    const a = t.closest("a") as HTMLAnchorElement | null;
    if (!a) return;

    // Respect explicit behavior
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;

    const href = a.getAttribute("href");
    if (!href) return;

    // Allow hash links (in-page anchors / legacy hash routes)
    if (href.startsWith("#")) return;
    // Allow tel/mailto/etc
    if (/^(mailto:|tel:|sms:|javascript:)/i.test(href)) return;

    let url: URL;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }

    if (!isSameOrigin(url)) return;
    if (isFileLikePath(url.pathname)) return;

    // Only left click without modifiers
    if ((e as MouseEvent).button !== 0) return;
    if ((e as MouseEvent).metaKey || (e as MouseEvent).ctrlKey || (e as MouseEvent).shiftKey || (e as MouseEvent).altKey) return;

    e.preventDefault();
    window.history.pushState({}, "", url.pathname + url.search + url.hash);
    renderRoute();
  });

  // Handle initial load safely (even if script loaded late)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }
}
