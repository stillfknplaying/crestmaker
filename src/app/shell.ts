import { SITE_NAME } from "./constants";
import type { Lang } from "../i18n";

export type ShellRefs = {
  routeRoot: HTMLDivElement;
  applyLinks: (lang: Lang) => void;
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
          <a data-testid="brand-home" class="brand-link" href="/" aria-label="Go to home">
            <h1 class="brand-title">
              <img
                class="brand-logo"
                src="/icons/crestmaker.svg"
                alt="${SITE_NAME}"
                height="28"
                loading="eager"
                decoding="async"
              />
            </h1>
          </a>
          <p class="muted hidden">BMP 8-bit (256-color) emblem converter - 24×12 (ally 8×12 + clan 16×12).</p>
        </div>

        <div class="top-actions">
          <label class="toggle compact" title="Switch theme">
            <img class="ico" src="/icons/theme-dark.svg" width="16" height="16" alt="Dark"/>
            <input id="themeToggle" type="checkbox" />
            <span class="track"><span class="thumb"></span></span>
            <img class="ico" src="/icons/theme-light.svg" width="16" height="16" alt="Light"/>
          </label>
        </div>
      </header>

      <main id="routeRoot"></main>

      <footer class="footer">
        <div class="footer-brand">
          <a data-testid="footer-home" href="/" aria-label="CrestMaker home">
            <img
              src="/icons/crestmaker.svg"
              alt="CrestMaker"
              class="footer-logo"
              width="16"
              height="16"
              loading="lazy"
            />
          </a>
        </div>

        <nav class="footer-links">
          <a data-testid="footer-guide" href="/guide">Guide</a>
          <a data-testid="footer-icons" href="/icons">Icons</a>
          <a data-testid="footer-privacy" href="/privacy">Privacy</a>
          <a data-testid="footer-terms" href="/terms">Terms</a>
          <a data-testid="footer-gdpr" href="/gdpr">GDPR</a>
          <a data-testid="footer-cookies" href="/cookies">Cookies</a>
        </nav>

        <div class="footer-share" aria-label="Share CrestMaker">
          <a id="shareTelegramLink" href="#" target="_blank" rel="noopener noreferrer" title="Share on Telegram" aria-label="Share on Telegram">
            <img class="ico" src="/icons/telegram.svg" alt="Telegram" width="16" height="16" loading="lazy" />
          </a>
          <a id="shareXLink" href="#" target="_blank" rel="noopener noreferrer" title="Share on X" aria-label="Share on X">
            <img class="ico" src="/icons/x.svg" alt="X" width="16" height="16" loading="lazy" />
          </a>
        
          <a id="shareFacebookLink" href="#" target="_blank" rel="noopener noreferrer" title="Share on Facebook" aria-label="Share on Facebook">
            <img class="ico" src="/icons/facebook.svg" alt="Facebook" width="16" height="16" loading="lazy" />
          </a>
          <a id="shareWhatsAppLink" href="#" target="_blank" rel="noopener noreferrer" title="Share on WhatsApp" aria-label="Share on WhatsApp">
            <img class="ico" src="/icons/whatsapp.svg" alt="WhatsApp" width="16" height="16" loading="lazy" />
          </a>
</div>

        <div class="footer-contact">
          <a class="footer-email" href="mailto:admin@crestmaker.org" aria-label="Email">
            <img class="ico" src="/icons/gmail.svg" width="16" height="16" alt="Email" loading="lazy" />
            <span>admin@crestmaker.org</span>
          </a>
        </div>

        <div class="footer-copy">
          <span>2026 © CrestMaker. All rights reserved.</span>
        </div>
      </footer>

      <!-- Cookie consent -->
      <div id="cookieRoot"></div>

      <div id="cookieModal" data-testid="cookie-modal" class="modal hidden" aria-hidden="true">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle">
          <h3 id="cookieModalTitle">Cookie preferences</h3>
          <p id="cookieModalDesc" class="muted"></p>

          <div class="cookie-prefs">
            <div class="cookie-pref cookie-pref-essential">
              <div class="cookie-pref-top">
                <div class="cookie-pref-title">
                  <strong id="cookieEssentialTitle">Essential</strong>
                  <div id="cookieEssentialAlways" class="muted cookie-pref-note"></div>
                </div>
                <label class="toggle cookie-toggle" aria-label="Essential cookies">
                  <input id="cookieEssential" type="checkbox" checked disabled />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
              <div id="cookieEssentialDesc" class="muted cookie-pref-desc"></div>
            </div>

            <div class="cookie-pref">
              <div class="cookie-pref-top">
                <div class="cookie-pref-title">
                  <strong id="cookieAnalyticsTitle">Analytics</strong>
                </div>
                <label class="toggle cookie-toggle" aria-label="Analytics cookies">
                  <input id="cookieAnalytics" type="checkbox" />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
              <div id="cookieAnalyticsDesc" class="muted cookie-pref-desc"></div>
            </div>

            <div class="cookie-pref">
              <div class="cookie-pref-top">
                <div class="cookie-pref-title">
                  <strong id="cookieAdsTitle">Advertising</strong>
                </div>
                <label class="toggle cookie-toggle" aria-label="Advertising cookies">
                  <input id="cookieAds" type="checkbox" />
                  <span class="track"><span class="thumb"></span></span>
                </label>
              </div>
              <div id="cookieAdsDesc" class="muted cookie-pref-desc"></div>
            </div>
          </div>

          <div class="modal-actions">
            <button data-testid="cookie-cancel" class="btn" id="cookieCancel">Cancel</button>
            <button data-testid="cookie-save" class="btn primary" id="cookieSave">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const routeRoot = app.querySelector<HTMLDivElement>("#routeRoot")!;

  const applyLinks = (lang: Lang) => {
    const prefix = `/${lang}`;
    const norm = (p: string) => (p === "/" ? `${prefix}/` : `${prefix}${p}`);

    const brand = app.querySelector<HTMLAnchorElement>('[data-testid="brand-home"]');
    if (brand) brand.href = norm("/");

    const footerHome = app.querySelector<HTMLAnchorElement>('[data-testid="footer-home"]');
    if (footerHome) footerHome.href = norm("/");

    const map: Array<[string, string]> = [
      ["footer-guide", "/guide"],
      ["footer-icons", "/icons"],
      ["footer-privacy", "/privacy"],
      ["footer-terms", "/terms"],
      ["footer-gdpr", "/gdpr"],
      ["footer-cookies", "/cookies"],
    ];

    for (const [testid, path] of map) {
      const a = app.querySelector<HTMLAnchorElement>(`[data-testid="${testid}"]`);
      if (a) a.href = norm(path);
    }
  };

  return { routeRoot, applyLinks };
}
