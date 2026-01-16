import { SITE_NAME } from "./constants";

export type ShellRefs = {
  routeRoot: HTMLDivElement;
};

/**
 * Renders the static shell (header/footer/layout) into #app.
 * Tool/routes are rendered into #routeRoot by the router.
 */
export function renderShell(app: HTMLElement): ShellRefs {
  app.innerHTML = `
    <div class="wrap">
      <header class="header">
        <div class="brand">
          <a data-testid="brand-home" class="brand-link" href="#/" aria-label="Go to home">
            <h1>${SITE_NAME}</h1>
          </a>
          <p class="muted hidden">BMP 8-bit (256-color) emblem converter — 24×12 (ally 8×12 + clan 16×12).</p>
        </div>

        <div class="top-actions">
          <label class="toggle compact" title="Switch theme">
            <span>Dark</span>
            <input id="themeToggle" type="checkbox" />
            <span class="track"><span class="thumb"></span></span>
            <span>Light</span>
          </label>
        </div>
      </header>

      <main id="routeRoot"></main>

      <footer class="footer">
        <nav class="footer-links">
          <a href="#/">Tool</a>
          <a href="#/guide">Guide</a>
          <a href="#/about">About</a>
          <a href="#/faq">FAQ</a>
          <a href="#/privacy">Privacy Policy</a>
          <a href="#/terms">Terms of Service</a>
          <a href="#/gdpr">GDPR</a>
          <a data-testid="cookie-settings-link" href="#" id="cookieSettingsLink">Cookies</a>
        </nav>

          <div class="footer-contact">
           Contact:
            <a href="mailto:admin@crestmaker.org">admin@crestmaker.org</a>
           </div>

        <div class="footer-copy">
          <span id="year"></span> © ${SITE_NAME}. All rights reserved.
        </div>
      </footer>

      <div data-testid="cookie-root" id="cookieRoot"></div>

      <div data-testid="cookie-modal" id="cookieModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle">
        <div class="modal-card">
          <h3 id="cookieModalTitle">Cookie preferences</h3>
          <p class="muted" id="cookieModalDesc"></p>

          <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
            <label class="toggle" style="justify-content:space-between;">
              <span><b id="cookieEssentialTitle">Essential</b><br/><span class="muted" id="cookieEssentialDesc"></span></span>
              <span style="display:flex; gap:8px; align-items:center;">
                <span class="muted" id="cookieEssentialAlways">Always on</span>
                <input id="cookieEssential" type="checkbox" checked disabled />
                <span class="track"><span class="thumb"></span></span>
              </span>
            </label>

            <label class="toggle" style="justify-content:space-between;">
              <span><b id="cookieAnalyticsTitle">Analytics</b><br/><span class="muted" id="cookieAnalyticsDesc"></span></span>
              <input id="cookieAnalytics" type="checkbox" />
              <span class="track"><span class="thumb"></span></span>
            </label>

            <label class="toggle" style="justify-content:space-between;">
              <span><b id="cookieAdsTitle">Advertising</b><br/><span class="muted" id="cookieAdsDesc"></span></span>
              <input id="cookieAds" type="checkbox" />
              <span class="track"><span class="thumb"></span></span>
            </label>
          </div>

          <div class="modal-actions">
            <button data-testid="cookie-cancel" id="cookieCancel" class="btn">Cancel</button>
            <button data-testid="cookie-save" id="cookieSave" class="btn primary">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Keep year injection centralized in the shell
  const yearEl = document.querySelector<HTMLSpanElement>("#year")!;
  yearEl.textContent = String(new Date().getFullYear());

  const routeRoot = document.querySelector<HTMLDivElement>("#routeRoot")!;

  return { routeRoot };
}
