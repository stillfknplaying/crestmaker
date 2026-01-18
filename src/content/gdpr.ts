type Lang = "en" | "ru" | "ua";

export function gdprHtml(lang: Lang): string {
  const en = `<p>This tool does not collect or process personal data.</p>
<p>All image processing is performed locally in your browser.</p>
<p>If you use “Load by URL”, your browser will contact the target website directly to fetch the image. CrestMaker does not proxy or store these requests.</p>
`;

  const ru = `<p>Этот инструмент не собирает и не обрабатывает персональные данные.</p>
<p>Вся обработка изображений выполняется локально в браузере.</p>
<p>Если вы используете “Load by URL”, ваш браузер обращается к указанному сайту напрямую, чтобы загрузить изображение. CrestMaker не проксирует и не хранит эти запросы.</p>
`;

  const ua = `<p>Цей інструмент не збирає та не обробляє персональні дані.</p>
<p>Уся обробка зображень виконується локально у браузері.</p>
<p>Якщо ви використовуєте “Load by URL”, ваш браузер звертається до вказаного сайту напряму, щоб завантажити зображення. CrestMaker не проксує і не зберігає ці запити.</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
