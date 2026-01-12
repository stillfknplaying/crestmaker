import type { Lang } from "../i18n";

type RouterInit = {
  routeRoot: HTMLDivElement;
  getLang: () => Lang;
  setLang: (lang: Lang) => void;
  t: (en: string, ru: string, ua: string) => string;
  escapeHtml: (s: string) => string;
  pages: {
    privacy: (lang: Lang) => string;
    terms: (lang: Lang) => string;
    about: (lang: Lang) => string;
    gdpr: (lang: Lang) => string;
  };
  renderToolPage: () => void;
};

function pathFromHash(): string {
  const hash = (location.hash || "#/").replace(/^#/, "");
  return hash.startsWith("/") ? hash : "/" + hash;
}

export function initRoutes(cfg: RouterInit) {
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

    cfg.routeRoot.querySelectorAll<HTMLButtonElement>("button[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => cfg.setLang(btn.dataset.lang as Lang));
    });
  }

  function renderRoute() {
    const path = pathFromHash();
    const lang = cfg.getLang();

    if (path === "/privacy") {
      return renderPolicyPage(cfg.t("Privacy Policy","Политика конфиденциальности","Політика конфіденційності"), cfg.pages.privacy(lang));
    }
    if (path === "/terms") {
      return renderPolicyPage(cfg.t("Terms of Service","Пользовательское соглашение","Умови користування"), cfg.pages.terms(lang));
    }
    if (path === "/about") {
      return renderPolicyPage(cfg.t("About","О проекте","Про проєкт"), cfg.pages.about(lang));
    }
    if (path === "/gdpr") {
      return renderPolicyPage("GDPR", cfg.pages.gdpr(lang));
    }

    return cfg.renderToolPage();
  }

  return { renderRoute };
}