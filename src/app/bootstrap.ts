// src/app/bootstrap.ts
// Centralized application bootstrap & lifecycle events

type Deps = {
  boot: () => void;
  renderRoute: () => void;
};

let initialized = false;

export function initBootstrap({ boot, renderRoute }: Deps) {
  if (initialized) return;
  initialized = true;

  const onReady = () => {
    boot();
    renderRoute();
  };

  // Handle hash-based routing
  window.addEventListener("hashchange", () => {
    renderRoute();
  });

  // Handle initial load safely (even if script loaded late)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    // DOM already ready
    onReady();
  }
}