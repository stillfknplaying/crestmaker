type Lang = "en" | "ru" | "ua";

export function privacyPolicyHtml(lang: Lang): string {
  const en = `
<p>We respect your privacy. CrestMaker works entirely in your browser.</p>

<h3>What data we collect</h3>
<ul>
  <li>We do not upload your images to any server</li>
  <li>No personal data is collected or stored</li>
  <li>We only use cookies to remember your preferences</li>
</ul>

<h3>Cookies</h3>
<p>We use <b>localStorage</b> (and, if needed, cookies) only to remember:</p>
<ul>
  <li>Language preference</li>
  <li>UI settings</li>
  <li>Your cookie consent choices (essential / analytics / ads)</li>
</ul>

<p>By default, CrestMaker does not load any third‑party analytics or advertising SDKs. If this changes in the future, it will only happen when you explicitly enable the relevant category in the cookie settings.</p>

<p class="muted">Last updated: January 2026</p>
`;

  const ru = `
<p>Мы уважаем вашу конфиденциальность. CrestMaker полностью работает в вашем браузере.</p>

<h3>Какие данные мы собираем</h3>
<ul>
  <li>Изображения не загружаются на сервер</li>
  <li>Персональные данные не собираются и не хранятся</li>
  <li>Cookies используются только для сохранения настроек</li>
</ul>

<h3>Cookies</h3>
<p>Мы используем <b>localStorage</b> (и при необходимости cookies) только для сохранения:</p>
<ul>
  <li>выбранного языка</li>
  <li>настроек интерфейса</li>
  <li>ваших настроек cookie‑согласия (essential / analytics / ads)</li>
</ul>

<p>По умолчанию CrestMaker не подключает сторонние SDK для аналитики или рекламы. Если в будущем это изменится, такие компоненты будут подключаться только при явном включении соответствующей категории в настройках cookies.</p>

<p class="muted">Последнее обновление: January 2026</p>
`;

  const ua = `
<p>Ми поважаємо вашу конфіденційність. CrestMaker повністю працює у вашому браузері.</p>

<h3>Які дані ми збираємо</h3>
<ul>
  <li>Зображення не завантажуються на сервер</li>
  <li>Персональні дані не збираються та не зберігаються</li>
  <li>Cookies використовуються лише для збереження налаштувань</li>
</ul>

<h3>Cookies</h3>
<p>Ми використовуємо <b>localStorage</b> (і за потреби cookies) лише для збереження:</p>
<ul>
  <li>вибраної мови</li>
  <li>налаштувань інтерфейсу</li>
  <li>ваших налаштувань cookie‑згоди (essential / analytics / ads)</li>
</ul>

<p>За замовчуванням CrestMaker не підключає сторонні SDK для аналітики чи реклами. Якщо в майбутньому це зміниться, такі компоненти будуть завантажуватися лише після явного увімкнення відповідної категорії в налаштуваннях cookies.</p>

<p class="muted">Last updated: January 2026</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
