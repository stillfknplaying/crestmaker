type Lang = "en" | "ru" | "ua";

export function gdprHtml(lang: Lang): string {
  const en = `
<p>CrestMaker does not collect or process personal data.</p>
<p>All image processing is performed locally in your browser.</p>

<h3>Data controller</h3>
<p>Because CrestMaker does not collect personal data, there is no ongoing server-side processing of user data.</p>

<h3>Your rights</h3>
<p>If you have questions related to privacy or data protection, please contact the site owner via the contact method provided on the website (if any).</p>

<p class="muted">Last updated: January 2026</p>
`;

  const ru = `
<p>CrestMaker не собирает и не обрабатывает персональные данные.</p>
<p>Вся обработка изображений выполняется локально в браузере.</p>

<h3>Оператор данных</h3>
<p>Так как CrestMaker не собирает персональные данные, серверная обработка пользовательских данных не выполняется.</p>

<h3>Ваши права</h3>
<p>Если у вас есть вопросы по конфиденциальности или защите данных, используйте контактный способ, указанный на сайте (если он добавлен).</p>

<p class="muted">Последнее обновление: January 2026</p>
`;

  const ua = `
<p>CrestMaker не збирає та не обробляє персональні дані.</p>
<p>Уся обробка зображень виконується локально у браузері.</p>

<h3>Оператор даних</h3>
<p>Оскільки CrestMaker не збирає персональні дані, серверна обробка даних користувачів не виконується.</p>

<h3>Ваші права</h3>
<p>Якщо у вас є питання щодо конфіденційності чи захисту даних, скористайтеся контактним способом, вказаним на сайті (якщо він доданий).</p>

<p class="muted">Last updated: January 2026</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
