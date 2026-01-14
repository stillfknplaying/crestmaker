type Lang = "en" | "ru" | "ua";

export function privacyPolicyHtml(lang: Lang): string {
  const en = `<p>We respect your privacy. This tool works entirely in your browser.</p>

<h3>What data we collect</h3>
<ul>
  <li>We do not upload your images to any server</li>
  <li>No personal data is collected or stored</li>
  <li>We only use cookies to remember your preferences</li>
</ul>

<h3>Cookies</h3>
<p>Cookies are used only to store:</p>
<ul>
  <li>Language preference</li>
  <li>UI settings</li>
</ul>

<p>No tracking, analytics, or third-party cookies are used.</p>
`;

  const ru = `<p>Мы уважаем вашу конфиденциальность. Этот инструмент полностью работает в вашем браузере.</p>

<h3>Какие данные мы собираем</h3>
<ul>
  <li>Изображения не загружаются на сервер</li>
  <li>Персональные данные не собираются и не хранятся</li>
  <li>Cookies используются только для сохранения настроек</li>
</ul>

<h3>Cookies</h3>
<p>Cookies используются исключительно для:</p>
<ul>
  <li>Выбора языка</li>
  <li>Настроек интерфейса</li>
</ul>

<p>Мы не используем аналитику, трекеры или сторонние cookies.</p>
`;

  const ua = `<p>Ми поважаємо вашу конфіденційність. Цей інструмент повністю працює у вашому браузері.</p>

<h3>Які дані ми збираємо</h3>
<ul>
  <li>Зображення не завантажуються на сервер</li>
  <li>Персональні дані не збираються та не зберігаються</li>
  <li>Cookies використовуються лише для збереження налаштувань</li>
</ul>

<h3>Cookies</h3>
<p>Cookies використовуються виключно для:</p>
<ul>
  <li>Вибору мови</li>
  <li>Налаштувань інтерфейсу</li>
</ul>

<p>Ми не використовуємо аналітику, трекери або сторонні cookies.</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
