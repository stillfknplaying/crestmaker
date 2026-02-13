// src/app/routes.ts
import type { Lang } from "../i18n";
import { initDeferredMedia } from "../ui/deferredMedia";

export type RouterInit = {
  routeRoot: HTMLDivElement;
  getLang: () => Lang;
  setLangFromRouter: (lang: Lang) => void;
  t: (en: string, ru: string, ua: string) => string;
  escapeHtml: (s: string) => string;
  pages: {
    privacy: (lang: Lang) => string;
    terms: (lang: Lang) => string;
    about: (lang: Lang) => string;
    gdpr: (lang: Lang) => string;
    faq: (lang: Lang) => string;
    guide: (lang: Lang) => string;
    cookies: (lang: Lang) => string;
    icons: (lang: Lang) => string;
    seo: {
      lineage2CrestMaker: (lang: Lang) => string;
      createClanCrest: (lang: Lang) => string;
      requirements16x12: (lang: Lang) => string;
      alliance24x12: (lang: Lang) => string;
    };
  };
  renderToolPage: () => void;
};

type ParsedPath = { lang: Lang; route: string };

const LANGS: Lang[] = ["en", "ru", "ua"];

function parsePathname(pathname: string, fallbackLang: Lang): ParsedPath {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const parts = clean.split("/").filter(Boolean); // no empty
  const first = parts[0] as Lang | undefined;
  if (first && (LANGS as string[]).includes(first)) {
    const rest = "/" + parts.slice(1).join("/");
    return { lang: first, route: rest === "/" ? "/" : rest };
  }
  return { lang: fallbackLang, route: clean };
}

function buildPath(lang: Lang, route: string) {
  const r = route.startsWith("/") ? route : "/" + route;
  if (r === "/") return `/${lang}/`;
  return `/${lang}${r}`;
}

export function initRoutes(cfg: RouterInit) {

  function renderDocPage(title: string, html: string, lang: Lang, route: string) {
    cfg.routeRoot.innerHTML = `
      <section class="page">
        <div class="page-head">
          <h2>${cfg.escapeHtml(title)}</h2>
          <div class="page-actions">
            <div class="btn-group lang-group">
              <button class="btn ${lang === "en" ? "active" : ""}" data-lang="en" data-route="${cfg.escapeHtml(route)}">EN</button>
              <button class="btn ${lang === "ru" ? "active" : ""}" data-lang="ru" data-route="${cfg.escapeHtml(route)}">RU</button>
              <button class="btn ${lang === "ua" ? "active" : ""}" data-lang="ua" data-route="${cfg.escapeHtml(route)}">UA</button>
            </div>
            <a class="btn back-link" href="${buildPath(lang, "/")}">← ${cfg.escapeHtml(cfg.t("Back","Назад","Назад"))}</a>
          </div>
        </div>

        <article class="md">${html}</article>
      </section>
    `;
    initDeferredMedia(cfg.routeRoot);
  }

  function ensureLangInUrl(parsed: ParsedPath) {
    // If URL doesn't have locale prefix, normalize it to /{lang}/...
    const hasPrefix = /^\/(en|ru|ua)(\/|$)/.test(window.location.pathname);
    if (!hasPrefix) {
      const target = buildPath(parsed.lang, parsed.route);
      window.history.replaceState({}, "", target + window.location.search + window.location.hash);
    }
  }

  function renderRoute() {
    window.scrollTo(0, 0);

    const fallback = cfg.getLang();
    const parsed = parsePathname(window.location.pathname, fallback);

    // Keep i18n state aligned with URL locale (without re-pushing history).
    if (parsed.lang !== cfg.getLang()) {
      cfg.setLangFromRouter(parsed.lang);
    }

    ensureLangInUrl(parsed);

    const lang = parsed.lang;
    const route = parsed.route || "/";

    // Static docs pages
    if (route === "/privacy") {
      return renderDocPage(
        cfg.t("Privacy Policy", "Политика конфиденциальности", "Політика конфіденційності"),
        cfg.pages.privacy(lang),
        lang,
        route
      );
    }
    if (route === "/terms") {
      return renderDocPage(
        cfg.t("Terms of Service", "Пользовательское соглашение", "Умови користування"),
        cfg.pages.terms(lang),
        lang,
        route
      );
    }
    if (route === "/about") {
      return renderDocPage(
        cfg.t("About", "О проекте", "Про проєкт"),
        cfg.pages.about(lang),
        lang,
        route
      );
    }
    if (route === "/gdpr") {
      return renderDocPage("GDPR", cfg.pages.gdpr(lang), lang, route);
    }
    if (route === "/cookies") {
      return renderDocPage(
        cfg.t("Cookies", "Cookies", "Cookies"),
        cfg.pages.cookies(lang),
        lang,
        route
      );
    }
    if (route === "/icons") {
      return renderDocPage(
        cfg.t("Ready crests", "Готовые эмблемы", "Готові емблеми"),
        cfg.pages.icons(lang),
        lang,
        route
      );
    }
    if (route === "/faq") {
      return renderDocPage(cfg.t("FAQ", "FAQ", "FAQ"), cfg.pages.faq(lang), lang, route);
    }
    if (route === "/guide" || route === "/how-to-use") {
      return renderDocPage(
        cfg.t("How to use", "Как пользоваться", "Як користуватися"),
        cfg.pages.guide(lang),
        lang,
        "/guide"
      );
    }

    // SEO landing routes (same layout + localized content)
    if (route === "/lineage-2-crest-maker") {
      return renderDocPage(
        cfg.t("Lineage 2 Crest Maker", "Lineage 2 Crest Maker", "Lineage 2 Crest Maker"),
        cfg.pages.seo.lineage2CrestMaker(lang),
        lang,
        route
      );
    }
    if (route === "/create-lineage-2-clan-crest") {
      return renderDocPage(
        cfg.t("Create Lineage 2 clan crest", "Создать клановый значок Lineage 2", "Створити клановий значок Lineage 2"),
        cfg.pages.seo.createClanCrest(lang),
        lang,
        route
      );
    }
    if (route === "/l2-crest-16x12-bmp-requirements") {
      return renderDocPage(
        cfg.t("16x12 BMP requirements", "Требования 16x12 BMP", "Вимоги 16x12 BMP"),
        cfg.pages.seo.requirements16x12(lang),
        lang,
        route
      );
    }
    if (route === "/l2-alliance-crest-24x12-bmp") {
      return renderDocPage(
        cfg.t("Alliance crest 24x12", "Эмблема союза 24x12", "Емблема альянсу 24x12"),
        cfg.pages.seo.alliance24x12(lang),
        lang,
        route
      );
    }

    // Default: tool page
    return cfg.renderToolPage();
  }

  function setLangInUrl(nextLang: Lang) {
    const parsed = parsePathname(window.location.pathname, cfg.getLang());
    const next = buildPath(nextLang, parsed.route);
    window.history.replaceState({}, "", next + window.location.search + window.location.hash);
  }

  return { renderRoute, setLangInUrl, buildPath };
}
