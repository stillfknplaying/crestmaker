import type { Lang } from "../i18n";

export function cookiesHtml(lang: Lang): string {
  if (lang === "ru") {
    return `
      <h3>Cookies</h3>
      <p>Сайт использует cookies для работы интерфейса и аналитики (если включено).</p>
      <ul>
        <li><b>Обязательные</b>: настройки темы, локализация, состояние интерфейса.</li>
        <li><b>Аналитика</b>: помогает понять, какие функции используются (включается пользователем).</li>
      </ul>
      <p>Чтобы изменить выбор, нажми кнопку <b>Cookies</b> в футере.</p>
    `;
  }
  if (lang === "ua") {
    return `
      <h3>Cookies</h3>
      <p>Сайт використовує cookies для роботи інтерфейсу та аналітики (якщо увімкнено).</p>
      <ul>
        <li><b>Обов'язкові</b>: налаштування теми, локалізація, стан інтерфейсу.</li>
        <li><b>Аналітика</b>: допомагає зрозуміти, які функції використовуються (вмикається користувачем).</li>
      </ul>
      <p>Щоб змінити вибір, натисни кнопку <b>Cookies</b> у футері.</p>
    `;
  }
  return `
    <h3>Cookies</h3>
    <p>This site uses cookies for UI functionality and analytics (if enabled).</p>
    <ul>
      <li><b>Essential</b>: theme, language, UI state.</li>
      <li><b>Analytics</b>: helps understand feature usage (opt-in).</li>
    </ul>
    <p>To change your choice, use the <b>Cookies</b> link in the footer.</p>
  `;
}
