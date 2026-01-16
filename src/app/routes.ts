// src/app/routes.ts
import type { Lang } from "../i18n";

export type RouterInit = {
  routeRoot: HTMLDivElement;
  getLang: () => Lang;
  t: (en: string, ru: string, ua: string) => string;
  escapeHtml: (s: string) => string;
  pages: {
    privacy: (lang: Lang) => string;
    terms: (lang: Lang) => string;
    about: (lang: Lang) => string;
    gdpr: (lang: Lang) => string;
    faq: (lang: Lang) => string;
    guide: (lang: Lang) => string;
  };
  renderToolPage: () => void;
};

export function initRoutes(cfg: RouterInit) {
  function initDeferredMedia(root: HTMLElement) {
    // Loads heavy media only when a spoiler is opened.
    const spoilers = Array.from(root.querySelectorAll<HTMLDetailsElement>("details.spoiler"));
    for (const d of spoilers) {
      d.addEventListener("toggle", () => {
        if (!d.open) return;

        // Images
        for (const img of Array.from(d.querySelectorAll<HTMLImageElement>("img[data-src]"))) {
          if (!img.getAttribute("src")) {
            const src = img.dataset.src;
            if (src) img.setAttribute("src", src);
          }
        }

        // Video (single src)
        for (const v of Array.from(d.querySelectorAll<HTMLVideoElement>("video[data-src]"))) {
          if (!v.getAttribute("src")) {
            const src = v.dataset.src;
            if (src) v.setAttribute("src", src);
          }
          // Encourage the browser to start fetching metadata once opened.
          if (v.preload === "none") v.preload = "metadata";
          // Ensure the browser re-evaluates sources after we assign src.
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
      });
    }
  }

  function renderPolicyPage(title: string, html: string) {
    const currentLang = cfg.getLang();

    cfg.routeRoot.innerHTML = `
      <section class="page">
        <div class="page-head">
          <h2>${cfg.escapeHtml(title)}</h2>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <div class="btn-group" style="display:flex; gap:8px;">
              <button class="btn ${currentLang === "en" ? "active" : ""}" data-lang="en">EN</button>
              <button class="btn ${currentLang === "ru" ? "active" : ""}" data-lang="ru">RU</button>
              <button class="btn ${currentLang === "ua" ? "active" : ""}" data-lang="ua">UA</button>
            </div>
            <a class="btn" href="#/">← ${cfg.escapeHtml(cfg.t("Back to tool","Назад к инструменту","Назад до інструмента"))}</a>
          </div>
        </div>

        <article class="md">${html}</article>
      </section>
    `;
    // Важно: здесь НЕТ addEventListener для кнопок языка.
    // Это делается делегированием в src/app/policyEvents.ts (initPolicyLangEvents).

    // If the page contains deferred media (guide), activate handlers.
    initDeferredMedia(cfg.routeRoot);
  }

  function renderRoute() {
    // When navigating between routes in SPA, always reset viewport.
    window.scrollTo(0, 0);

    const hash = (location.hash || "#/").replace(/^#/, "");
    const path = hash.startsWith("/") ? hash : "/" + hash;

    const lang = cfg.getLang();

    if (path === "/privacy") {
      return renderPolicyPage(
        cfg.t("Privacy Policy", "Политика конфиденциальности", "Політика конфіденційності"),
        cfg.pages.privacy(lang)
      );
    }
    if (path === "/terms") {
      return renderPolicyPage(
        cfg.t("Terms of Service", "Пользовательское соглашение", "Умови користування"),
        cfg.pages.terms(lang)
      );
    }
    if (path === "/about") {
      return renderPolicyPage(
        cfg.t("About", "О проекте", "Про проєкт"),
        cfg.pages.about(lang)
      );
    }
    if (path === "/gdpr") {
      return renderPolicyPage("GDPR", cfg.pages.gdpr(lang));
    }

    if (path === "/faq") {
      return renderPolicyPage(
        cfg.t("FAQ", "FAQ", "FAQ"),
        cfg.pages.faq(lang)
      );
    }

    if (path === "/guide" || path === "/how-to-use") {
      return renderPolicyPage(
        cfg.t("How to use", "Как пользоваться", "Як користуватися"),
        cfg.pages.guide(lang)
      );
    }

    return cfg.renderToolPage();
  }

  return { renderRoute };
}