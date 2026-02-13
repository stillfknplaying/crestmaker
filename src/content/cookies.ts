import type { Lang } from "../i18n";

export function cookiesHtml(lang: Lang): string {
  if (lang === "ru") {
    return `
      <p>Сайт использует cookies для работы интерфейса и для аналитики/рекламы (если включено).</p>
      <ul>
        <li><b>Обязательные</b>: настройки темы, локализация, состояние интерфейса.</li>
        <li><b>Аналитика</b>: помогает понять, какие функции используются (включается пользователем).</li>
        <li><b>Реклама</b>: используется для показа объявлений (включается пользователем).</li>
      </ul>
      <p>Вы можете изменить выбор в любой момент:</p>
      <p>
        <button id="cookieOpenPrefs" class="btn">Открыть настройки cookies</button>
      </p>
    `;
  }
  if (lang === "ua") {
    return `
      <p>Сайт використовує cookies для роботи інтерфейсу та для аналітики/реклами (якщо увімкнено).</p>
      <ul>
        <li><b>Обов'язкові</b>: налаштування теми, локалізація, стан інтерфейсу.</li>
        <li><b>Аналітика</b>: допомагає зрозуміти, які функції використовуються (вмикається користувачем).</li>
        <li><b>Реклама</b>: використовується для показу оголошень (вмикається користувачем).</li>
      </ul>
      <p>Ви можете змінити вибір у будь‑який момент:</p>
      <p>
        <button id="cookieOpenPrefs" class="btn">Відкрити налаштування cookies</button>
      </p>
    `;
  }
  return `
    <p>This site uses cookies for UI functionality and for analytics/ads (if enabled).</p>
    <ul>
      <li><b>Essential</b>: theme, language, UI state.</li>
      <li><b>Analytics</b>: helps understand feature usage (opt‑in).</li>
      <li><b>Ads</b>: used to show ads (opt‑in).</li>
    </ul>
    <p>You can change your choice at any time:</p>
    <p>
      <button id="cookieOpenPrefs" class="btn">Open cookie preferences</button>
    </p>
  `;
}
