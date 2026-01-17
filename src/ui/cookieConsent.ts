import { t } from "../i18n";

const SHARE_URL = "https://crestmaker.org";

let toastTimer: number | null = null;
function showToast(message: string) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  el.classList.add("show");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.remove("show");
    el.classList.add("hidden");
  }, 1400);
}


function getShareText(): string {
  return t(
    "CrestMaker is a free online tool for creating Lineage 2 clan and alliance crests. Convert images to BMP 256-color crests (24x12 / 16x12) directly in your browser - no install, no registration.",
    "CrestMaker - бесплатный онлайн-инструмент для создания клановых и альянс-иконок Lineage 2. Конвертирует изображения в BMP 256 цветов (24x12 / 16x12) прямо в браузере, без установки и регистрации.",
    "CrestMaker - безкоштовний онлайн-інструмент для створення кланових та альянс-іконок Lineage 2. Конвертація зображень у BMP 256 кольорів (24x12 / 16x12) прямо в браузері, без встановлення та реєстрації."
  );
}

type ConsentState = {
  essential: true;
  analytics: boolean;
  ads: boolean;
  updatedAt: string; // ISO
};

const CONSENT_KEY = "cm_consent_v1";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
  const modal = document.querySelector<HTMLDivElement>("#cookieModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  syncCookieModalFromState();
  localizeCookieUI();
}

function closeCookieModal() {
  const modal = document.querySelector<HTMLDivElement>("#cookieModal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function syncCookieModalFromState() {
  const state = getConsent();
  const analytics = document.querySelector<HTMLInputElement>("#cookieAnalytics");
  const ads = document.querySelector<HTMLInputElement>("#cookieAds");
  if (analytics) analytics.checked = state ? state.analytics : false;
  if (ads) ads.checked = state ? state.ads : false;
}

export function localizeCookieUI() {
  const setText = (selector: string, value: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) el.textContent = value;
  };

  const hasConsent = !!getConsent();
  // Elements may not exist yet depending on render order; setText is safe.

  setText("#cookieModalTitle", t("Cookie preferences", "Настройки cookies", "Налаштування cookies"));
  setText("#cookieModalDesc", t(
    "Choose which cookies you allow. You can change your choice anytime.",
    "Выберите, какие cookies разрешить. Настройки можно изменить в любое время.",
    "Оберіть, які cookies дозволити. Налаштування можна змінити будь-коли."
  ));

  setText("#cookieEssentialTitle", t("Essential", "Необходимые", "Необхідні"));
  setText("#cookieEssentialDesc", t(
    "Required for the site to work (saved settings).",
    "Нужны для работы сайта (сохранение настроек).",
    "Потрібні для роботи сайту (збереження налаштувань)."
  ));
  setText("#cookieEssentialAlways", t("Always on", "Всегда включены", "Завжди увімкнені"));

  setText("#cookieAnalyticsTitle", t("Analytics", "Аналитика", "Аналітика"));
  setText("#cookieAnalyticsDesc", t(
    "Helps us understand usage (if enabled in the future).",
    "Помогает понять использование (если будет подключено в будущем).",
    "Допомагає зрозуміти використання (якщо буде підключено в майбутньому)."
  ));

  setText("#cookieAdsTitle", t("Advertising", "Реклама", "Реклама"));
  setText("#cookieAdsDesc", t(
    "Used for ads personalization (e.g., Google AdSense) if enabled.",
    "Используется для персонализации рекламы (например, Google AdSense), если будет включено.",
    "Використовується для персоналізації реклами (наприклад, Google AdSense), якщо буде увімкнено."
  ));

  setText("#cookieCancel", t("Cancel", "Отмена", "Скасувати"));
  setText("#cookieSave", hasConsent
    ? t("Save", "Сохранить", "Зберегти")
    : t("Save & continue", "Сохранить и продолжить", "Зберегти та продовжити"));
}

export function renderCookieBannerIfNeeded() {
  // Only show if no consent has been stored yet.
  if (getConsent()) return;

  const root = document.querySelector<HTMLDivElement>("#cookieRoot");
  if (!root) return;

  root.innerHTML = `
    <div data-testid="cookie-banner" style="
      position:fixed;
      left:0; right:0; bottom:0;
      padding: 12px 12px 14px;
      background: var(--panel);
      border-top: 1px solid var(--border);
      box-shadow: 0 -10px 30px rgba(0,0,0,.25);
      z-index: 1200;
    ">
      <div style="max-width:1200px; margin:0 auto; display:flex; gap:12px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap;">
        <div style="min-width:240px; max-width:820px;">
          <div style="font-weight:700; margin-bottom:4px;">${escapeHtml(t("Cookies", "Cookies", "Cookies"))}</div>
          <div class="muted" style="font-size:13px; line-height:1.35;">
            ${escapeHtml(t(
              "We use cookies to remember your preferences and to improve the tool. You can accept all cookies or manage optional ones.",
              "Мы используем cookies, чтобы запоминать ваши настройки и улучшать инструмент. Вы можете принять все cookies или настроить необязательные.",
              "Ми використовуємо cookies, щоб запамʼятовувати ваші налаштування та покращувати інструмент. Ви можете прийняти всі cookies або налаштувати необов’язкові."
            ))}
            <a href="#/privacy" style="margin-left:8px; text-decoration:underline;">${escapeHtml(t("Learn more", "Подробнее", "Детальніше"))}</a>
          </div>
        </div>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button data-testid="cookie-manage" class="btn" id="cookieManage">${escapeHtml(t("Manage options", "Настроить", "Налаштувати"))}</button>
          <button data-testid="cookie-reject" class="btn" id="cookieReject">${escapeHtml(t("Reject optional", "Отклонить необязательные", "Відхилити необов’язкові"))}</button>
          <button data-testid="cookie-accept" class="btn primary" id="cookieAccept">${escapeHtml(t("Accept all", "Принять все", "Прийняти все"))}</button>
        </div>
      </div>
    </div>
  `;
}

export let cookieUiBound = false;

export function initCookieConsentUI() {
  if (cookieUiBound) return;
  cookieUiBound = true;

  // Event delegation so it works regardless of render timing.
  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Footer "Cookies" link
    const footerLink = target.closest("#cookieSettingsLink");
    if (footerLink) {
      e.preventDefault();
      openCookieModal();
      return;
    }

    // Footer "Share" links (Telegram / X)
    const shareTelegramLink = target.closest("#shareTelegramLink");
    if (shareTelegramLink) {
      e.preventDefault();
      const text = encodeURIComponent(getShareText());
      const url = encodeURIComponent(SHARE_URL);
      const shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const shareXLink = target.closest("#shareXLink");
    if (shareXLink) {
      e.preventDefault();
      const text = encodeURIComponent(getShareText());
      const url = encodeURIComponent(SHARE_URL);
      const shareUrl = `https://x.com/intent/post?url=${url}&text=${text}`;
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Footer "Share: Discord" button (copies link)
    const shareDiscordBtn = target.closest("#shareDiscordBtn");
    if (shareDiscordBtn) {
      e.preventDefault();
      const btnEl = shareDiscordBtn as HTMLButtonElement;
      const payload = `${getShareText()}\n\n${SHARE_URL}`;
      try {
        await navigator.clipboard.writeText(payload);
        const prevTitle = btnEl.title;
        btnEl.classList.add("is-copied");
        btnEl.title = "Copied!";
        showToast(t("Link copied","Ссылка скопирована","Посилання скопійовано"));
        window.setTimeout(() => {
          btnEl.classList.remove("is-copied");
          btnEl.title = prevTitle;
        }, 1200);
      } catch {
        // ignore
      }
      return;
    }

    // Banner buttons
    if (target.closest("#cookieManage")) {
      e.preventDefault();
      openCookieModal();
      return;
    }
    if (target.closest("#cookieReject")) {
      e.preventDefault();
      setConsent({ essential: true, analytics: false, ads: false });
      return;
    }
    if (target.closest("#cookieAccept")) {
      e.preventDefault();
      setConsent({ essential: true, analytics: true, ads: true });
      return;
    }

    // Modal actions
    if (target.closest("#cookieCancel")) {
      e.preventDefault();
      closeCookieModal();
      return;
    }
    if (target.closest("#cookieSave")) {
      e.preventDefault();
      const analytics = document.querySelector<HTMLInputElement>("#cookieAnalytics")?.checked ?? false;
      const ads = document.querySelector<HTMLInputElement>("#cookieAds")?.checked ?? false;
      setConsent({ essential: true, analytics, ads });
      closeCookieModal();
      return;
    }

    // Click outside modal-card closes modal
    const modal = document.querySelector<HTMLDivElement>("#cookieModal");
    if (modal && target === modal) {
      closeCookieModal();
      return;
    }
  });

  // Try to render banner now; if app hasn't rendered yet, it will be a no-op.
  renderCookieBannerIfNeeded();
}