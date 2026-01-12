import { t } from "../i18n";

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

export function localizeCookieUI() {
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
  save.textContent = hasConsent
    ? t("Save", "Сохранить", "Зберегти")
    : t("Save & continue", "Сохранить и продолжить", "Зберегти та продовжити");
}

export function renderCookieBannerIfNeeded() {
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

export function initCookieConsentUI() {
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

export function initHelpTooltips() {
  if ((window as any).__cmHelpTipsInit) return;
  (window as any).__cmHelpTipsInit = true;

  const closeAll = () => {
    document.querySelectorAll<HTMLElement>(".helpwrap.open").forEach((el) => el.classList.remove("open"));
  };

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
    if (!(e.target as HTMLElement | null)?.closest?.(".helpwrap")) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Escape") closeAll();
  });
}
