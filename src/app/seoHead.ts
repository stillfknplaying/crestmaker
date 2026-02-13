import type { Lang } from "../i18n";

type Seo = { title: string; description: string };

type RouteKey = "/" | "/guide" | "/icons" | "/privacy" | "/terms" | "/gdpr" | "/cookies";

const SEO: Record<RouteKey, Record<Lang, Seo>> = {
  "/": {
    en: {
      title: "Lineage 2 Crest / Emblem / Icon Maker - Clan 16×12 + Alliance 8×12 (BMP 256)",
      description:
        "Create Lineage 2 clan crests and alliance emblems/icons online. Export 8‑bit BMP (256 colors): 16×12 for clan and 8×12 for alliance. Use 24×12 layout mode to design both parts together and download separate files.",
    },
    ru: {
      title: "Lineage 2: генератор эмблем/иконок - клан 16×12 + альянс 8×12 (BMP 256)",
      description:
        "Сделайте эмблему/значок/иконку для Lineage 2 онлайн. Экспорт в BMP 8‑bit (256 цветов): 16×12 для клана и 8×12 для альянса. Режим 24×12 - это разметка (клан+альянс): вы получаете отдельные файлы для загрузки в игру.",
    },
    ua: {
      title: "Lineage 2: генератор емблем/іконок - клан 16×12 + альянс 8×12 (BMP 256)",
      description:
        "Створіть емблему/значок/іконку для Lineage 2 онлайн. Експорт у BMP 8‑bit (256 кольорів): 16×12 для клану та 8×12 для альянсу. Режим 24×12 - це розмітка (клан+альянс): ви отримаєте окремі файли для завантаження в гру.",
    },
  },
  "/guide": {
    en: {
      title: "Guide: Lineage 2 crest sizes (16×12 clan, 8×12 alliance) + BMP 256",
      description:
        "Step‑by‑step guide for Lineage 2 crests/emblems/icons. In-game upload uses 16×12 (clan) and 8×12 (alliance) separately. Learn BMP 8‑bit (256 colors) requirements, 24×12 layout workflow, crop tips, presets, and readability checks.",
    },
    ru: {
      title: "Гайд: размеры эмблем Lineage 2 (клан 16×12, альянс 8×12) + BMP 256",
      description:
        "Пошаговый гайд по эмблемам/значкам/иконкам Lineage 2. В игре загружается отдельно 16×12 (клан) и 8×12 (альянс). Требования BMP 8‑bit (256 цветов), режим разметки 24×12, советы по кропу, пресетам и проверке читаемости.",
    },
    ua: {
      title: "Гайд: розміри емблем Lineage 2 (клан 16×12, альянс 8×12) + BMP 256",
      description:
        "Покроковий гайд по емблемах/значках/іконках Lineage 2. У грі завантажується окремо 16×12 (клан) та 8×12 (альянс). Вимоги BMP 8‑bit (256 кольорів), режим розмітки 24×12, поради щодо кропу, пресетів і перевірки читабельності.",
    },
  },
  "/icons": {
    en: {
      title: "Gallery: Lineage 2 crests / emblems / icons - 24×12 layouts (BMP 256)",
      description:
        "A small pack of ready Lineage 2 crest layouts (24×12, BMP 8‑bit / 256 colors). Click any crest to download ready BMP files for the game: 24×12 preview + 16×12 clan + 8×12 alliance.",
    },
    ru: {
      title: "Галерея: эмблемы/иконки Lineage 2 - разметка 24×12 (BMP 256)",
      description:
        "Небольшой набор готовых макетов эмблем/иконок Lineage 2 (24×12, BMP 8‑bit / 256 цветов). Нажмите на любую карточку, чтобы скачать готовые файлы для игры: превью 24×12 + клан 16×12 + альянс 8×12.",
    },
    ua: {
      title: "Галерея: емблеми/іконки Lineage 2 - розмітка 24×12 (BMP 256)",
      description:
        "Невеликий набір готових макетів емблем/іконок Lineage 2 (24×12, BMP 8‑bit / 256 кольорів). Натисніть на будь-яку картку, щоб завантажити готові файли для гри: прев'ю 24×12 + клан 16×12 + альянс 8×12.",
    },
  },
  "/privacy": {
    en: {
      title: "Privacy Policy - CrestMaker",
      description: "Privacy policy for CrestMaker (Lineage 2 crest/emblem/icon maker).",
    },
    ru: {
      title: "Политика конфиденциальности - CrestMaker",
      description: "Политика конфиденциальности CrestMaker (эмблемы/иконки Lineage 2).",
    },
    ua: {
      title: "Політика конфіденційності - CrestMaker",
      description: "Політика конфіденційності CrestMaker (емблеми/іконки Lineage 2).",
    },
  },
  "/terms": {
    en: {
      title: "Terms of Service - CrestMaker",
      description: "Terms of service for CrestMaker (Lineage 2 crest/emblem/icon maker).",
    },
    ru: {
      title: "Пользовательское соглашение - CrestMaker",
      description: "Пользовательское соглашение CrestMaker (эмблемы/иконки Lineage 2).",
    },
    ua: {
      title: "Умови користування - CrestMaker",
      description: "Умови користування CrestMaker (емблеми/іконки Lineage 2).",
    },
  },
  "/gdpr": {
    en: { title: "GDPR - CrestMaker", description: "GDPR information for CrestMaker." },
    ru: { title: "GDPR - CrestMaker", description: "Информация GDPR для CrestMaker." },
    ua: { title: "GDPR - CrestMaker", description: "Інформація GDPR для CrestMaker." },
  },
  "/cookies": {
    en: { title: "Cookies - CrestMaker", description: "Cookie preferences and details for CrestMaker." },
    ru: { title: "Cookies - CrestMaker", description: "Cookie‑настройки и информация CrestMaker." },
    ua: { title: "Cookies - CrestMaker", description: "Налаштування cookies та інформація CrestMaker." },
  },
};

const BASE = "https://crestmaker.org";

function routeKey(route: string): RouteKey {
  const r = route === "/" ? "/" : route.replace(/\/+$/, "");
  if (r === "/guide") return "/guide";
  if (r === "/icons") return "/icons";
  if (r === "/privacy") return "/privacy";
  if (r === "/terms") return "/terms";
  if (r === "/gdpr") return "/gdpr";
  if (r === "/cookies") return "/cookies";
  return "/";
}

function pagePath(lang: Lang, route: string) {
  const r = routeKey(route);
  if (r === "/") return `/${lang}/`;
  return `/${lang}${r}`;
}

function upsertMeta(by: "name" | "property", key: string, content: string) {
  const sel = `meta[${by}="${CSS.escape(key)}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(by, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const sel = `link[rel="${CSS.escape(rel)}"]${extra?.hreflang ? `[hreflang="${CSS.escape(extra.hreflang)}"]` : ""}`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setHtmlLang(lang: Lang) {
  // UA locale uses hreflang=uk
  const htmlLang = lang === "ua" ? "uk" : lang;
  document.documentElement.setAttribute("lang", htmlLang);
}

export function applySeoHead(lang: Lang, route: string) {
  const rk = routeKey(route);
  const seo = SEO[rk][lang];

  setHtmlLang(lang);

  // title + description
  document.title = seo.title;
  upsertMeta("name", "description", seo.description);

  // canonical + hreflang
  const canon = BASE + pagePath(lang, route);
  upsertLink("canonical", canon);

  const enUrl = BASE + pagePath("en", route);
  const ruUrl = BASE + pagePath("ru", route);
  const ukUrl = BASE + pagePath("ua", route);
  upsertLink("alternate", enUrl, { hreflang: "en" });
  upsertLink("alternate", ruUrl, { hreflang: "ru" });
  upsertLink("alternate", ukUrl, { hreflang: "uk" });
  upsertLink("alternate", enUrl, { hreflang: "x-default" });

  // OG/Twitter basics
  upsertMeta("property", "og:url", canon);
  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
}
