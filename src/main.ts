import "./style.css";
import { buildPaletteSync, utils } from "image-q";

type DitherMode = "none" | "ordered4" | "ordered8" | "floyd" | "atkinson";
// Presets are UX-facing "quality profiles". Keep this in sync with the <select id="preset">.
type Preset = "legacy" | "simple" | "balanced" | "complex";
type CropRect = { x: number; y: number; w: number; h: number }; // in source pixels; aspect controlled by UI
type CropDragMode = "none" | "move" | "nw" | "ne" | "sw" | "se";

type GameTemplate = {
  src: string;
  baseW: number;
  baseH: number;
  slotX: number;
  slotY: number;
  slotW: number;
  slotH: number;
};

// CrestMaker — beta 0.0.8.5
const SITE_NAME = "CrestMaker";

// Persist some UI state across language switches
const ADV_OPEN_KEY = "cm_adv_open";
let advancedOpen = localStorage.getItem(ADV_OPEN_KEY) === "1";


// Persist mode + crop aspect + pipeline
const PIPELINE_KEY = "cm_pipeline_v1";
type PipelineMode = "old" | "pixel";
type PixelPreset = "pixel-clean" | "pixel-crisp" | "pixel-stable" | "pixel-indexed";

function getPipeline(): PipelineMode {
  const v = localStorage.getItem(PIPELINE_KEY);
  return v === "pixel" ? "pixel" : "old";
}
function setPipeline(p: PipelineMode) {
  localStorage.setItem(PIPELINE_KEY, p);
}

const PIXEL_PRESET_KEY = "cm_pixel_preset_v1";
function getPixelPreset(): PixelPreset {
  const v = localStorage.getItem(PIXEL_PRESET_KEY) as PixelPreset | null;
  // Migrate removed presets (Mild/Soft) to Clean
  if ((v as any) === "pixel-l2" || (v as any) === "pixel-soft") return "pixel-clean";
  // Default Pixel preset should be Clean (when nothing saved yet)
  return v === "pixel-clean" || v === "pixel-crisp" || v === "pixel-stable" || v === "pixel-indexed" ? v : "pixel-clean";
}
function setPixelPreset(p: PixelPreset) {
  localStorage.setItem(PIXEL_PRESET_KEY, p);
}

const MODERN_PRESET_KEY = "cm_modern_preset_v1";
function getModernPreset(): Preset {
  const v = localStorage.getItem(MODERN_PRESET_KEY) as Preset | null;
  return v === "legacy" || v === "simple" || v === "balanced" || v === "complex" ? v : "balanced";
}
function setModernPreset(p: Preset) {
  localStorage.setItem(MODERN_PRESET_KEY, p);
}


const BRIGHTNESS_KEY = "cm_brightness_v1";
const CONTRAST_KEY = "cm_contrast_v1";
function getBrightness(): number {
  const v = Number(localStorage.getItem(BRIGHTNESS_KEY) ?? "0");
  return Number.isFinite(v) ? Math.max(-50, Math.min(50, v)) : 0;
}
function setBrightness(v: number) {
  localStorage.setItem(BRIGHTNESS_KEY, String(Math.max(-50, Math.min(50, v))));
}
function getContrast(): number {
  const v = Number(localStorage.getItem(CONTRAST_KEY) ?? "0");
  return Number.isFinite(v) ? Math.max(-50, Math.min(50, v)) : 0;
}
function setContrast(v: number) {
  localStorage.setItem(CONTRAST_KEY, String(Math.max(-50, Math.min(50, v))));
}

const MODE_KEY = "cm_mode_v1";
const CROP_ASPECT_KEY = "cm_crop_aspect_v1";

type CrestMode = "ally_clan" | "only_clan";
type CropAspect = "24x12" | "16x12";

function getMode(): CrestMode {
  const v = localStorage.getItem(MODE_KEY);
  return v === "only_clan" ? "only_clan" : "ally_clan";
}
function setMode(m: CrestMode) {
  localStorage.setItem(MODE_KEY, m);
}
function getCropAspect(): CropAspect {
  const v = localStorage.getItem(CROP_ASPECT_KEY);
  return v === "16x12" ? "16x12" : "24x12";
}
function setCropAspect(a: CropAspect) {
  localStorage.setItem(CROP_ASPECT_KEY, a);
}
function aspectRatio(a: CropAspect): number {
  return a === "16x12" ? (16 / 12) : 2;
}

let currentMode: CrestMode = getMode();
let currentCropAspect: CropAspect = getCropAspect();

document.documentElement.setAttribute("data-theme", "dark");

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="wrap">
    <header class="header">
      <div class="brand">
        <h1>${SITE_NAME}</h1>
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
        <a href="#/about">About</a>
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/terms">Terms of Service</a>
        <a href="#/gdpr">GDPR</a>
        <a href="#" id="cookieSettingsLink">Cookies</a>
      </nav>
      <div class="footer-copy">
        <span id="year"></span> © ${SITE_NAME}. All rights reserved.
      </div>
    </footer>

    <div id="cookieRoot"></div>

    <div id="cookieModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="cookieModalTitle">
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
          <button id="cookieCancel" class="btn">Cancel</button>
          <button id="cookieSave" class="btn primary">Save</button>
        </div>
      </div>
    </div>
  </div>
`;

const yearEl = document.querySelector<HTMLSpanElement>("#year")!;
yearEl.textContent = String(new Date().getFullYear());

// -------------------- I18N (EN/RU/UA) --------------------
type Lang = "en" | "ru" | "ua";

function getLang(): Lang {
  const saved = localStorage.getItem("cm_lang");
  if (saved === "en" || saved === "ru" || saved === "ua") return saved;
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("uk") || nav.startsWith("ua")) return "ua";
  return "en";
}

let currentLang: Lang = getLang();

function setLang(lang: Lang) {
  // Preserve advanced toggle state across language switches
  if (refs?.advancedChk) {
    advancedOpen = refs.advancedChk.checked;
    localStorage.setItem(ADV_OPEN_KEY, advancedOpen ? "1" : "0");
  }
  currentLang = lang;
  localStorage.setItem("cm_lang", lang);
  renderRoute();
  // re-render cookie banner text if visible
  renderCookieBannerIfNeeded();
  localizeCookieUI();
}

function t(en: string, ru: string, ua: string) {
  return currentLang === "ru" ? ru : currentLang === "ua" ? ua : en;
}

function tipAttr(en: string, ru: string, ua: string) {
  return `title="${escapeHtml(t(en, ru, ua))}"`;
}

function helpHtml(en: string, ru: string, ua: string) {
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
// -------------------- COOKIE CONSENT (beta 0.0.5) --------------------
type ConsentState = {
  essential: true;
  analytics: boolean;
  ads: boolean;
  updatedAt: string; // ISO
};

const CONSENT_KEY = "cm_consent_v1";

function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.essential !== true) return null;
    if (typeof parsed.analytics !== "boolean") return null;
    if (typeof parsed.ads !== "boolean") return null;
    if (typeof parsed.updatedAt !== "string") return null;
    return parsed as ConsentState;
  } catch {
    return null;
  }
}
function initHelpTooltips() {
  if ((window as any).__cmHelpTipsInit) return;
  (window as any).__cmHelpTipsInit = true;

  const closeAll = () => {
    document.querySelectorAll<HTMLElement>(".helpwrap.open").forEach((el) => el.classList.remove("open"));
  };

  // Toggle on tap/click
  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement | null)?.closest?.(".helpbtn") as HTMLElement | null;
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const wrap = btn.closest(".helpwrap") as HTMLElement | null;
      if (!wrap) return;
      const isOpen = wrap.classList.contains("open");
      closeAll();
      if (!isOpen) wrap.classList.add("open");
      return;
    }
    // Click outside closes
    if (!(e.target as HTMLElement | null)?.closest?.(".helpwrap")) closeAll();
  });

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape") closeAll();
  });
}


function setConsent(next: Omit<ConsentState, "updatedAt">) {
  const payload: ConsentState = { ...next, updatedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
  hideCookieBanner();
}

function hideCookieBanner() {
  const root = document.querySelector<HTMLDivElement>("#cookieRoot");
  if (root) root.innerHTML = "";
}

function openCookieModal() {
  const modal = document.querySelector<HTMLDivElement>("#cookieModal")!;
  modal.classList.remove("hidden");
  syncCookieModalFromState();
  localizeCookieUI();
}

function closeCookieModal() {
  const modal = document.querySelector<HTMLDivElement>("#cookieModal")!;
  modal.classList.add("hidden");
}

function syncCookieModalFromState() {
  const state = getConsent();
  const analytics = document.querySelector<HTMLInputElement>("#cookieAnalytics")!;
  const ads = document.querySelector<HTMLInputElement>("#cookieAds")!;
  analytics.checked = state ? state.analytics : false;
  ads.checked = state ? state.ads : false;
}

function localizeCookieUI() {
  const hasConsent = !!getConsent();

  const title = document.querySelector<HTMLHeadingElement>("#cookieModalTitle")!;
  const desc = document.querySelector<HTMLParagraphElement>("#cookieModalDesc")!;
  const essentialTitle = document.querySelector<HTMLElement>("#cookieEssentialTitle")!;
  const essentialDesc = document.querySelector<HTMLElement>("#cookieEssentialDesc")!;
  const essentialAlways = document.querySelector<HTMLElement>("#cookieEssentialAlways")!;
  const analyticsTitle = document.querySelector<HTMLElement>("#cookieAnalyticsTitle")!;
  const analyticsDesc = document.querySelector<HTMLElement>("#cookieAnalyticsDesc")!;
  const adsTitle = document.querySelector<HTMLElement>("#cookieAdsTitle")!;
  const adsDesc = document.querySelector<HTMLElement>("#cookieAdsDesc")!;
  const cancel = document.querySelector<HTMLButtonElement>("#cookieCancel")!;
  const save = document.querySelector<HTMLButtonElement>("#cookieSave")!;

  title.textContent = t("Cookie preferences", "Настройки cookies", "Налаштування cookies");
  desc.textContent = t(
    "Choose which cookies you allow. You can change your choice anytime.",
    "Выберите, какие cookies разрешить. Настройки можно изменить в любое время.",
    "Оберіть, які cookies дозволити. Налаштування можна змінити будь-коли."
  );

  essentialTitle.textContent = t("Essential", "Необходимые", "Необхідні");
  essentialDesc.textContent = t(
    "Required for the site to work (saved settings).",
    "Нужны для работы сайта (сохранение настроек).",
    "Потрібні для роботи сайту (збереження налаштувань)."
  );
  essentialAlways.textContent = t("Always on", "Всегда включены", "Завжди увімкнені");

  analyticsTitle.textContent = t("Analytics", "Аналитика", "Аналітика");
  analyticsDesc.textContent = t(
    "Helps us understand usage (if enabled in the future).",
    "Помогает понять использование (если будет подключено в будущем).",
    "Допомагає зрозуміти використання (якщо буде підключено в майбутньому)."
  );

  adsTitle.textContent = t("Advertising", "Реклама", "Реклама");
  adsDesc.textContent = t(
    "Used for ads personalization (e.g., Google AdSense) if enabled.",
    "Используется для персонализации рекламы (например, Google AdSense), если будет включено.",
    "Використовується для персоналізації реклами (наприклад, Google AdSense), якщо буде увімкнено."
  );

  cancel.textContent = t("Cancel", "Отмена", "Скасувати");
  save.textContent = hasConsent ? t("Save", "Сохранить", "Зберегти") : t("Save & continue", "Сохранить и продолжить", "Зберегти та продовжити");
}

function renderCookieBannerIfNeeded() {
  // Only show if no consent has been stored yet.
  if (getConsent()) return;

  const root = document.querySelector<HTMLDivElement>("#cookieRoot")!;
  root.innerHTML = `
    <div style="
      position:fixed;
      left:0; right:0; bottom:0;
      padding: 12px 12px 14px;
      background: var(--panel);
      border-top: 1px solid var(--border);
      box-shadow: 0 -10px 30px rgba(0,0,0,.25);
      z-index: 1200;
    ">
      <div style="max-width:1200px; margin:0 auto; display:flex; gap:12px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap;">
        <div style="min-width:240px; flex:1;">
          <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(t("Cookies & privacy", "Cookies и приватность", "Cookies і приватність"))}</div>
          <div class="muted" style="font-size:12px; line-height:1.45;">
            ${escapeHtml(t(
              "We may use cookies to remember your preferences. If ads/analytics are enabled in the future, consent will be requested where required.",
              "Мы можем использовать cookies для сохранения настроек. Если в будущем появятся реклама/аналитика, будет запрошено согласие там, где это требуется.",
              "Ми можемо використовувати cookies для збереження налаштувань. Якщо у майбутньому з’являться реклама/аналітика, згоду буде запитано там, де це потрібно."
            ))}
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button class="btn" id="cookieManage">${escapeHtml(t("Manage options", "Настроить", "Налаштувати"))}</button>
          <button class="btn" id="cookieReject">${escapeHtml(t("Reject non-essential", "Отклонить необязательные", "Відхилити необов’язкові"))}</button>
          <button class="btn primary" id="cookieAccept">${escapeHtml(t("Accept all", "Принять все", "Прийняти все"))}</button>
        </div>
      </div>
    </div>
  `;

  const manage = document.querySelector<HTMLButtonElement>("#cookieManage")!;
  const reject = document.querySelector<HTMLButtonElement>("#cookieReject")!;
  const accept = document.querySelector<HTMLButtonElement>("#cookieAccept")!;

  manage.addEventListener("click", openCookieModal);
  reject.addEventListener("click", () => setConsent({ essential: true, analytics: false, ads: false }));
  accept.addEventListener("click", () => setConsent({ essential: true, analytics: true, ads: true }));
}

function initCookieConsentUI() {
  // Footer link
  const link = document.querySelector<HTMLAnchorElement>("#cookieSettingsLink");
  if (link) {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openCookieModal();
    });
  }

  // Modal buttons
  const cancel = document.querySelector<HTMLButtonElement>("#cookieCancel")!;
  const save = document.querySelector<HTMLButtonElement>("#cookieSave")!;
  cancel.addEventListener("click", closeCookieModal);

  save.addEventListener("click", () => {
    const analytics = document.querySelector<HTMLInputElement>("#cookieAnalytics")!.checked;
    const ads = document.querySelector<HTMLInputElement>("#cookieAds")!.checked;
    setConsent({ essential: true, analytics, ads });
    closeCookieModal();
  });

  // Click outside modal-card closes modal
  const modal = document.querySelector<HTMLDivElement>("#cookieModal")!;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeCookieModal();
  });

  // Render banner if needed
  renderCookieBannerIfNeeded();
}

// -------------------- ROUTES --------------------
const routeRoot = document.querySelector<HTMLDivElement>("#routeRoot")!;

function renderRoute() {
  const hash = (location.hash || "#/").replace(/^#/, "");
  const path = hash.startsWith("/") ? hash : "/" + hash;

  if (path === "/privacy") return renderPolicyPage(t("Privacy Policy","Политика конфиденциальности","Політика конфіденційності"), privacyPolicyHtml());
  if (path === "/terms") return renderPolicyPage(t("Terms of Service","Пользовательское соглашение","Умови користування"), termsHtml());
  if (path === "/about") return renderPolicyPage(t("About","О проекте","Про проєкт"), aboutHtml());
  if (path === "/gdpr") return renderPolicyPage("GDPR", gdprHtml());

return renderToolPage();
}

function renderPolicyPage(title: string, html: string) {
  routeRoot.innerHTML = `
    <section class="page">
      <div class="page-head">
        <h2>${escapeHtml(title)}</h2>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <div class="btn-group" style="display:flex; gap:8px;">
            <button class="btn ${currentLang === "en" ? "active" : ""}" data-lang="en">EN</button>
            <button class="btn ${currentLang === "ru" ? "active" : ""}" data-lang="ru">RU</button>
            <button class="btn ${currentLang === "ua" ? "active" : ""}" data-lang="ua">UA</button>
          </div>
          <a class="btn" href="#/">← ${escapeHtml(t("Back to tool","Назад к инструменту","Назад до інструмента"))}</a>
        </div>
      </div>

      <article class="md">${html}</article>
    </section>
  `;

  routeRoot.querySelectorAll<HTMLButtonElement>("button[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang as Lang));
  });
}

function renderToolPage() {
  // Crop aspect is tied to Mode (no separate selector)
  const desired: CropAspect = currentMode === "only_clan" ? "16x12" : "24x12";
  if (currentCropAspect !== desired) {
    currentCropAspect = desired;
    setCropAspect(currentCropAspect);
    if (displayCanvas) cropRect = initCropToAspect(displayCanvas, aspectRatio(currentCropAspect));
  }
  const trueW = currentMode === "only_clan" ? 16 : 24;
  const trueH = 12;
  const cropLabel = currentCropAspect === "16x12" ? "4:3" : "2:1";
  routeRoot.innerHTML = `
    <section class="tool">
      <div class="toolbar">
        <label class="btn primary">
          ${escapeHtml(t("Upload image","Загрузить","Завантажити"))}
          <input id="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        </label>

        <button id="download" class="btn primary" disabled>${escapeHtml(t("Download BMPs","Скачать BMP","Завантажити BMP"))}</button>

        <div class="sep"></div>

        <div class="select" ${tipAttr("Select output size: 24×12 (full) or 16×12 (clan only).","Выберите размер: 24×12 (полный) или 16×12 (только клан).","Оберіть розмір: 24×12 (повний) або 16×12 (лише клан).")}>
  <span>${escapeHtml(t("Size","Размер","Розмір"))}</span>
  <select id="mode">
    <option value="ally_clan" ${currentMode==="ally_clan" ? "selected" : ""}>${escapeHtml(t("24×12","24×12","24×12"))}</option>
    <option value="only_clan" ${currentMode==="only_clan" ? "selected" : ""}>${escapeHtml(t("16×12","16×12","16×12"))}</option>
  </select>
</div>


<div class="select" ${tipAttr("Choose conversion type: Modern (image-q) or Pixel (fixed 256 palette + ordered dither)","Выберите тип конвертации: Modern (image-q) или Pixel (фикс. палитра 256 + ordered dither)","Оберіть тип конвертації: Modern (image-q) або Pixel (фікс. палітра 256 + ordered dither)")}>
  <span>${escapeHtml(t("Mode","Режим","Режим"))}</span>
  <select id="pipeline">
    <option value="old" ${getPipeline()==="old" ? "selected" : ""}>Modern</option>
    <option value="pixel" ${getPipeline()==="pixel" ? "selected" : ""}>Pixel</option>
  </select>
</div>

<div class="select" ${tipAttr("Quick settings for converting to BMP 256 colors (depends on Conversion)","Быстрые настройки конвертации в BMP 256 цветов (зависят от Конвертации)","Швидкі налаштування конвертації в BMP 256 кольорів (залежать від Конвертації)")}>
  <span>${escapeHtml(t("Preset","Пресет","Пресет"))}</span>
  <select id="preset">
    ${getPipeline()==="pixel"
      ? `
        
        <option value="pixel-clean" ${getPixelPreset()==="pixel-clean" ? "selected" : ""}>Clean</option>
        <option value="pixel-crisp" ${getPixelPreset()==="pixel-crisp" ? "selected" : ""}>Crisp</option>
        <option value="pixel-stable" ${getPixelPreset()==="pixel-stable" ? "selected" : ""}>Stable</option>
        <option value="pixel-indexed" ${getPixelPreset()==="pixel-indexed" ? "selected" : ""}>Indexed</option>`
      : `
        <option value="balanced" selected>${escapeHtml(t("Balanced","Баланс","Баланс"))}</option>
        <option value="simple">${escapeHtml(t("Simple","Обычно","Простий"))}</option>
        <option value="complex">${escapeHtml(t("Complex","Сложная","Складна"))}</option>
        <option value="legacy">${escapeHtml(t("Legacy","Legacy","Legacy"))}</option>
      `}
  </select>
</div>
<label class="toggle compact" ${tipAttr("More conversion controls for 24×12 icons","Больше настроек конвертации для иконки 24×12","Більше налаштувань конвертації для іконки 24×12")}>
          <span>${escapeHtml(t("Settings","Настройки","Налаштування"))}</span>
          <input id="advanced" type="checkbox" ${advancedOpen ? "checked" : ""} />
          <span class="track"><span class="thumb"></span></span>
        </label>

        <button id="reset" class="btn ${advancedOpen ? "" : "hidden"}" disabled>${escapeHtml(t("Reset","Сброс","Скинути"))}</button>
        <div class="toolbar-right">
          <button class="btn ${currentLang === "en" ? "active" : ""}" data-lang="en">EN</button>
          <button class="btn ${currentLang === "ru" ? "active" : ""}" data-lang="ru">RU</button>
          <button class="btn ${currentLang === "ua" ? "active" : ""}" data-lang="ua">UA</button>
        </div>

      </div>

      <div id="advancedPanel" class="advanced ${advancedOpen ? "" : "hidden"}">
    <div class="adv-top">
      <div id="smoothingRow" class="select">
        <span class="lbl">
          ${escapeHtml(t("Smoothing","Сглаживание","Згладжування"))}
          ${helpHtml(
            "Adds a subtle pixel pattern to smooth color transitions in a 24×12 256-color BMP.",
            "Добавляет лёгкий пиксельный узор, чтобы сгладить переходы цветов в BMP 256 (24×12).",
            "Додає легкий піксельний візерунок, щоб згладити переходи кольорів у BMP 256 (24×12)."
          )}
        </span>
        <select id="dither">
          <option value="none">${escapeHtml(t("Off","Выкл","Вимк"))}</option>
          <option value="ordered4" selected>${escapeHtml(t("Pattern 4×4","Шаблон 4×4","Візерунок 4×4"))}</option>
          <option value="ordered8">${escapeHtml(t("Pattern 8×8","Шаблон 8×8","Візерунок 8×8"))}</option>
          <option value="atkinson">${escapeHtml(t("Smooth (Atkinson)","Плавно (Atkinson)","Плавно (Atkinson)"))}</option>
          <option value="floyd">${escapeHtml(t("Smooth (Floyd–Steinberg)","Плавно (Floyd–Steinberg)","Плавно (Floyd–Steinberg)"))}</option>
        </select>
      </div>

      <div class="range" id="strengthRow">
        <span class="lbl">
          ${escapeHtml(t("Strength","Сила","Сила"))}
          ${helpHtml(
            "Controls how strong the smoothing pattern is. Lower = cleaner pixels, higher = smoother gradients.",
            "Насколько сильное сглаживание. Ниже = чище пиксели, выше = плавнее переходы.",
            "Наскільки сильне згладжування. Нижче = чистіші пікселі, вище = плавніші переходи."
          )}
        </span>
        <input id="ditherAmt" type="range" min="0" max="100" value="55" />
        <b><span id="ditherAmtVal">55</span>%</b>
      </div>

      <div class="range" id="brightnessRow">
        <span class="lbl">
          ${escapeHtml(t("Brightness","Яркость","Яскравість"))}
          ${helpHtml("Adjusts brightness before conversion.","Регулирует яркость перед конвертацией.","Регулює яскравість перед конвертацією.")}
        </span>
        <input id="brightness" type="range" min="-50" max="50" value="0" />
        <b><span id="brightnessVal">0</span></b>
      </div>

      <div class="range" id="contrastRow">
        <span class="lbl">
          ${escapeHtml(t("Contrast","Контраст","Контраст"))}
          ${helpHtml("Adjusts contrast before conversion.","Регулирует контраст перед конвертацией.","Регулює контраст перед конвертацією.")}
        </span>
        <input id="contrast" type="range" min="-50" max="50" value="0" />
        <b><span id="contrastVal">0</span></b>
      </div>

      <div class="btn-group adv-actions">
        <button id="rotL" class="btn">${escapeHtml(t("Rotate","Повернуть","Повернути"))} ⟲</button>
        <button id="rotR" class="btn">${escapeHtml(t("Rotate","Повернуть","Повернути"))} ⟳</button>
        <button id="invert" class="btn">${escapeHtml(t("Invert","Инвертировать","Інвертувати"))}</button>
      </div>
    </div>

      <div class="adv-toggles">
      <div class="adv-opt old-only" id="optTwoStep">
        <div class="opt-head">
          <span class="opt-name">${escapeHtml(t("Smoother resize","Плавное уменьшение","Плавне зменшення"))}</span>
          ${helpHtml(
            "Resizes in two steps so the 24×12 icon keeps cleaner pixels.",
            "Уменьшает в два шага — меньше артефактов на 24×12.",
            "Зменшує у два кроки — менше артефактів на 24×12."
          )}
        </div>
        <label class="toggle compact toggle-switch">
          <input id="twoStep" type="checkbox" checked />
          <span class="track"><span class="thumb"></span></span>
        </label>
      </div>

      <div class="adv-opt old-only" id="optBalanceColors">
        <div class="opt-head">
          <span class="opt-name">${escapeHtml(t("Balance colors","Баланс цветов","Баланс кольорів"))}</span>
          ${helpHtml(
            "Keeps the icon from getting too dark or too pale after conversion.",
            "Не даёт иконке стать слишком тёмной или слишком бледной после конвертации.",
            "Не дає іконці стати надто темною або надто блідою після конвертації."
          )}
        </div>
        <label class="toggle compact toggle-switch">
          <input id="centerPalette" type="checkbox" checked />
          <span class="track"><span class="thumb"></span></span>
        </label>
      </div>

      <div class="adv-opt" id="optBetterMatch">
        <div class="opt-head">
          <span class="opt-name">${escapeHtml(t("Better color match","Точнее цвета","Точніші кольори"))}</span>
          ${helpHtml(
            "Improves color matching for 256-color conversion (often looks cleaner on emblems).",
            "Улучшает совпадение цветов при 256-цветной конвертации (часто выглядит чище на эмблемах).",
            "Покращує співпадіння кольорів при 256-кольоровій конвертації (часто виглядає чистіше на емблемах)."
          )}
        </div>
        <label class="toggle compact toggle-switch">
          <input id="oklab" type="checkbox" checked />
          <span class="track"><span class="thumb"></span></span>
        </label>
      </div>

      <div class="adv-opt old-only" id="optSubtleNoise">
        <div class="opt-head">
          <span class="opt-name">${escapeHtml(t("Subtle noise","Лёгкий шум","Легкий шум"))}</span>
          ${helpHtml(
            "Adds a tiny bit of noise to reduce visible patterns after smoothing.",
            "Добавляет чуть-чуть шума, чтобы уменьшить заметные узоры после сглаживания.",
            "Додає трішки шуму, щоб зменшити помітні візерунки після згладжування."
          )}
        </div>
        <label class="toggle compact toggle-switch">
          <input id="noiseDither" type="checkbox" checked />
          <span class="track"><span class="thumb"></span></span>
        </label>
      </div>

      <div class="adv-opt old-only" id="optSharpenEdges">
        <div class="opt-head">
          <span class="opt-name">${escapeHtml(t("Sharpen edges","Чёткие границы","Чіткі межі"))}</span>
          ${helpHtml(
            "Slightly sharpens edges so the crest outline stays crisp at 24×12.",
            "Слегка подчёркивает границы — контур герба остаётся чётким на 24×12.",
            "Трохи підкреслює межі — контур герба лишається чітким на 24×12."
          )}
        </div>
        <label class="toggle compact toggle-switch">
          <input id="edgeSharpen" type="checkbox" checked />
          <span class="track"><span class="thumb"></span></span>
        </label>
      </div>

      <div class="adv-opt">
        <div class="opt-head">
          <span class="opt-name">${escapeHtml(t("Cleanup pixels","Очистка пикселей","Очищення пікселів"))}</span>
          ${helpHtml(
            "Removes single stray pixels after conversion (good for tiny icons).",
            "Убирает одиночные «лишние» пиксели после конвертации (полезно для маленьких иконок).",
            "Прибирає поодинокі «зайві» пікселі після конвертації (корисно для маленьких іконок)."
          )}
        </div>
        <label class="toggle compact toggle-switch">
          <input id="cleanup" type="checkbox" checked />
          <span class="track"><span class="thumb"></span></span>
        </label>
      </div>
    </div>
  </div>

<div class="grid">

        <div class="card">
          <div class="card-head">
            <h3>${escapeHtml(t("Crop","Crop","Crop"))} ${cropLabel}</h3>
            <label class="toggle compact">
              <span>Use crop</span>
              <input id="useCrop" type="checkbox" checked />
              <span class="track"><span class="thumb"></span></span>
            </label>
          </div>
          <canvas id="crop" width="480" height="240"></canvas>
        </div>

        <div class="card">
          <h3>${escapeHtml(t("True size","True size","True size"))} ${trueW}×${trueH}</h3>
          <div class="true-wrap">
            <canvas id="dstTrue" width="${trueW}" height="${trueH}"></canvas>
          </div>
        </div>

        <div class="card" id="debugCard24">
          <h3>Result 24×12 (zoom)</h3>
          <canvas id="dstZoom24" width="240" height="120"></canvas>
        </div>

        <div class="card" id="debugCard16">
          <h3>Result 16×12 (zoom)</h3>
          <canvas id="dstZoom16" width="160" height="120"></canvas>
        </div>

        <div class="card full" id="previewCard">
          <div class="preview-head">
            <h3>Game preview</h3>
            <div class="muted hidden">Template: <b>${currentMode === "only_clan" ? "l2_nameplate_02.jpg" : "l2_nameplate_01.jpg"}</b> (2560×1440, UI=1280×720)</div>
          </div>
          <div class="preview-wrap">
            <canvas id="preview"></canvas>
          </div>
        </div>
      </div>

      <div id="confirmModal" class="modal hidden" role="dialog" aria-modal="true">
        <div class="modal-card">
          <h3>Reset advanced settings?</h3>
          <p class="muted">This will restore default values for the current preset.</p>
          <div class="modal-actions">
            <button id="confirmNo" class="btn">Cancel</button>
            <button id="confirmYes" class="btn primary">Reset</button>
          </div>
        </div>
      </div>
    </section>
  `;

  initToolUI();
}

// -------------------- TOOL UI + STATE --------------------
type ToolRefs = {
  themeToggle: HTMLInputElement;
  fileInput: HTMLInputElement;
  downloadBtn: HTMLButtonElement;

  modeSel: HTMLSelectElement;

  presetSel: HTMLSelectElement;
  pipelineSel: HTMLSelectElement;
advancedChk: HTMLInputElement;
  resetBtn: HTMLButtonElement;
  advancedPanel: HTMLDivElement;

  ditherSel: HTMLSelectElement;
  twoStepChk: HTMLInputElement;
  centerPaletteChk: HTMLInputElement;
  ditherAmt: HTMLInputElement;
  ditherAmtVal: HTMLSpanElement;

  brightness: HTMLInputElement;
  brightnessVal: HTMLSpanElement;
  contrast: HTMLInputElement;
  contrastVal: HTMLSpanElement;

  oklabChk: HTMLInputElement;
  noiseDitherChk: HTMLInputElement;
  edgeSharpenChk: HTMLInputElement;
  cleanupChk: HTMLInputElement;

  rotL: HTMLButtonElement;
  rotR: HTMLButtonElement;
  invertBtn: HTMLButtonElement;

  useCropChk: HTMLInputElement;

  cropCanvas: HTMLCanvasElement;
  cropCtx: CanvasRenderingContext2D;

  dstTrueCanvas: HTMLCanvasElement;
  dstTrueCtx: CanvasRenderingContext2D;

  dstZoom24Canvas: HTMLCanvasElement;
  dstZoom24Ctx: CanvasRenderingContext2D;

  dstZoom16Canvas: HTMLCanvasElement;
  dstZoom16Ctx: CanvasRenderingContext2D;

  previewCanvas: HTMLCanvasElement;
  previewCtx: CanvasRenderingContext2D;

  debugCard24: HTMLDivElement;
  debugCard16: HTMLDivElement;
  confirmModal: HTMLDivElement;
  confirmYes: HTMLButtonElement;
  confirmNo: HTMLButtonElement;
};

let refs: ToolRefs | null = null;

function boot() {
  renderRoute();
  initCookieConsentUI();
  window.addEventListener("hashchange", renderRoute);
}

// Гарантируем запуск после полной инициализации модуля (и refs тоже)
queueMicrotask(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
});

// Images + pipeline state
let sourceImage: HTMLImageElement | null = null;
let displayCanvas: HTMLCanvasElement | null = null; // rotated view
let rotation90: 0 | 90 | 180 | 270 = 0;
let invertColors = false;

let cropRect: CropRect | null = null;
let cropDragMode: CropDragMode = "none";
let dragStart = { mx: 0, my: 0, x: 0, y: 0 };
let dragAnchor = { ax: 0, ay: 0, start: { x: 0, y: 0, w: 0, h: 0 } };

let iconCombined24x12Indexed: Uint8Array | null = null;
let iconClan16x12Indexed: Uint8Array | null = null;
let iconAlly8x12Indexed: Uint8Array | null = null;
let palette256: Uint8Array | null = null;

let gameTemplateImg: HTMLImageElement | null = null;
let loadedTemplateSrc: string | null = null;

// Two templates: 24×12 uses the original, 16×12 uses the second one.
// Slot coords are the same (both screenshots are the same resolution/UI).
const GAME_TEMPLATE_24: GameTemplate = {
  src: "/templates/l2_nameplate_01.jpg",
  baseW: 2560,
  baseH: 1440,
  // NOTE: user tuned to match screenshot
  slotX: 1160,
  slotY: 218,
  slotW: 48,
  slotH: 24,
};

const GAME_TEMPLATE_16: GameTemplate = {
  src: "/templates/l2_nameplate_02.jpg",
  baseW: 2560,
  baseH: 1440,
  slotX: 1164,
  slotY: 218,
  slotW: 36,
  slotH: 24,
};

function getGameTemplate(): GameTemplate {
  return currentMode === "only_clan" ? GAME_TEMPLATE_16 : GAME_TEMPLATE_24;
}

function initToolUI() {

  // Help tooltips (desktop hover + mobile tap)
  initHelpTooltips();
  // refs must be available only after tool HTML is rendered
  refs = {
    themeToggle: document.querySelector<HTMLInputElement>("#themeToggle")!,
    fileInput: document.querySelector<HTMLInputElement>("#file")!,
    downloadBtn: document.querySelector<HTMLButtonElement>("#download")!,

    modeSel: document.querySelector<HTMLSelectElement>("#mode")!,

    presetSel: document.querySelector<HTMLSelectElement>("#preset")!,
    pipelineSel: document.querySelector<HTMLSelectElement>("#pipeline")!,
advancedChk: document.querySelector<HTMLInputElement>("#advanced")!,
    resetBtn: document.querySelector<HTMLButtonElement>("#reset")!,
    advancedPanel: document.querySelector<HTMLDivElement>("#advancedPanel")!,

    ditherSel: document.querySelector<HTMLSelectElement>("#dither")!,
    twoStepChk: document.querySelector<HTMLInputElement>("#twoStep")!,
    centerPaletteChk: document.querySelector<HTMLInputElement>("#centerPalette")!,
    ditherAmt: document.querySelector<HTMLInputElement>("#ditherAmt")!,
    ditherAmtVal: document.querySelector<HTMLSpanElement>("#ditherAmtVal")!,

    brightness: document.querySelector<HTMLInputElement>("#brightness")!,
    brightnessVal: document.querySelector<HTMLSpanElement>("#brightnessVal")!,
    contrast: document.querySelector<HTMLInputElement>("#contrast")!,
    contrastVal: document.querySelector<HTMLSpanElement>("#contrastVal")!,

    oklabChk: document.querySelector<HTMLInputElement>("#oklab")!,
    noiseDitherChk: document.querySelector<HTMLInputElement>("#noiseDither")!,
    edgeSharpenChk: document.querySelector<HTMLInputElement>("#edgeSharpen")!,
    cleanupChk: document.querySelector<HTMLInputElement>("#cleanup")!,

    rotL: document.querySelector<HTMLButtonElement>("#rotL")!,
    rotR: document.querySelector<HTMLButtonElement>("#rotR")!,
    invertBtn: document.querySelector<HTMLButtonElement>("#invert")!,

    useCropChk: document.querySelector<HTMLInputElement>("#useCrop")!,

    cropCanvas: document.querySelector<HTMLCanvasElement>("#crop")!,
    cropCtx: document.querySelector<HTMLCanvasElement>("#crop")!.getContext("2d")!,

    dstTrueCanvas: document.querySelector<HTMLCanvasElement>("#dstTrue")!,
    dstTrueCtx: document.querySelector<HTMLCanvasElement>("#dstTrue")!.getContext("2d")!,

    dstZoom24Canvas: document.querySelector<HTMLCanvasElement>("#dstZoom24")!,
    dstZoom24Ctx: document.querySelector<HTMLCanvasElement>("#dstZoom24")!.getContext("2d")!,

    dstZoom16Canvas: document.querySelector<HTMLCanvasElement>("#dstZoom16")!,
    dstZoom16Ctx: document.querySelector<HTMLCanvasElement>("#dstZoom16")!.getContext("2d")!,

    previewCanvas: document.querySelector<HTMLCanvasElement>("#preview")!,
    previewCtx: document.querySelector<HTMLCanvasElement>("#preview")!.getContext("2d")!,

    debugCard24: document.querySelector<HTMLDivElement>("#debugCard24")!,
    debugCard16: document.querySelector<HTMLDivElement>("#debugCard16")!,
    confirmModal: document.querySelector<HTMLDivElement>("#confirmModal")!,
    confirmYes: document.querySelector<HTMLButtonElement>("#confirmYes")!,
    confirmNo: document.querySelector<HTMLButtonElement>("#confirmNo")!,
  };

  // Pipeline persistence + UI toggles
  refs.pipelineSel.value = getPipeline();

  const applyPresetOptions = (p: PipelineMode) => {
    if (p === "pixel") {
      const px = getPixelPreset();
      refs!.presetSel.innerHTML = `
        <option value="pixel-clean" ${px === "pixel-clean" ? "selected" : ""}>Clean</option>
        <option value="pixel-crisp" ${px === "pixel-crisp" ? "selected" : ""}>Crisp</option>
        <option value="pixel-stable" ${px === "pixel-stable" ? "selected" : ""}>Stable</option>
        <option value="pixel-indexed" ${px === "pixel-indexed" ? "selected" : ""}>Indexed</option>
      `;
      refs!.presetSel.value = px;
    } else {
      const mp = getModernPreset();
      refs!.presetSel.innerHTML = `
        <option value="balanced" ${mp === "balanced" ? "selected" : ""}>${escapeHtml(t("Balanced","Баланс","Баланс"))}</option>
        <option value="simple" ${mp === "simple" ? "selected" : ""}>${escapeHtml(t("Simple","Обычно","Простий"))}</option>
        <option value="complex" ${mp === "complex" ? "selected" : ""}>${escapeHtml(t("Complex","Сложная","Складна"))}</option>
        <option value="legacy" ${mp === "legacy" ? "selected" : ""}>${escapeHtml(t("Legacy","Legacy","Legacy"))}</option>
      `;
      refs!.presetSel.value = mp;
    }
  };

  refs.pipelineSel.value = getPipeline();
  applyPresetOptions(refs.pipelineSel.value as PipelineMode);

  let prevPipeline: PipelineMode = refs!.pipelineSel.value as PipelineMode;

  const syncPipelineUI = () => {
    const next = refs!.pipelineSel.value as PipelineMode;
    const prev = prevPipeline;

    // Persist the currently selected preset BEFORE the preset options are replaced.
    if (prev === "old") {
      const cur = refs!.presetSel.value as Preset;
      if (cur === "legacy" || cur === "simple" || cur === "balanced" || cur === "complex") {
        setModernPreset(cur);
      }
    } else {
      const cur = refs!.presetSel.value as PixelPreset;
      if (cur === "pixel-clean" || cur === "pixel-crisp" || cur === "pixel-stable" || cur === "pixel-indexed") {
        setPixelPreset(cur);
      } else {
        // Migrate removed presets
        setPixelPreset("pixel-clean");
      }
    }

    // Update pipeline storage
    setPipeline(next);

    // Choose the preset for the target pipeline.
    if (next === "pixel") {
      // When switching to Pixel, default to Clean for predictability.
      const target = prev !== "pixel" ? "pixel-clean" : getPixelPreset();
      setPixelPreset(target);
    } else {
      // When switching back to Modern, restore the last Modern preset (default Balanced).
      setModernPreset(getModernPreset());
    }

    // Rebuild preset options for the selected pipeline and sync <select> value.
    applyPresetOptions(next);

    // Hide Modern-only controls when Pixel pipeline is active (to reduce confusion).
    const isPixel = next === "pixel";
    document.querySelectorAll<HTMLElement>(".old-only").forEach((el) => {
      el.classList.toggle("hidden", isPixel);
    });

    // Dither controls are Modern-only in current UX.
    refs!.ditherSel.disabled = isPixel;
    refs!.ditherAmt.disabled = isPixel;
    refs!.oklabChk.disabled = isPixel;

    // Ensure the currently shown preset is actually applied (fix preset desync).
    if (!isPixel) {
      const mp = refs!.presetSel.value as Preset;
      applyPresetDefaults(mp);
      updateControlAvailability(mp);
    } else {
      updateControlAvailability("balanced");
    }

    prevPipeline = next;
  };

  refs.pipelineSel.addEventListener("change", () => {
    syncPipelineUI();
    recomputePreview();
  });
  syncPipelineUI();


  // Language switcher (tool page)
  document.querySelectorAll<HTMLButtonElement>(".toolbar-right button[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang as Lang));
  });

  // Mode + crop ratio
  refs.modeSel.addEventListener("change", () => {
    const nextMode = refs!.modeSel.value as CrestMode;
    if (nextMode === currentMode) return;

    currentMode = nextMode;
    setMode(currentMode);

    // Crop aspect is locked to Mode (24×12 for full, 16×12 for clan)
    const desired: CropAspect = currentMode === "only_clan" ? "16x12" : "24x12";
    currentCropAspect = desired;
    setCropAspect(currentCropAspect);

    // Force immediate crop rect rebuild after re-render
    cropRect = null;

    renderRoute();
  });


  // theme
  refs.themeToggle.checked = false;
  refs.themeToggle.addEventListener("change", () => {
    document.documentElement.setAttribute("data-theme", refs!.themeToggle.checked ? "light" : "dark");
  });

  // template load
  loadTemplate();

  // Restore advanced state on render
  refs.advancedPanel.classList.toggle("hidden", !refs.advancedChk.checked);
  refs.debugCard24.classList.toggle("hidden", currentMode !== "ally_clan");
  refs.debugCard16.classList.toggle("hidden", currentMode !== "only_clan");
  refs.resetBtn.classList.toggle("hidden", !refs.advancedChk.checked);

  // advanced toggle
  refs.advancedChk.addEventListener("change", () => {
    const on = refs!.advancedChk.checked;
    advancedOpen = on;
    localStorage.setItem(ADV_OPEN_KEY, advancedOpen ? "1" : "0");
    refs!.advancedPanel.classList.toggle("hidden", !on);
    refs!.debugCard24.classList.toggle("hidden", currentMode !== "ally_clan");
    refs!.debugCard16.classList.toggle("hidden", currentMode !== "only_clan");
    refs!.resetBtn.classList.toggle("hidden", !on);
    scheduleRecomputePreview(0);
  });

  // reset with confirm (only affects advanced controls)
  refs.resetBtn.addEventListener("click", () => {
    if (!refs) return;
    refs.confirmModal.classList.remove("hidden");
  });
  refs.confirmNo.addEventListener("click", () => refs?.confirmModal.classList.add("hidden"));
  refs.confirmYes.addEventListener("click", () => {
    refs?.confirmModal.classList.add("hidden");

    // Reset should also reset Brightness / Contrast (universal)
    setBrightness(0);
    setContrast(0);
    refs!.brightness.value = "0";
    refs!.brightnessVal.textContent = "0";
    refs!.contrast.value = "0";
    refs!.contrastVal.textContent = "0";

    // Reset other advanced defaults only for the non-pixel pipeline
    const pipe = refs!.pipelineSel.value as PipelineMode;
    if (pipe !== "pixel") {
      applyPresetDefaults(refs!.presetSel.value as Preset);
      updateControlAvailability(refs!.presetSel.value as Preset);
    } else {
      // Pixel presets aren't compatible with Preset keys; keep controls hidden/consistent.
      updateControlAvailability("balanced");
    }

    scheduleRecomputePreview(0);
  });

  // preset defaults + change
  if ((refs.pipelineSel.value as PipelineMode) !== "pixel") {
    applyPresetDefaults(refs.presetSel.value as Preset);
    updateControlAvailability(refs.presetSel.value as Preset);
  } else {
    updateControlAvailability("balanced");
  }
  refs.presetSel.addEventListener("change", () => {
    const p = refs!.pipelineSel.value as PipelineMode;
    if (p === "pixel") {
      setPixelPreset(refs!.presetSel.value as PixelPreset);
      updateControlAvailability("balanced");
    } else {
      applyPresetDefaults(refs!.presetSel.value as Preset);
      updateControlAvailability(refs!.presetSel.value as Preset);
    }
    scheduleRecomputePreview(0);
  });

  // range UI
  // Brightness / Contrast (universal)
  refs.brightness.value = String(getBrightness());
  refs.brightnessVal.textContent = String(getBrightness());
  refs.contrast.value = String(getContrast());
  refs.contrastVal.textContent = String(getContrast());

  refs.brightness.addEventListener("input", () => {
    const v = Number(refs!.brightness.value) || 0;
    refs!.brightnessVal.textContent = String(v);
    setBrightness(v);
    scheduleRecomputePreview(50);
  });
  refs.contrast.addEventListener("input", () => {
    const v = Number(refs!.contrast.value) || 0;
    refs!.contrastVal.textContent = String(v);
    setContrast(v);
    scheduleRecomputePreview(50);
  });

    // range UI
  refs.ditherAmt.addEventListener("input", () => {
    refs!.ditherAmtVal.textContent = String(refs!.ditherAmt.value);
    scheduleRecomputePreview(70);
  });

  // rotate buttons (only meaningful when advanced is on, but safe always)
  refs.rotL.addEventListener("click", () => {
    if (!sourceImage) return;
    rotation90 = ((rotation90 + 270) % 360) as any;
    rebuildDisplayCanvas();
    if (displayCanvas) cropRect = initCropToAspect(displayCanvas, aspectRatio(currentCropAspect));
    drawCropUI();
    scheduleRecomputePreview(0);
  });

  refs.rotR.addEventListener("click", () => {
    if (!sourceImage) return;
    rotation90 = ((rotation90 + 90) % 360) as any;
    rebuildDisplayCanvas();
    if (displayCanvas) cropRect = initCropToAspect(displayCanvas, aspectRatio(currentCropAspect));
    drawCropUI();
    scheduleRecomputePreview(0);
  });

  // invert toggle button
  refs.invertBtn.addEventListener("click", () => {
    invertColors = !invertColors;
    refs!.invertBtn.classList.toggle("active", invertColors);
    scheduleRecomputePreview(0);
  });

  // file upload
  refs.fileInput.addEventListener("change", async () => {
    const file = refs!.fileInput.files?.[0];
    if (!file) return;

    sourceImage = await loadImageFromFile(file);

    // reset per-image transforms
    rotation90 = 0;
    invertColors = false;
    refs!.invertBtn.classList.remove("active");

    rebuildDisplayCanvas();
    if (!displayCanvas) return;

    cropRect = initCropToAspect(displayCanvas, aspectRatio(currentCropAspect));
    drawCropUI();

    refs!.resetBtn.disabled = false;
    scheduleRecomputePreview(0);
  });

  // download
  refs.downloadBtn.addEventListener("click", () => {
    if (!palette256) return;
    // In 16×12 mode user wants ONLY clan emblem.
    if (currentMode === "only_clan") {
      if (!iconClan16x12Indexed) return;
      const clanBmp = makeBmp8bitIndexed(16, 12, palette256, iconClan16x12Indexed);
      downloadBlob(clanBmp, "clan_16x12_256.bmp");
      return;
    }

    // In 24×12 mode we export all three files.
    if (!iconCombined24x12Indexed || !iconClan16x12Indexed || !iconAlly8x12Indexed) return;
    downloadBMPs(iconAlly8x12Indexed, iconClan16x12Indexed, iconCombined24x12Indexed, palette256);
  });

  // live recompute for advanced controls
  const live: Array<HTMLElement> = [
	    refs.ditherSel, refs.twoStepChk, refs.centerPaletteChk,
    refs.oklabChk, refs.noiseDitherChk, refs.edgeSharpenChk, refs.cleanupChk,
    refs.useCropChk,
  ];
  for (const el of live) {
    el.addEventListener("change", () => {
      drawCropUI();
      updateControlAvailability(refs!.presetSel.value as Preset);
      scheduleRecomputePreview(70);
    });
    el.addEventListener("input", () => {
      drawCropUI();
      scheduleRecomputePreview(70);
    });
  }

  // crop interactions
  initCropEvents();

// initial preview / restore state after re-render
  const trueW = currentMode === "only_clan" ? 16 : 24;
  const trueH = 12;

  if (sourceImage) {
    // restore invert UI
    refs.invertBtn.classList.toggle("active", invertColors);

    rebuildDisplayCanvas();
    if (displayCanvas && !cropRect) cropRect = initCropToAspect(displayCanvas, aspectRatio(currentCropAspect));
    drawCropUI();

    refs.resetBtn.disabled = false;
    scheduleRecomputePreview(0);
  } else {
    renderPreview();
    drawTrueSizeEmpty(trueW, trueH);
  }
}

// -------------------- PRESET DEFAULTS --------------------
function applyPresetDefaults(p: Preset) {
  // `refs` is initialized after render; keep the function safe and TS-happy.
  const r = refs;
  if (!r) return;

  // Helper to set Strength slider consistently
  const setStrength = (val: number) => {
    const v = String(Math.max(0, Math.min(100, Math.round(val))));
    r.ditherAmt.value = v;
    r.ditherAmtVal.textContent = v;
  };

  // Defaults that most presets share
  r.oklabChk.checked = true;
  r.cleanupChk.checked = true;

  switch (p) {
    case "legacy":
      r.ditherSel.value = "none";
      setStrength(0);
      r.twoStepChk.checked = false;
      r.centerPaletteChk.checked = false;
      r.oklabChk.checked = false;
      r.noiseDitherChk.checked = false;
      r.edgeSharpenChk.checked = false;
      r.cleanupChk.checked = false;
      break;

    case "simple":
      r.ditherSel.value = "none";
      setStrength(25);
      r.twoStepChk.checked = true;
      r.centerPaletteChk.checked = true;
      r.oklabChk.checked = true;
      r.noiseDitherChk.checked = false;
      r.edgeSharpenChk.checked = true;
      r.cleanupChk.checked = true;
      break;

    case "balanced":
      r.ditherSel.value = "ordered4";
      setStrength(45);
      r.twoStepChk.checked = true;
      r.centerPaletteChk.checked = true; // "Balance colors"
      r.oklabChk.checked = true;
      r.noiseDitherChk.checked = true;
      r.edgeSharpenChk.checked = true;
      r.cleanupChk.checked = true;
      break;

    case "complex":
    default:
      r.ditherSel.value = "floyd";
      setStrength(22);
      r.twoStepChk.checked = true;
      r.centerPaletteChk.checked = false;
      r.oklabChk.checked = true;
      r.noiseDitherChk.checked = false;
      r.edgeSharpenChk.checked = false;
      r.cleanupChk.checked = true;
      break;
  }
}


function updateControlAvailability(p: Preset) {
  const r = refs;
  if (!r) return;

  const isPixel = (r.pipelineSel.value as PipelineMode) === "pixel";

  // Helper: hide/show whole control rows without changing layout structure elsewhere
  const setRowVisibleByInput = (input: HTMLElement, visible: boolean) => {
    const row =
      input.closest(".adv-opt") ||
      input.closest(".range") ||
      input.closest(".select");
    if (!row) return;
    row.classList.toggle("hidden", !visible);
  };

  const setToggleVisible = (el: HTMLInputElement, visible: boolean, forceOffWhenHidden = true) => {
    setRowVisibleByInput(el, visible);
    if (!visible && forceOffWhenHidden) el.checked = false;
  };

  // -----------------
  // 1) Strength slider: currently observed as non-functional across all presets -> hide entirely
  // -----------------
  const strengthRow = document.getElementById("strengthRow");
  if (strengthRow) strengthRow.classList.add("hidden");
  r.ditherAmt.disabled = true;

  // -----------------
  // 2) Color smoothing options: MUST BE ALWAYS HIDDEN
  // -----------------

  const smoothingRow = document.getElementById("smoothingRow");
  if (smoothingRow) smoothingRow.classList.add("hidden");

  const allowedDithersByPreset: Record<Preset, DitherMode[]> = {
    legacy: ["none", "ordered4", "ordered8", "atkinson", "floyd"],
    simple: ["none"],
    balanced: ["none", "ordered4", "ordered8", "atkinson", "floyd"],
    complex: ["none"],
  };

  const ditherLabel = (v: DitherMode) => {
    switch (v) {
      case "none":
        return t("Off", "Выкл", "Вимк");
      case "ordered4":
        return t("Pattern 4×4", "Шаблон 4×4", "Візерунок 4×4");
      case "ordered8":
        return t("Pattern 8×8", "Шаблон 8×8", "Візерунок 8×8");
      case "atkinson":
        return t("Smooth (Atkinson)", "Плавно (Atkinson)", "Плавно (Atkinson)");
      case "floyd":
        return t("Smooth (Floyd–Steinberg)", "Плавно (Floyd–Steinberg)", "Плавно (Floyd–Steinberg)");
    }
  };

  const allowed = allowedDithersByPreset[p];
  // Rebuild options only if needed (keeps selection stable when possible)
  const current = (r.ditherSel.value as DitherMode) || "none";
  const allowedSafe = allowed ?? ["none"];
  const nextValue: DitherMode = allowedSafe.includes(current) ? current : "none";

  r.ditherSel.innerHTML = allowedSafe
    .map((v) => `<option value="${v}">${escapeHtml(ditherLabel(v))}</option>`)
    .join("");

  r.ditherSel.value = nextValue;

  // If preset supports only Off, keep the dropdown visible but make it non-interactive (no misleading choices)
  r.ditherSel.disabled = allowedSafe.length <= 1;

  // -----------------
  // 3) Advanced toggles: hide those that have no effect in the current preset (based on current implementation)
  // -----------------
  // Your observed behavior matrix:
  // - Legacy: only Smoother resize affects output (color smoothing selection itself affects output)
  // - Simple: Smoother resize + Sharpen edges
  // - Balanced: Smoother resize + Balance colors + Subtle noise + Sharpen edges + Strength (but Strength is globally hidden for now)
  // - Complex: Smoother resize + Sharpen edges
  //
  // Global dead / not wired:
  // - Better color match (OKLab) -> hide everywhere
  // - Cleanup pixels -> hide everywhere (currently no visible impact)
  // In Pixel conversion these controls must be completely hidden and must not re-appear
  // when switching Pixel presets.
  const showSmootherResize = !isPixel;
  const showBalance = !isPixel && p === "balanced";
  const showSubtleNoise = !isPixel && p === "balanced";
  const showSharpen = !isPixel && p !== "legacy";
  const showBetterMatch = false;
  const showCleanup = false;

  // Smoother resize stays visible always
  setToggleVisible(r.twoStepChk, showSmootherResize, false);

  // Hide per-preset controls
  setToggleVisible(r.centerPaletteChk, showBalance);
  setToggleVisible(r.noiseDitherChk, showSubtleNoise);

  setToggleVisible(r.edgeSharpenChk, showSharpen);

  // Dead / disabled globally
  setToggleVisible(r.oklabChk, showBetterMatch);
  setToggleVisible(r.cleanupChk, showCleanup);



}


// -------------------- IMAGE LOADING --------------------
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image: " + url));
    img.src = url;
  });
}

async function loadTemplate() {
  const tpl = getGameTemplate();

  // Avoid reloading the same template on every render
  if (loadedTemplateSrc === tpl.src && gameTemplateImg) {
    renderPreview();
    return;
  }

  try {
    gameTemplateImg = await loadImageFromUrl(tpl.src);
    loadedTemplateSrc = tpl.src;
    renderPreview();
  } catch {
    gameTemplateImg = null;
    loadedTemplateSrc = null;
    renderPreview();
  }
}

// -------------------- ROTATED DISPLAY CANVAS --------------------
function rebuildDisplayCanvas() {
  if (!sourceImage) {
    displayCanvas = null;
    return;
  }
  if (!displayCanvas) displayCanvas = document.createElement("canvas");

  const sw = sourceImage.width;
  const sh = sourceImage.height;

  const dc = displayCanvas;
  const ctx = dc.getContext("2d")!;

  if (rotation90 === 90 || rotation90 === 270) {
    dc.width = sh;
    dc.height = sw;
  } else {
    dc.width = sw;
    dc.height = sh;
  }

  ctx.clearRect(0, 0, dc.width, dc.height);
  ctx.save();
  ctx.translate(dc.width / 2, dc.height / 2);
  ctx.rotate((rotation90 * Math.PI) / 180);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceImage, -sw / 2, -sh / 2);
  ctx.restore();
}

// -------------------- CROP UI HELPERS --------------------
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function initCropToAspect(img: { width: number; height: number }, targetR: number): CropRect {
  const iw = img.width, ih = img.height;
  const r = iw / ih;

  let w = iw, h = ih;
  if (r > targetR) {
    w = ih * targetR;
    h = ih;
  } else {
    w = iw;
    h = iw / targetR;
  }

  return { x: (iw - w) / 2, y: (ih - h) / 2, w, h };
}


function getContainTransformForCropCanvas(img: { width: number; height: number }, canvas: HTMLCanvasElement) {
  const cw = canvas.width, ch = canvas.height;
  const ir = img.width / img.height;
  const cr = cw / ch;

  let dw = cw, dh = ch;
  if (ir > cr) dh = cw / ir;
  else dw = ch * ir;

  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;

  return { dx, dy, dw, dh };
}

function cropRectToCanvasRect(img: { width: number; height: number }, crop: CropRect, canvas: HTMLCanvasElement) {
  const { dx, dy, dw, dh } = getContainTransformForCropCanvas(img, canvas);
  const rx = dx + (crop.x / img.width) * dw;
  const ry = dy + (crop.y / img.height) * dh;
  const rw = (crop.w / img.width) * dw;
  const rh = (crop.h / img.height) * dh;
  return { rx, ry, rw, rh, dx, dy, dw, dh };
}

function hitCorner(mx: number, my: number, rx: number, ry: number, rw: number, rh: number) {
  const handle = 10;
  const corners: Array<[CropDragMode, number, number]> = [
    ["nw", rx, ry],
    ["ne", rx + rw, ry],
    ["sw", rx, ry + rh],
    ["se", rx + rw, ry + rh],
  ];
  for (const [mode, cx, cy] of corners) {
    if (Math.abs(mx - cx) <= handle && Math.abs(my - cy) <= handle) return mode;
  }
  return null;
}

function drawCropUI() {
  if (!refs) return;
  const { cropCanvas, cropCtx, useCropChk } = refs;

  cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
  if (!sourceImage) return;

  rebuildDisplayCanvas();
  if (!displayCanvas) return;

  const img = displayCanvas;
  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = "high";

  const { dx, dy, dw, dh } = getContainTransformForCropCanvas(img, cropCanvas);
  cropCtx.drawImage(img, dx, dy, dw, dh);

  if (!useCropChk.checked || !cropRect) return;

  const { rx, ry, rw, rh } = cropRectToCanvasRect(img, cropRect, cropCanvas);

  // dim outside
  cropCtx.save();
  cropCtx.fillStyle = "rgba(0,0,0,0.55)";
  cropCtx.beginPath();
  cropCtx.rect(0, 0, cropCanvas.width, cropCanvas.height);
  cropCtx.rect(rx, ry, rw, rh);
  cropCtx.fill("evenodd");
  cropCtx.restore();

  // border
  cropCtx.save();
  cropCtx.lineWidth = 3;
  cropCtx.strokeStyle = "rgba(0,0,0,0.9)";
  cropCtx.strokeRect(rx, ry, rw, rh);

  cropCtx.lineWidth = 1.5;
  cropCtx.strokeStyle = "rgba(255,255,255,0.95)";
  cropCtx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
  cropCtx.restore();

  // thirds grid
  cropCtx.save();
  cropCtx.strokeStyle = "rgba(255,255,255,0.35)";
  cropCtx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    const gx = rx + (rw * i) / 3;
    const gy = ry + (rh * i) / 3;
    cropCtx.beginPath();
    cropCtx.moveTo(gx, ry);
    cropCtx.lineTo(gx, ry + rh);
    cropCtx.stroke();
    cropCtx.beginPath();
    cropCtx.moveTo(rx, gy);
    cropCtx.lineTo(rx + rw, gy);
    cropCtx.stroke();
  }
  cropCtx.restore();

  // corner handles
  cropCtx.save();
  const handle = 8;
  cropCtx.fillStyle = "rgba(255,255,255,0.95)";
  cropCtx.strokeStyle = "rgba(0,0,0,0.9)";
  cropCtx.lineWidth = 2;

  const corners = [
    [rx, ry],
    [rx + rw, ry],
    [rx, ry + rh],
    [rx + rw, ry + rh],
  ];

  for (const [cx, cy] of corners) {
    const x = cx - handle / 2;
    const y = cy - handle / 2;
    cropCtx.fillRect(x, y, handle, handle);
    cropCtx.strokeRect(x, y, handle, handle);
  }
  cropCtx.restore();
}

function getCroppedSource(): HTMLCanvasElement | null {
  if (!sourceImage) return null;
  rebuildDisplayCanvas();
  if (!displayCanvas) return null;
  if (!refs?.useCropChk.checked || !cropRect) return displayCanvas;

  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(cropRect.w));
  c.height = Math.max(1, Math.round(cropRect.h));
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(displayCanvas, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, c.width, c.height);
  return c;
}

function initCropEvents() {
  if (!refs) return;
  const { cropCanvas } = refs;

  // Pointer-based interactions for mouse + touch (mobile crop fix)
  type Pt = { x: number; y: number };
  const pointers = new Map<number, Pt>();
  let pinchStart: null | { dist: number; rect: CropRect; cx: number; cy: number } = null;

  const getCanvasPoint = (e: PointerEvent): Pt => {
    const rect = cropCanvas.getBoundingClientRect();
    const mxCss = e.clientX - rect.left;
    const myCss = e.clientY - rect.top;
    return {
      x: mxCss * (cropCanvas.width / rect.width),
      y: myCss * (cropCanvas.height / rect.height),
    };
  };

  const updateCursor = (mx: number, my: number) => {
    if (!sourceImage || !cropRect || !refs?.useCropChk.checked) {
      cropCanvas.style.cursor = "default";
      return;
    }
    if (cropDragMode !== "none") return;

    rebuildDisplayCanvas();
    if (!displayCanvas) return;

    const { rx, ry, rw, rh } = cropRectToCanvasRect(displayCanvas, cropRect, cropCanvas);
    const corner = hitCorner(mx, my, rx, ry, rw, rh);

    if (corner === "nw" || corner === "se") cropCanvas.style.cursor = "nwse-resize";
    else if (corner === "ne" || corner === "sw") cropCanvas.style.cursor = "nesw-resize";
    else if (mx >= rx && mx <= rx + rw && my >= ry && my <= ry + rh) cropCanvas.style.cursor = "move";
    else cropCanvas.style.cursor = "default";
  };

  cropCanvas.addEventListener("pointerdown", (e) => {
    if (!sourceImage || !cropRect || !refs?.useCropChk.checked) return;

    cropCanvas.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    pointers.set(e.pointerId, pt);

    // Pinch start (2 fingers)
    if (pointers.size === 2) {
      const arr = Array.from(pointers.values());
      const dx = arr[0].x - arr[1].x;
      const dy = arr[0].y - arr[1].y;
      const dist = Math.max(1, Math.hypot(dx, dy));

      rebuildDisplayCanvas();
      if (!displayCanvas) return;

      pinchStart = {
        dist,
        rect: { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h },
        cx: cropRect.x + cropRect.w / 2,
        cy: cropRect.y + cropRect.h / 2,
      };

      cropDragMode = "none";
      return;
    }

    // Single-pointer drag (move/resize)
    rebuildDisplayCanvas();
    if (!displayCanvas) return;

    const { rx, ry, rw, rh } = cropRectToCanvasRect(displayCanvas, cropRect, cropCanvas);
    const corner = hitCorner(pt.x, pt.y, rx, ry, rw, rh);

    if (corner) {
      cropDragMode = corner;
      const start = { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h };
      let ax = 0, ay = 0;
      if (corner === "nw") { ax = start.x + start.w; ay = start.y + start.h; }
      if (corner === "ne") { ax = start.x;           ay = start.y + start.h; }
      if (corner === "sw") { ax = start.x + start.w; ay = start.y; }
      if (corner === "se") { ax = start.x;           ay = start.y; }
      dragAnchor = { ax, ay, start };
      return;
    }

    const inside = pt.x >= rx && pt.x <= rx + rw && pt.y >= ry && pt.y <= ry + rh;
    if (!inside) return;

    cropDragMode = "move";
    dragStart = { mx: pt.x, my: pt.y, x: cropRect.x, y: cropRect.y };
  });

  cropCanvas.addEventListener("pointermove", (e) => {
    const pt = getCanvasPoint(e);
    pointers.set(e.pointerId, pt);

    // Update cursor for mouse hover
    if (e.pointerType === "mouse" && pointers.size === 1 && cropDragMode === "none") {
      updateCursor(pt.x, pt.y);
    }

    if (!sourceImage || !cropRect || !refs?.useCropChk.checked) return;

    rebuildDisplayCanvas();
    if (!displayCanvas) return;
    const dc = displayCanvas;

    // Pinch zoom (2 pointers)
    if (pointers.size === 2 && pinchStart) {
      const arr = Array.from(pointers.values());
      const dx = arr[0].x - arr[1].x;
      const dy = arr[0].y - arr[1].y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const ratio = dist / pinchStart.dist;

      const r = aspectRatio(currentCropAspect);

      let nw = pinchStart.rect.w / ratio; // pinch out -> ratio>1 -> nw smaller (zoom in)
      nw = clamp(nw, 24, dc.width);
      let nh = nw / r;
      if (nh > dc.height) { nh = dc.height; nw = nh * r; }

      cropRect.w = nw;
      cropRect.h = nh;
      cropRect.x = clamp(pinchStart.cx - nw / 2, 0, dc.width - nw);
      cropRect.y = clamp(pinchStart.cy - nh / 2, 0, dc.height - nh);

      drawCropUI();
      scheduleRecomputePreview(60);
      return;
    }

    if (cropDragMode === "none") return;

    const { dx, dw, dy, dh } = getContainTransformForCropCanvas(dc, cropCanvas);

    const canvasToSrcX = (val: number) => (val / dw) * dc.width;
    const canvasToSrcY = (val: number) => (val / dh) * dc.height;

    if (cropDragMode === "move") {
      const deltaXCanvas = pt.x - dragStart.mx;
      const deltaYCanvas = pt.y - dragStart.my;

      cropRect.x = dragStart.x + canvasToSrcX(deltaXCanvas);
      cropRect.y = dragStart.y + canvasToSrcY(deltaYCanvas);

      cropRect.x = clamp(cropRect.x, 0, dc.width - cropRect.w);
      cropRect.y = clamp(cropRect.y, 0, dc.height - cropRect.h);

      drawCropUI();
      scheduleRecomputePreview(60);
      return;
    }

    // resize corner while keeping selected aspect
    const nx = (pt.x - dx) / dw;
    const ny = (pt.y - dy) / dh;
    const px = clamp(nx, 0, 1) * dc.width;
    const py = clamp(ny, 0, 1) * dc.height;

    const { ax, ay } = dragAnchor;

    const dxAbs = Math.abs(px - ax);
    const dyAbs = Math.abs(py - ay);

    const wFromX = dxAbs;
    const r = aspectRatio(currentCropAspect);
    const wFromY = r * dyAbs;

    let w = Math.max(wFromX, wFromY);
    const minW = 24;
    w = Math.max(minW, w);
    let h = w / r;

    if (w > dc.width) { w = dc.width; h = w / r; }
    if (h > dc.height) { h = dc.height; w = h * r; }

    let x = 0, y = 0;
    if (cropDragMode === "nw") { x = ax - w; y = ay - h; }
    else if (cropDragMode === "ne") { x = ax; y = ay - h; }
    else if (cropDragMode === "sw") { x = ax - w; y = ay; }
    else { x = ax; y = ay; }

    x = clamp(x, 0, dc.width - w);
    y = clamp(y, 0, dc.height - h);

    cropRect.x = x; cropRect.y = y; cropRect.w = w; cropRect.h = h;

    drawCropUI();
    scheduleRecomputePreview(60);
  });

  const endPointer = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) cropDragMode = "none";
  };

  cropCanvas.addEventListener("pointerup", endPointer);
  cropCanvas.addEventListener("pointercancel", endPointer);

  // Mouse wheel zoom (desktop)
  cropCanvas.addEventListener("wheel", (e) => {
    if (!sourceImage || !cropRect || !refs?.useCropChk.checked) return;
    rebuildDisplayCanvas();
    if (!displayCanvas) return;

    e.preventDefault();

    const zoomIn = e.deltaY < 0;
    const k = zoomIn ? 0.90 : 1.10;

    const cx = cropRect.x + cropRect.w / 2;
    const cy = cropRect.y + cropRect.h / 2;

    let nw = cropRect.w * k;
    nw = clamp(nw, 24, displayCanvas.width);
    const rWheel = aspectRatio(currentCropAspect);
    let nh = nw / rWheel;

    if (nh > displayCanvas.height) {
      nh = displayCanvas.height;
      nw = nh * rWheel;
    }

    cropRect.w = nw;
    cropRect.h = nh;

    cropRect.x = clamp(cx - nw / 2, 0, displayCanvas.width - nw);
    cropRect.y = clamp(cy - nh / 2, 0, displayCanvas.height - nh);

    drawCropUI();
    scheduleRecomputePreview(60);
  }, { passive: false });
}

// -------------------- DOWNSCALE TO 24×12 --------------------
function renderCoverToSize(
  img: CanvasImageSource,
  sw: number,
  sh: number,
  tw: number,
  th: number,
  smoothing: boolean
): ImageData {
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = smoothing;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, tw, th);

  const ir = sw / sh;
  const tr = tw / th;

  let cropW = sw, cropH = sh;
  if (ir > tr) {
    cropW = sh * tr;
    cropH = sh;
  } else {
    cropW = sw;
    cropH = sw / tr;
  }

  const sx = (sw - cropW) / 2;
  const sy = (sh - cropH) / 2;

  // @ts-ignore
  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, tw, th);
  return ctx.getImageData(0, 0, tw, th);
}

function renderToSize(src: HTMLCanvasElement, preset: Preset, useTwoStep: boolean, tw: number, th: number): ImageData {
  const sw = src.width;
  const sh = src.height;

  const smoothFirst = preset !== "simple" && preset !== "legacy";
  const smoothSingle = preset === "complex";
  const smoothLegacy = preset === "legacy";

  if (!useTwoStep) {
    return renderCoverToSize(src, sw, sh, tw, th, smoothLegacy ? false : smoothSingle);
  }

  // Upscale the intermediate stage proportionally (keeps details for tiny output)
  const midW = tw * 4;
  const midH = th * 4;

  const mid = renderCoverToSize(src, sw, sh, midW, midH, smoothLegacy ? false : smoothFirst);
  const midCanvas = document.createElement("canvas");
  midCanvas.width = midW;
  midCanvas.height = midH;
  const mctx = midCanvas.getContext("2d")!;
  mctx.putImageData(mid, 0, 0);

  // final step no smoothing for sharper pixels
  return renderCoverToSize(midCanvas, midW, midH, tw, th, false);
}

// -------------------- EDGE SHARPEN (LIGHT) --------------------

function edgeAwareSharpen(img: ImageData, amount = 0.9, edgeThreshold = 10) {
  const w = img.width, h = img.height;
  const src = img.data;
  const out = new Uint8ClampedArray(src.length);

  const idx = (x: number, y: number) => (y * w + x) * 4;

  const lumaAt = (x: number, y: number) => {
    const p = idx(x, y);
    return 0.2126 * src[p] + 0.7152 * src[p + 1] + 0.0722 * src[p + 2];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p0 = idx(x, y);

      const xm1 = clamp(x - 1, 0, w - 1), xp1 = clamp(x + 1, 0, w - 1);
      const ym1 = clamp(y - 1, 0, h - 1), yp1 = clamp(y + 1, 0, h - 1);

      const gx =
        (lumaAt(xp1, ym1) + 2 * lumaAt(xp1, y) + lumaAt(xp1, yp1)) -
        (lumaAt(xm1, ym1) + 2 * lumaAt(xm1, y) + lumaAt(xm1, yp1));
      const gy =
        (lumaAt(xm1, yp1) + 2 * lumaAt(x, yp1) + lumaAt(xp1, yp1)) -
        (lumaAt(xm1, ym1) + 2 * lumaAt(x, ym1) + lumaAt(xp1, ym1));

      const edge = Math.sqrt(gx * gx + gy * gy);

      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = clamp(x + dx, 0, w - 1);
          const yy = clamp(y + dy, 0, h - 1);
          const p = idx(xx, yy);
          r += src[p];
          g += src[p + 1];
          b += src[p + 2];
          n++;
        }
      }
      const br = r / n, bg = g / n, bb = b / n;

      if (edge > edgeThreshold) {
        out[p0]     = clamp(src[p0]     + amount * (src[p0]     - br), 0, 255);
        out[p0 + 1] = clamp(src[p0 + 1] + amount * (src[p0 + 1] - bg), 0, 255);
        out[p0 + 2] = clamp(src[p0 + 2] + amount * (src[p0 + 2] - bb), 0, 255);
        out[p0 + 3] = src[p0 + 3];
      } else {
        out[p0]     = src[p0];
        out[p0 + 1] = src[p0 + 1];
        out[p0 + 2] = src[p0 + 2];
        out[p0 + 3] = src[p0 + 3];
      }
    }
  }
  img.data.set(out);
}

// Very gentle levels normalization (kept intentionally subtle for tiny 24×12 / 16×12 icons).
function softNormalizeLevels(img: ImageData, preset: Preset): void {
  if (preset === "legacy") return;
  // Strength is small on purpose to avoid "fried" photos and noisy gradients.
  let strength = 0.12;
  if (preset === "simple") strength = 0.18;
  else if (preset === "balanced") strength = 0.14;
  else if (preset === "complex") strength = 0.06;

  const d = img.data;
  let rMin = 255, gMin = 255, bMin = 255;
  let rMax = 0, gMax = 0, bMax = 0;

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a === 0) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (r < rMin) rMin = r;
    if (g < gMin) gMin = g;
    if (b < bMin) bMin = b;
    if (r > rMax) rMax = r;
    if (g > gMax) gMax = g;
    if (b > bMax) bMax = b;
  }

  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;

  // If image is already flat (or transparent), do nothing.
  if (rRange < 8 && gRange < 8 && bRange < 8) return;

  const rScale = rRange > 0 ? 255 / rRange : 1;
  const gScale = gRange > 0 ? 255 / gRange : 1;
  const bScale = bRange > 0 ? 255 / bRange : 1;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const rn = clamp((r - rMin) * rScale, 0, 255);
    const gn = clamp((g - gMin) * gScale, 0, 255);
    const bn = clamp((b - bMin) * bScale, 0, 255);
    d[i]     = clamp(Math.round(lerp(r, rn, strength)), 0, 255);
    d[i + 1] = clamp(Math.round(lerp(g, gn, strength)), 0, 255);
    d[i + 2] = clamp(Math.round(lerp(b, bn, strength)), 0, 255);
  }
}

function quantizeTo256(
  img: ImageData,
  ditherMode: DitherMode,
  ditherStrength01: number,
  _balanceColors: boolean,
  _useOKLab: boolean,
  useNoiseOrdered: boolean
): { palette: Uint8Array; indices: Uint8Array } {
  // Build 256-color palette with image-q defaults (rollback from NeuQuant/Wu choices).
  const pc = utils.PointContainer.fromImageData(img);
  // image-q expects an array of PointContainers
  const pal = buildPaletteSync([pc], { colors: 256, colorDistanceFormula: "euclidean" } as any);

  // Extract palette into packed RGB bytes (256 * 3).
  const palette = new Uint8Array(256 * 3);
  const palPC = (pal as any).getPointContainer?.() ?? (pal as any)._pointContainer;
  const pts: any[] = palPC?.getPointArray?.() ?? palPC?.points ?? [];
  const count = Math.min(256, pts.length);
  for (let i = 0; i < count; i++) {
    const p = pts[i];
    palette[i * 3 + 0] = p.r ?? p[0] ?? 0;
    palette[i * 3 + 1] = p.g ?? p[1] ?? 0;
    palette[i * 3 + 2] = p.b ?? p[2] ?? 0;
  }

  // Nearest palette index (brute force is fine for 24×12 / 16×12).
  const nearestIndex = (r8: number, g8: number, b8: number): number => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < 256; i++) {
      const pr = palette[i * 3 + 0];
      const pg = palette[i * 3 + 1];
      const pb = palette[i * 3 + 2];
      const dr = r8 - pr;
      const dg = g8 - pg;
      const db = b8 - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
        if (dist === 0) break;
      }
    }
    return best;
  };

  const w = img.width;
  const h = img.height;
  const rgba = img.data;
  const indices = new Uint8Array(w * h);

  const strength = clamp(ditherStrength01, 0, 1);

  // Small deterministic noise for ordered dithering.
  const hash01 = (x: number, y: number): number => {
    let n = (x * 374761393) ^ (y * 668265263);
    n = (n ^ (n >>> 13)) * 1274126177;
    n = (n ^ (n >>> 16)) >>> 0;
    return n / 0xffffffff;
  };

  // Error diffusion dithering (linear scan only; serpentine was rolled back).
  if (ditherMode === "floyd" || ditherMode === "atkinson") {
    const errR = new Float32Array(w * h);
    const errG = new Float32Array(w * h);
    const errB = new Float32Array(w * h);

    const addErr = (x: number, y: number, er: number, eg: number, eb: number, wgt: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const j = y * w + x;
      errR[j] += er * wgt;
      errG[j] += eg * wgt;
      errB[j] += eb * wgt;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const p = i * 4;

        const r = clamp(rgba[p + 0] + errR[i], 0, 255);
        const g = clamp(rgba[p + 1] + errG[i], 0, 255);
        const b = clamp(rgba[p + 2] + errB[i], 0, 255);

        const idx = nearestIndex(r, g, b);
        indices[i] = idx;

        const pr = palette[idx * 3 + 0];
        const pg = palette[idx * 3 + 1];
        const pb = palette[idx * 3 + 2];

        const er = (r - pr) * strength;
        const eg = (g - pg) * strength;
        const eb = (b - pb) * strength;

        if (ditherMode === "atkinson") {
          // Atkinson diffusion: 6 neighbors, each 1/8
          const wgt = 1 / 8;
          addErr(x + 1, y,     er, eg, eb, wgt);
          addErr(x + 2, y,     er, eg, eb, wgt);
          addErr(x - 1, y + 1, er, eg, eb, wgt);
          addErr(x,     y + 1, er, eg, eb, wgt);
          addErr(x + 1, y + 1, er, eg, eb, wgt);
          addErr(x,     y + 2, er, eg, eb, wgt);
        } else {
          // Floyd–Steinberg diffusion
          addErr(x + 1, y,     er, eg, eb, 7 / 16);
          addErr(x - 1, y + 1, er, eg, eb, 3 / 16);
          addErr(x,     y + 1, er, eg, eb, 5 / 16);
          addErr(x + 1, y + 1, er, eg, eb, 1 / 16);
        }
      }
    }

    return { palette, indices };
  }

  // Ordered dithering (Bayer) + optional noise.
  const bayer4 = [
    0,  8,  2, 10,
    12, 4, 14, 6,
    3, 11, 1,  9,
    15, 7, 13, 5,
  ];
  const bayer8 = [
    0, 48, 12, 60, 3, 51, 15, 63,
    32, 16, 44, 28, 35, 19, 47, 31,
    8, 56, 4, 52, 11, 59, 7, 55,
    40, 24, 36, 20, 43, 27, 39, 23,
    2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29,
    10, 58, 6, 54, 9, 57, 5, 53,
    42, 26, 38, 22, 41, 25, 37, 21,
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const p = i * 4;

      let r = rgba[p + 0];
      let g = rgba[p + 1];
      let b = rgba[p + 2];

      if (ditherMode === "ordered4" || ditherMode === "ordered8") {
        if (useNoiseOrdered) {
          const t = hash01(x, y) - 0.5;
          const offset = t * 36 * strength;
          r = clamp(r + offset, 0, 255);
          g = clamp(g + offset, 0, 255);
          b = clamp(b + offset, 0, 255);
        } else {
          const is8 = ditherMode === "ordered8";
          const t = is8
            ? (bayer8[(y % 8) * 8 + (x % 8)] / 63)
            : (bayer4[(y % 4) * 4 + (x % 4)] / 15);
          const offset = (t - 0.5) * 32 * strength;
          r = clamp(r + offset, 0, 255);
          g = clamp(g + offset, 0, 255);
          b = clamp(b + offset, 0, 255);
        }
      }

      indices[i] = nearestIndex(r, g, b);
    }
  }

  return { palette, indices };
}

// ---------------- Pixel pipeline (fixed palette + ordered dither) ----------------

function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x; }
function clamp255(x: number): number { return x < 0 ? 0 : x > 255 ? 255 : x; }

function buildWinHalftone256Palette(): Uint8Array {
  const levels = [0, 51, 102, 153, 204, 255];
  const colors: number[] = [];

  // 216-color 6x6x6 cube
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) colors.push(levels[r], levels[g], levels[b]);
    }
  }

  // Avoid duplicates with cube-grays
  const cubeGraySet = new Set<number>();
  for (let i = 0; i < colors.length; i += 3) {
    const rr = colors[i], gg = colors[i + 1], bb = colors[i + 2];
    if (rr === gg && gg === bb) cubeGraySet.add(rr);
  }

  // Add grayscale ramp (non-duplicate)
  const grayCount = 40;
  for (let k = 0; k < grayCount; k++) {
    const v = Math.round((k * 255) / (grayCount - 1));
    if (!cubeGraySet.has(v)) colors.push(v, v, v);
  }

  // Pad/truncate to exactly 256
  const total = Math.floor(colors.length / 3);
  if (total < 256) {
    const pad = (256 - total) * 3;
    for (let i = 0; i < pad; i++) colors.push(0);
  } else if (total > 256) {
    colors.length = 256 * 3;
  }

  return Uint8Array.from(colors);
}

const BAYER8: number[] = [
  0, 48, 12, 60, 3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
  8, 56, 4, 52, 11, 59, 7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
  2, 50, 14, 62, 1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58, 6, 54, 9, 57, 5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
];

function nearestPaletteIndexRGB(
  r: number, g: number, b: number,
  palR: Uint8Array, palG: Uint8Array, palB: Uint8Array
): number {
  let best = 0;
  let bestD = 1e9;
  for (let i = 0; i < 256; i++) {
    const dr = r - palR[i];
    const dg = g - palG[i];
    const db = b - palB[i];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = i;
      if (d === 0) break;
    }
  }
  return best;
}

function quantizeOrderedDither256(
  img: ImageData,
  palette: Uint8Array,
  strength01: number,
  edgeFriendlyBias: boolean
): Uint8Array {
  const { width: w, height: h, data } = img;

  const palR = new Uint8Array(256);
  const palG = new Uint8Array(256);
  const palB = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    palR[i] = palette[i * 3 + 0];
    palG[i] = palette[i * 3 + 1];
    palB[i] = palette[i * 3 + 2];
  }

  const out = new Uint8Array(w * h);
  const amp = 24 * clamp01(strength01);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = data[i + 0];
      let g = data[i + 1];
      let b = data[i + 2];
      const a = data[i + 3];

      // Transparent -> black (typical crest behavior)
      if (a < 16) {
        out[y * w + x] = nearestPaletteIndexRGB(0, 0, 0, palR, palG, palB);
        continue;
      }

      const t = BAYER8[(y & 7) * 8 + (x & 7)]; // 0..63
      const d = ((t / 63) - 0.5) * 2;          // -1..+1

      if (edgeFriendlyBias) {
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = clamp255(r + d * amp);
        g = clamp255(g + d * amp);
        b = clamp255(b + d * amp);
        const l2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const dl = l - l2;
        r = clamp255(r + dl * 0.25);
        g = clamp255(g + dl * 0.25);
        b = clamp255(b + dl * 0.25);
      } else {
        r = clamp255(r + d * amp);
        g = clamp255(g + d * amp);
        b = clamp255(b + d * amp);
      }

      out[y * w + x] = nearestPaletteIndexRGB(r, g, b, palR, palG, palB);
    }
  }

  return out;
}

function quantizePixel256(img: ImageData, preset: PixelPreset): { palette: Uint8Array; indices: Uint8Array } {
  // Pixel presets are designed to be predictable and distinct from Modern:
  // - Clean: fixed 256 palette + light ordered dither
  // - Crisp: subtle edge emphasis (no blur), then fixed palette + ordered dither (sharper boundaries)
  // - Stable: fixed palette + ordered dither, then a mild majority cleanup pass to reduce isolated pixels/checkerboard
  // - Indexed: palette-first (adaptive 256-color), no dithering (preserve palette character)

  if (preset === "pixel-indexed") {
    // Adaptive palette from the image, no dithering.
    return quantizeTo256(img, "none", 0, false, false, false);
  }

  // Fixed palette + ordered dither (closest to classic "256 palette" tools)
  const palette = buildWinHalftone256Palette();

  let work = img;
  let strength = 0.28; // Clean default
  const edgeBias = true;

  if (preset === "pixel-crisp") {
    // Slight edge emphasis after resize to make boundaries more confident without Modern-like smoothing.
    work = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
    edgeAwareSharpen(work, 0.75, 12);
    strength = 0.38;
  } else if (preset === "pixel-stable") {
    strength = 0.45;
  } else {
    // pixel-clean
    strength = 0.28;
  }

  const indices = quantizeOrderedDither256(work, palette, strength, edgeBias);

  if (preset === "pixel-stable") {
    // Mild post cleanup to reduce isolated pixels / checkerboard artifacts.
    cleanupIndicesMajoritySafe(indices, work.width, work.height, palette, 2, 5, 85);
  }

  return { palette, indices };
}




function cleanupIndicesMajoritySafe(
  indices: Uint8Array,
  w: number,
  h: number,
  palette: Uint8Array,
  passCount = 1,
  minMajority = 6,
  maxColorJump = 90
) {
  let src = indices;

  const distRGB = (a: number, b: number) => {
    const ar = palette[a * 3], ag = palette[a * 3 + 1], ab = palette[a * 3 + 2];
    const br = palette[b * 3], bg = palette[b * 3 + 1], bb = palette[b * 3 + 2];
    const dr = ar - br, dg = ag - bg, db = ab - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  for (let pass = 0; pass < passCount; pass++) {
    const out = new Uint8Array(src.length);
    out.set(src);

    const at = (x: number, y: number) => src[y * w + x];

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const self = at(x, y);

        let sameCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const v = at(x + dx, y + dy);
            if (v === self) sameCount++;
          }
        }
        if (sameCount >= 1) continue;

        const counts = new Map<number, number>();
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const v = at(x + dx, y + dy);
            counts.set(v, (counts.get(v) ?? 0) + 1);
          }
        }

        let bestVal = self;
        let bestCount = -1;
        for (const [val, c] of counts.entries()) {
          if (c > bestCount) {
            bestCount = c;
            bestVal = val;
          }
        }

        if (bestCount < minMajority) continue;
        if (distRGB(self, bestVal) > maxColorJump) continue;

        out[y * w + x] = bestVal;
      }
    }

    src = out;
  }

  indices.set(src);
}

// -------------------- DRAW TRUE SIZE + DEBUG --------------------
function setTrueSizeCanvasDims(w: number, h: number) {
  if (!refs) return;
  if (refs.dstTrueCanvas.width !== w) refs.dstTrueCanvas.width = w;
  if (refs.dstTrueCanvas.height !== h) refs.dstTrueCanvas.height = h;
}

function drawTrueSizeEmpty(w: number, h: number) {
  if (!refs) return;
  setTrueSizeCanvasDims(w, h);
  refs.dstTrueCtx.clearRect(0, 0, w, h);
  refs.dstTrueCtx.fillStyle = "rgba(255,255,255,0.06)";
  refs.dstTrueCtx.fillRect(0, 0, w, h);
}

function drawTrueSize(indices: Uint8Array, palette: Uint8Array, w: number, h: number) {
  if (!refs) return;
  setTrueSizeCanvasDims(w, h);
  const img = refs.dstTrueCtx.createImageData(w, h);
  const data = img.data;
  for (let i = 0; i < w * h; i++) {
    const idx = indices[i];
    data[i * 4 + 0] = palette[idx * 3 + 0];
    data[i * 4 + 1] = palette[idx * 3 + 1];
    data[i * 4 + 2] = palette[idx * 3 + 2];
    data[i * 4 + 3] = 255;
  }
  refs.dstTrueCtx.putImageData(img, 0, 0);
}

function drawZoomTo(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  indices: Uint8Array,
  palette: Uint8Array,
  w: number,
  h: number
) {
  const zoom = 10;
  // Ensure canvas size (w*zoom x h*zoom) matches expected
  const cw = w * zoom;
  const ch = h * zoom;
  if (canvas.width !== cw) canvas.width = cw;
  if (canvas.height !== ch) canvas.height = ch;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = indices[y * w + x];
      const r = palette[idx * 3 + 0];
      const g = palette[idx * 3 + 1];
      const b = palette[idx * 3 + 2];
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
    }
  }
}

// -------------------- PREVIEW RENDER --------------------
function renderPreview() {
  if (!refs) return;
  const canvas = refs.previewCanvas;
  const ctx = refs.previewCtx;

  const tpl = getGameTemplate();

  const tw = tpl.baseW;
  const th = tpl.baseH;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.round(tw * dpr);
  canvas.height = Math.round(th * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, tw, th);

  // background template 1:1 in template space
  if (gameTemplateImg) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(gameTemplateImg, 0, 0, tw, th);
  } else {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, tw, th);
    ctx.fillStyle = "#aaa";
    ctx.font = "28px system-ui, sans-serif";
    const name = tpl.src.split("/").pop() || tpl.src;
    ctx.fillText(`Template not found. Put ${name} in /public/templates/`, 40, 70);
    return;
  }

  // Pick the correct output for the current mode.
  // IMPORTANT: in 16×12 mode we must NOT draw the padded 24×12 (it shows as a black 8×12 block).
  if (!palette256) return;
  const isClanOnly = currentMode === "only_clan";
  const indices = isClanOnly ? iconClan16x12Indexed : iconCombined24x12Indexed;
  const iw = isClanOnly ? 16 : 24;
  const ih = 12;
  if (!indices) return;

  // build RGBA image
  const img = ctx.createImageData(iw, ih);
  for (let i = 0; i < iw * ih; i++) {
    const idx = indices[i];
    img.data[i * 4 + 0] = palette256[idx * 3 + 0];
    img.data[i * 4 + 1] = palette256[idx * 3 + 1];
    img.data[i * 4 + 2] = palette256[idx * 3 + 2];
    img.data[i * 4 + 3] = 255;
  }

  const tmp = document.createElement("canvas");
  tmp.width = iw;
  tmp.height = ih;
  tmp.getContext("2d")!.putImageData(img, 0, 0);

  // Emblem: scale with smoothing ON to feel closer to in-game UI scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tmp, tpl.slotX, tpl.slotY, tpl.slotW, tpl.slotH);
}

function downloadBMPs(ally8: Uint8Array, clan16: Uint8Array, combined24: Uint8Array, palette: Uint8Array) {
  const h = 12;

  const allyBmp = makeBmp8bitIndexed(8, h, palette, ally8);
  const clanBmp = makeBmp8bitIndexed(16, h, palette, clan16);
  const combinedBmp = makeBmp8bitIndexed(24, h, palette, combined24);

  downloadBlob(allyBmp, "ally_8x12_256.bmp");
  downloadBlob(clanBmp, "clan_16x12_256.bmp");
  downloadBlob(combinedBmp, "crest_24x12_256.bmp");
}


function clampDitherStrength(preset: Preset, mode: DitherMode, v01: number): number {
  let v = clamp(v01, 0, 1);
  if (mode === "none") return 0;

  // Ordered patterns can tolerate a bit more; error-diffusion gets "fried" easily on tiny 24×12.
  const capsOrdered: Record<Preset, number> = {
    legacy: 0.0,
    simple: 0.45,
    balanced: 0.60,
    complex: 0.45,
  };

  const capsDiffusion: Record<Preset, number> = {
    legacy: 0.0,
    simple: 0.22,
    balanced: 0.30,
    complex: 0.26,
  };

  if (mode === "ordered4" || mode === "ordered8") return Math.min(v, capsOrdered[preset]);
  if (mode === "floyd" || mode === "atkinson") return Math.min(v, capsDiffusion[preset]);
  return v;
}

// -------------------- RECOMPUTE PIPELINE --------------------
let previewTimer: number | null = null;

function scheduleRecomputePreview(delayMs = 120) {
  if (previewTimer) window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    previewTimer = null;
    requestAnimationFrame(() => recomputePreview());
  }, delayMs);
}

function recomputePreview() {
  if (!refs) return;
  if (!sourceImage) return;

  const pipeline = refs.pipelineSel.value as PipelineMode;
  const presetVal = refs.presetSel.value;
  const preset = (pipeline === "pixel" ? "balanced" : (presetVal as Preset));
  const pixelPreset = (pipeline === "pixel" ? (presetVal as PixelPreset) : getPixelPreset());
  const dither = refs.ditherSel.value as DitherMode;
  const isPixel = pipeline === "pixel";

  // In Pixel conversion, these must not affect the output (and are hidden in UI):
  // Smoother resize / Balance colors / Subtle noise / Sharpen edges
  const useTwoStep = isPixel ? false : refs.twoStepChk.checked;
  const centerWeighted = isPixel ? false : refs.centerPaletteChk.checked;
  const dAmtRaw = Number(refs.ditherAmt.value) / 100;
  const dAmt = pipeline === "pixel" ? 0 : clampDitherStrength(preset, dither, dAmtRaw);

  const useOKLab = refs.oklabChk.checked;
  const useNoiseOrdered = isPixel ? false : refs.noiseDitherChk.checked;
  const doEdgeSharpen = isPixel ? false : refs.edgeSharpenChk.checked;
  const doCleanup = refs.cleanupChk.checked;

  const src = getCroppedSource();
  if (!src) return;

  const baseW = currentMode === "only_clan" ? 16 : 24;
  const baseH = 12;

  // Downscale to base size
  const imgBase = renderToSize(src, preset, useTwoStep, baseW, baseH);

  // snap alpha
  for (let i = 0; i < imgBase.data.length; i += 4) imgBase.data[i + 3] = imgBase.data[i + 3] < 128 ? 0 : 255;

  // invert (before sharpen/quantize)
  if (invertColors) {
    for (let i = 0; i < imgBase.data.length; i += 4) {
      imgBase.data[i] = 255 - imgBase.data[i];
      imgBase.data[i + 1] = 255 - imgBase.data[i + 1];
      imgBase.data[i + 2] = 255 - imgBase.data[i + 2];
    }
  }

  // Brightness + Contrast (universal, applies to Modern and Pixel)
  const brightness = getBrightness();
  const contrast = getContrast();
  if (brightness !== 0 || contrast !== 0) {
    const c = contrast;
    const k = (259 * (c + 255)) / (255 * (259 - c));
    for (let i = 0; i < imgBase.data.length; i += 4) {
      let r = imgBase.data[i] + brightness;
      let g = imgBase.data[i + 1] + brightness;
      let b = imgBase.data[i + 2] + brightness;

      r = clamp255((r - 128) * k + 128);
      g = clamp255((g - 128) * k + 128);
      b = clamp255((b - 128) * k + 128);

      imgBase.data[i] = r;
      imgBase.data[i + 1] = g;
      imgBase.data[i + 2] = b;
    }
  }

  // balance colors (very gentle levels normalization)
  if (centerWeighted) {
    softNormalizeLevels(imgBase, preset);
  }

  // edge-sharpen
  if (doEdgeSharpen) {
    // Safer sharpening tuned per preset (tiny icons "fry" easily)
    let amount = 0.0;
    let thr = 12;

    if (preset === "legacy") { amount = 0.0; thr = 12; }
    else if (preset === "simple") { amount = 1.05; thr = 9; }
    else if (preset === "balanced") { amount = 0.85; thr = 11; }
    else if (preset === "complex") { amount = 0.35; thr = 16; }

    if (amount > 0) edgeAwareSharpen(imgBase, amount, thr);
  }

  // Quantize
  const q =
    isPixel
      ? quantizePixel256(imgBase, pixelPreset)
      : quantizeTo256(imgBase, dither, dAmt, centerWeighted, useOKLab, useNoiseOrdered);
  palette256 = q.palette;

  if (baseW === 24) {
    const combined = q.indices; // non-null
    iconCombined24x12Indexed = combined;

    // split
    const ally = new Uint8Array(8 * 12);
    const clan = new Uint8Array(16 * 12);

    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 8; x++) ally[y * 8 + x] = combined[y * 24 + x];
      for (let x = 0; x < 16; x++) clan[y * 16 + x] = combined[y * 24 + (8 + x)];
    }

    iconAlly8x12Indexed = ally;
    iconClan16x12Indexed = clan;
  } else {
    // Only clan (16x12) => pad to 24x12 for preview + downloads
    const clan = q.indices; // non-null
    iconClan16x12Indexed = clan;

    const combined = new Uint8Array(24 * 12);
    combined.fill(0);
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 16; x++) combined[y * 24 + (8 + x)] = clan[y * 16 + x];
    }
    iconCombined24x12Indexed = combined;

    const ally = new Uint8Array(8 * 12);
    ally.fill(0);
    iconAlly8x12Indexed = ally;
  }

  // Cleanup (run on the combined 24×12 so all exports look consistent)
  if (doCleanup && iconCombined24x12Indexed && palette256) {
    const passes = 1;
    const minMaj = preset === "simple" ? 6 : 7;
    const maxJump = preset === "simple" ? 110 : 80;
    cleanupIndicesMajoritySafe(iconCombined24x12Indexed, 24, 12, palette256, passes, minMaj, maxJump);
    // re-split after cleanup
    if (iconAlly8x12Indexed && iconClan16x12Indexed) {
      for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 8; x++) iconAlly8x12Indexed[y * 8 + x] = (iconCombined24x12Indexed ?? q.indices)[y * 24 + x];
        for (let x = 0; x < 16; x++) iconClan16x12Indexed[y * 16 + x] = (iconCombined24x12Indexed ?? q.indices)[y * 24 + (8 + x)];
      }
    }
  }

  // True size depends on mode
  if (currentMode === "only_clan" && iconClan16x12Indexed && palette256) {
    drawTrueSize(iconClan16x12Indexed, palette256, 16, 12);
  } else if (iconCombined24x12Indexed && palette256) {
    drawTrueSize(iconCombined24x12Indexed, palette256, 24, 12);
  }

  if (palette256) {
    if (currentMode === "only_clan" && iconClan16x12Indexed) {
      drawZoomTo(refs.dstZoom16Canvas, refs.dstZoom16Ctx, iconClan16x12Indexed, palette256, 16, 12);
    } else if (iconCombined24x12Indexed) {
      drawZoomTo(refs.dstZoom24Canvas, refs.dstZoom24Ctx, iconCombined24x12Indexed, palette256, 24, 12);
    }
  }

  // Enable download depending on Mode
  refs.downloadBtn.disabled = !(palette256 && (currentMode === "only_clan" ? !!iconClan16x12Indexed : !!iconCombined24x12Indexed));

  // Update game preview with current output
  renderPreview();
}

// -------------------- BMP WRITER + DOWNLOAD --------------------
function makeBmp8bitIndexed(
  width: number,
  height: number,
  paletteRGB: Uint8Array,
  indices: Uint8Array
): Blob {
  const rowSize = Math.ceil(width / 4) * 4;
  const pixelArraySize = rowSize * height;

  const fileHeaderSize = 14;
  const dibHeaderSize = 40;
  const paletteSize = 256 * 4;
  const pixelDataOffset = fileHeaderSize + dibHeaderSize + paletteSize;
  const fileSize = pixelDataOffset + pixelArraySize;

  const buf = new ArrayBuffer(fileSize);
  const dv = new DataView(buf);
  let p = 0;

  dv.setUint8(p++, 0x42);
  dv.setUint8(p++, 0x4D);
  dv.setUint32(p, fileSize, true); p += 4;
  dv.setUint16(p, 0, true); p += 2;
  dv.setUint16(p, 0, true); p += 2;
  dv.setUint32(p, pixelDataOffset, true); p += 4;

  dv.setUint32(p, dibHeaderSize, true); p += 4;
  dv.setInt32(p, width, true); p += 4;
  dv.setInt32(p, height, true); p += 4;
  dv.setUint16(p, 1, true); p += 2;
  dv.setUint16(p, 8, true); p += 2;
  dv.setUint32(p, 0, true); p += 4;
  dv.setUint32(p, pixelArraySize, true); p += 4;
  dv.setInt32(p, 2835, true); p += 4;
  dv.setInt32(p, 2835, true); p += 4;
  dv.setUint32(p, 256, true); p += 4;
  dv.setUint32(p, 256, true); p += 4;

  for (let i = 0; i < 256; i++) {
    const r = paletteRGB[i * 3 + 0];
    const g = paletteRGB[i * 3 + 1];
    const b = paletteRGB[i * 3 + 2];
    dv.setUint8(p++, b);
    dv.setUint8(p++, g);
    dv.setUint8(p++, r);
    dv.setUint8(p++, 0);
  }

  const u8 = new Uint8Array(buf);
  let pixOffset = pixelDataOffset;

  for (let y = height - 1; y >= 0; y--) {
    const rowStart = y * width;
    for (let x = 0; x < width; x++) u8[pixOffset + x] = indices[rowStart + x];
    for (let x = width; x < rowSize; x++) u8[pixOffset + x] = 0;
    pixOffset += rowSize;
  }

  return new Blob([u8], { type: "image/bmp" });
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// -------------------- POLICY CONTENT (EN/RU/UA) --------------------
function privacyPolicyHtml(): string {
  const lastUpdated = "January 2026";

  const en = `
    <p><b>Last updated:</b> ${lastUpdated}</p>

    <h3>Overview</h3>
    <p>CrestMaker is a privacy-first tool. Image processing is performed locally in your browser.</p>

    <h3>Image processing</h3>
    <ul>
      <li><b>Local-only:</b> images are processed on your device</li>
      <li><b>No uploads:</b> images are not sent to our servers</li>
      <li><b>No storage:</b> we do not store your images</li>
    </ul>

    <h3>Data we collect</h3>
    <p>We do not require accounts and do not collect names, emails, or uploaded images.</p>

    <h3>Cookies</h3>
    <p>Currently, CrestMaker does not use cookies for tracking. In the future, we may use strictly necessary cookies for essential functionality.</p>

    <h3>Advertising (Google AdSense) & consent</h3>
    <p>If advertising (such as Google AdSense) is enabled in the future, it may set cookies or use similar technologies. Where required by law (e.g., in the EEA/UK), we will request your consent before showing personalized ads.</p>

    <h3>Contact</h3>
    <p>If you have questions, please contact us via the website contact information.</p>
  `;

  const ru = `
    <p><b>Дата обновления:</b> ${lastUpdated}</p>

    <h3>Общее</h3>
    <p>CrestMaker — инструмент с приоритетом конфиденциальности. Обработка изображений выполняется локально в браузере.</p>

    <h3>Обработка изображений</h3>
    <ul>
      <li><b>Только локально:</b> обработка на вашем устройстве</li>
      <li><b>Без загрузки:</b> изображения не отправляются на наши серверы</li>
      <li><b>Без хранения:</b> мы не сохраняем ваши изображения</li>
    </ul>

    <h3>Какие данные мы собираем</h3>
    <p>Регистрация не нужна. Мы не собираем имена, email и загруженные изображения.</p>

    <h3>Cookies</h3>
    <p>Сейчас CrestMaker не использует cookies для трекинга. В будущем могут быть добавлены только строго необходимые cookies для работы функций сайта.</p>

    <h3>Реклама (Google AdSense) и согласие</h3>
    <p>Если в будущем будет подключена реклама (например, Google AdSense), она может использовать cookies или аналогичные технологии. Там, где это требуется законом (например, в EEA/UK), мы будем запрашивать согласие перед показом персонализированной рекламы.</p>

    <h3>Контакты</h3>
    <p>Если у вас есть вопросы, свяжитесь с нами через контактную информацию на сайте.</p>
  `;

  const ua = `
    <p><b>Дата оновлення:</b> ${lastUpdated}</p>

    <h3>Загальна інформація</h3>
    <p>CrestMaker — інструмент із пріоритетом конфіденційності. Обробка зображень виконується локально у вашому браузері.</p>

    <h3>Обробка зображень</h3>
    <ul>
      <li><b>Локально:</b> обробка на вашому пристрої</li>
      <li><b>Без завантаження:</b> зображення не надсилаються на наші сервери</li>
      <li><b>Без зберігання:</b> ми не зберігаємо ваші зображення</li>
    </ul>

    <h3>Які дані ми збираємо</h3>
    <p>Реєстрація не потрібна. Ми не збираємо імена, email або завантажені зображення.</p>

    <h3>Cookies</h3>
    <p>Наразі CrestMaker не використовує cookies для трекінгу. У майбутньому можуть бути додані лише строго необхідні cookies для роботи функцій сайту.</p>

    <h3>Реклама (Google AdSense) та згода</h3>
    <p>Якщо у майбутньому буде підключено рекламу (наприклад, Google AdSense), вона може використовувати cookies або подібні технології. Там, де це вимагається законом (наприклад, EEA/UK), ми запитуватимемо вашу згоду перед показом персоналізованої реклами.</p>

    <h3>Контакти</h3>
    <p>Якщо у вас є питання, зв’яжіться з нами через контактну інформацію на сайті.</p>
  `;

  return currentLang === "ru" ? ru : currentLang === "ua" ? ua : en;
}

function termsHtml(): string {
  const lastUpdated = "January 2026";

  const en = `
    <p><b>Last updated:</b> ${lastUpdated}</p>

    <h3>1. Service</h3>
    <p>CrestMaker provides a browser-based image conversion tool for creating game crests.</p>

    <h3>2. Your content</h3>
    <ul>
      <li>You are responsible for the images you upload and confirm you have the right to use them.</li>
      <li>We do not claim ownership of your images.</li>
    </ul>

    <h3>3. Acceptable use</h3>
    <p>You agree not to use the service for illegal purposes or to violate intellectual property rights.</p>

    <h3>4. Availability</h3>
    <p>The service is provided “as is” and may be updated, changed, or discontinued at any time.</p>

    <h3>5. Disclaimer</h3>
    <p>We do not guarantee compatibility with any specific game server or client. Use at your own risk.</p>
  `;

  const ru = `
    <p><b>Дата обновления:</b> ${lastUpdated}</p>

    <h3>1. Сервис</h3>
    <p>CrestMaker — это браузерный инструмент для конвертации изображений в формат игровых гербов.</p>

    <h3>2. Ваш контент</h3>
    <ul>
      <li>Вы несёте ответственность за изображения и подтверждаете, что имеете право их использовать.</li>
      <li>Мы не претендуем на права на ваши изображения.</li>
    </ul>

    <h3>3. Допустимое использование</h3>
    <p>Запрещено использовать сервис в незаконных целях или нарушать права третьих лиц.</p>

    <h3>4. Доступность</h3>
    <p>Сервис предоставляется «как есть» и может изменяться или быть прекращён в любое время.</p>

    <h3>5. Отказ от гарантий</h3>
    <p>Мы не гарантируем совместимость с конкретными серверами/клиентами игр. Использование — на ваш риск.</p>
  `;

  const ua = `
    <p><b>Дата оновлення:</b> ${lastUpdated}</p>

    <h3>1. Сервіс</h3>
    <p>CrestMaker — це браузерний інструмент для конвертації зображень у формат ігрових емблем.</p>

    <h3>2. Ваш контент</h3>
    <ul>
      <li>Ви відповідаєте за зображення та підтверджуєте, що маєте право їх використовувати.</li>
      <li>Ми не претендуємо на права на ваші зображення.</li>
    </ul>

    <h3>3. Допустиме використання</h3>
    <p>Заборонено використовувати сервіс у незаконних цілях або порушувати права третіх осіб.</p>

    <h3>4. Доступність</h3>
    <p>Сервіс надається «як є» і може змінюватися або бути припинений у будь-який час.</p>

    <h3>5. Відмова від гарантій</h3>
    <p>Ми не гарантуємо сумісність із конкретними серверами/клієнтами ігор. Використання — на ваш ризик.</p>
  `;

  return currentLang === "ru" ? ru : currentLang === "ua" ? ua : en;
}

function gdprHtml(): string {
  const lastUpdated = "January 2026";

  const en = `
    <p><b>Last updated:</b> ${lastUpdated}</p>

    <h3>GDPR summary</h3>
    <p>CrestMaker does not collect or store personal data. Image processing is local-only.</p>

    <h3>Lawful basis</h3>
    <p>Because we do not process personal data, a lawful basis under Article 6 is not applicable in the current version.</p>

    <h3>Cookies & consent (future)</h3>
    <p>If ads or analytics are enabled in the future, we will show a consent banner where required and provide options to manage preferences.</p>
  `;

  const ru = `
    <p><b>Дата обновления:</b> ${lastUpdated}</p>

    <h3>Кратко о GDPR</h3>
    <p>CrestMaker не собирает и не хранит персональные данные. Обработка изображений выполняется локально.</p>

    <h3>Правовое основание</h3>
    <p>Так как персональные данные не обрабатываются, основание по статье 6 GDPR в текущей версии неприменимо.</p>

    <h3>Cookies и согласие (на будущее)</h3>
    <p>Если в будущем будут включены реклама или аналитика, мы покажем баннер согласия там, где это требуется, и дадим возможность управлять настройками.</p>
  `;

  const ua = `
    <p><b>Дата оновлення:</b> ${lastUpdated}</p>

    <h3>Коротко про GDPR</h3>
    <p>CrestMaker не збирає та не зберігає персональні дані. Обробка зображень виконується локально.</p>

    <h3>Правова підстава</h3>
    <p>Оскільки персональні дані не обробляються, правова підстава за статтею 6 GDPR у поточній версії не застосовується.</p>

    <h3>Cookies і згода (на майбутнє)</h3>
    <p>Якщо у майбутньому буде увімкнено рекламу або аналітику, ми покажемо банер згоди там, де це потрібно, і дамо можливість керувати налаштуваннями.</p>
  `;

  return currentLang === "ru" ? ru : currentLang === "ua" ? ua : en;
}

function aboutHtml(): string {
  const en = `
    <h3>What is CrestMaker?</h3>
    <p>CrestMaker is a free, browser-based tool for converting images into game-ready crests.</p>

    <h3>Privacy-first</h3>
    <ul>
      <li>No accounts</li>
      <li>No uploads — local processing only</li>
      <li>Lightweight and fast</li>
    </ul>

    <h3>Why it exists</h3>
    <p>To make crest creation simple and safe — without installing software and without sending images to any server.</p>
  `;

  const ru = `
    <h3>Что такое CrestMaker?</h3>
    <p>CrestMaker — бесплатный браузерный инструмент для конвертации изображений в игровые гербы.</p>

    <h3>Приватность</h3>
    <ul>
      <li>Без аккаунтов</li>
      <li>Без загрузки на сервер — обработка только локально</li>
      <li>Лёгкий и быстрый</li>
    </ul>

    <h3>Зачем он нужен</h3>
    <p>Чтобы сделать создание герба простым и безопасным — без установки софта и без отправки изображений куда-либо.</p>
  `;

  const ua = `
    <h3>Що таке CrestMaker?</h3>
    <p>CrestMaker — безкоштовний браузерний інструмент для конвертації зображень у ігрові емблеми.</p>

    <h3>Конфіденційність</h3>
    <ul>
      <li>Без акаунтів</li>
      <li>Без надсилання на сервер — лише локальна обробка</li>
      <li>Легкий та швидкий</li>
    </ul>

    <h3>Навіщо він потрібен</h3>
    <p>Щоб зробити створення емблеми простим і безпечним — без встановлення програм і без відправки зображень кудись.</p>
  `;

  return currentLang === "ru" ? ru : currentLang === "ua" ? ua : en;
}

// -------------------- SMALL UTIL --------------------
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}