import "./style.css";
import { renderToSize, edgeAwareSharpen, softNormalizeLevels, clampDitherStrength, quantizeTo256 } from "./pipeline/modern";
import { cleanupIndicesMajoritySafe, quantizePixel256 } from "./pipeline/pixel";

import { privacyPolicyHtml } from "./content/privacy";
import { termsHtml } from "./content/terms";
import { gdprHtml } from "./content/gdpr";
import { aboutHtml } from "./content/about";
import type { Lang } from "./i18n";
import { currentLang, setLang as setLangCore, t, tipAttr, helpHtml } from "./i18n";

import { downloadBMPs, makeBmp8bitIndexed, downloadBlob } from "./bmp/writer";
import { createCropController, initCropToAspect } from "./ui/crop";
import { initDisplayCanvas, rebuildDisplayCanvas } from "./ui/displayCanvas";
import { initPreview, renderPreview, scheduleRecomputePreview, recomputePreview } from "./ui/preview";
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
function setLang(lang: Lang) {
  // Preserve advanced toggle state across language switches
  if (refs?.advancedChk) {
    advancedOpen = refs.advancedChk.checked;
    localStorage.setItem(ADV_OPEN_KEY, advancedOpen ? "1" : "0");
  }
  setLangCore(lang);
  renderRoute();
  // re-render cookie banner text if visible
  renderCookieBannerIfNeeded();
  localizeCookieUI();
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

  if (path === "/privacy") return renderPolicyPage(t("Privacy Policy","Политика конфиденциальности","Політика конфіденційності"), privacyPolicyHtml(currentLang));
  if (path === "/terms") return renderPolicyPage(t("Terms of Service","Пользовательское соглашение","Умови користування"), termsHtml(currentLang));
  if (path === "/about") return renderPolicyPage(t("About","О проекте","Про проєкт"), aboutHtml(currentLang));
  if (path === "/gdpr") return renderPolicyPage("GDPR", gdprHtml(currentLang));

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
let cropController: ReturnType<typeof createCropController> | null = null;


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

initDisplayCanvas({
  getSourceImage: () => sourceImage,
  getRotation90: () => rotation90,
  getDisplayCanvas: () => displayCanvas,
  setDisplayCanvas: (c) => {
    displayCanvas = c;
  },
});
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

initPreview({
  getRefs: () => refs,
  getSourceImage: () => sourceImage,
  getCurrentMode: () => currentMode,
  getInvertColors: () => invertColors,

  getGameTemplate: () => getGameTemplate(),
  getGameTemplateImg: () => gameTemplateImg,

  getPixelPreset: () => getPixelPreset(),
  getBrightness: () => getBrightness(),
  getContrast: () => getContrast(),
  clamp255,

  getCroppedSource: () => cropController?.getCroppedSource() ?? null,

  renderToSize,
  edgeAwareSharpen,
  softNormalizeLevels,

  clampDitherStrength,
  quantizeTo256,
  quantizePixel256,
  cleanupIndicesMajoritySafe,

  drawTrueSizeEmpty,
  drawTrueSize,
  drawZoomTo,

  // 🔽 🔽 🔽 ДОБАВИТЬ ВОТ ЭТО 🔽 🔽 🔽

  getPalette256: () => palette256,
  setPalette256: (p) => {
    palette256 = p;
  },

  getIconAlly8: () => iconAlly8x12Indexed,
  setIconAlly8: (v) => {
    iconAlly8x12Indexed = v;
  },

  getIconClan16: () => iconClan16x12Indexed,
  setIconClan16: (v) => {
    iconClan16x12Indexed = v;
  },

  getIconCombined24: () => iconCombined24x12Indexed,
  setIconCombined24: (v) => {
    iconCombined24x12Indexed = v;
  },
});

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


  // Crop controller (moved to src/ui/crop.ts)
  cropController = createCropController({
    getRefs: () => refs,
    getSourceImage: () => sourceImage,
    getDisplayCanvas: () => displayCanvas,
    rebuildDisplayCanvas,
    getCropRect: () => cropRect,
    setCropRect: (r) => { cropRect = r; },
    scheduleRecomputePreview,

    getCropDragMode: () => cropDragMode,
    setCropDragMode: (m) => { cropDragMode = m; },
    getDragStart: () => dragStart,
    setDragStart: (v) => { dragStart = v; },
    getDragAnchor: () => dragAnchor,
    setDragAnchor: (v) => { dragAnchor = v; },
  });

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
    cropController?.drawCropUI();
    scheduleRecomputePreview(0);
  });

  refs.rotR.addEventListener("click", () => {
    if (!sourceImage) return;
    rotation90 = ((rotation90 + 90) % 360) as any;
    rebuildDisplayCanvas();
    if (displayCanvas) cropRect = initCropToAspect(displayCanvas, aspectRatio(currentCropAspect));
    cropController?.drawCropUI();
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
    cropController?.drawCropUI();

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
      cropController?.drawCropUI();
      updateControlAvailability(refs!.presetSel.value as Preset);
      scheduleRecomputePreview(70);
    });
    el.addEventListener("input", () => {
      cropController?.drawCropUI();
      scheduleRecomputePreview(70);
    });
  }

  // crop interactions
  cropController?.initCropEvents();
// initial preview / restore state after re-render
  const trueW = currentMode === "only_clan" ? 16 : 24;
  const trueH = 12;

  if (sourceImage) {
    // restore invert UI
    refs.invertBtn.classList.toggle("active", invertColors);

    rebuildDisplayCanvas();
    if (displayCanvas && !cropRect) cropRect = initCropToAspect(displayCanvas, aspectRatio(currentCropAspect));
    cropController?.drawCropUI();

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

// -------------------- DOWNSCALE TO 24×12 --------------------




// -------------------- EDGE SHARPEN (LIGHT) --------------------



// Very gentle levels normalization (kept intentionally subtle for tiny 24×12 / 16×12 icons).




// ---------------- Pixel pipeline (fixed palette + ordered dither) ----------------



















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

// -------------------- SMALL UTIL --------------------
function clamp255(x: number): number { return x < 0 ? 0 : x > 255 ? 255 : x; }
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}