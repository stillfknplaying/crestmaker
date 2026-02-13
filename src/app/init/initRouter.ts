import type { Lang } from "../../i18n";
import { initPolicyLangEvents } from "../policyEvents";
import { initRoutes } from "../routes";

type RouterDeps = {
  routeRoot: HTMLElement;
  setLang: (lang: Lang) => void;
  getLang: () => Lang;
  t: (en: string, ru: string, ua: string) => string;
  escapeHtml: (s: string) => string;
  pages: {
    privacy: (lang: Lang) => string;
    terms: (lang: Lang) => string;
    gdpr: (lang: Lang) => string;
    guide: (lang: Lang) => string;
    cookies: (lang: Lang) => string;
    icons: (lang: Lang) => string;
  };
  renderToolPage: () => void;
};

/**
 * Initializes routes (policies, guide, faq, SEO landings) and language switching.
 */
export function initAppRouter(deps: RouterDeps) {
  initPolicyLangEvents({ routeRoot: deps.routeRoot as HTMLDivElement, setLang: deps.setLang });

  const router = initRoutes({
    routeRoot: deps.routeRoot as HTMLDivElement,
    getLang: deps.getLang,
    setLangFromRouter: deps.setLang,
    t: deps.t,
    escapeHtml: deps.escapeHtml,
    pages: deps.pages,
    renderToolPage: deps.renderToolPage,
  });

  return router;
}
