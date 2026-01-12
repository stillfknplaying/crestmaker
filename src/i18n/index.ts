export type Lang = "en" | "ru" | "ua";

const LANG_KEY = "cm_lang";

function detectLang(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "en" || saved === "ru" || saved === "ua") return saved;

  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("uk") || nav.startsWith("ua")) return "ua";
  return "en";
}

// Live binding (ESM) – other modules can import { currentLang } and see updates.
export let currentLang: Lang = detectLang();

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
}

export function t(en: string, ru: string, ua: string) {
  return currentLang === "ru" ? ru : currentLang === "ua" ? ua : en;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function tipAttr(en: string, ru: string, ua: string) {
  return `title="${escapeHtml(t(en, ru, ua))}"`;
}

export function helpHtml(en: string, ru: string, ua: string) {
  const msg = escapeHtml(t(en, ru, ua));
  const label = escapeHtml(t("More info", "Подробнее", "Докладніше"));
  // Inline help icon with tooltip (hover on desktop, tap on mobile)
  return `
    <span class="helpwrap">
      <button type="button" class="helpbtn" aria-label="${label}">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5ZM10.75 10a1.25 1.25 0 0 1 2.5 0v7a1.25 1.25 0 0 1-2.5 0v-7Z"/>
        </svg>
      </button>
      <span class="helptip" role="tooltip">${msg}</span>
    </span>
  `;
}