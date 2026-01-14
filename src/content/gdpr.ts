type Lang = "en" | "ru" | "ua";

export function gdprHtml(lang: Lang): string {
  const en = `
<h2>GDPR</h2>
<p>This tool does not collect or process personal data.</p>
<p>All image processing is performed locally in your browser.</p>
`;

  const ru = `
<h2>GDPR</h2>
<p>Этот инструмент не собирает и не обрабатывает персональные данные.</p>
<p>Вся обработка изображений выполняется локально в браузере.</p>
`;

  const ua = `
<h2>GDPR</h2>
<p>Цей інструмент не збирає та не обробляє персональні дані.</p>
<p>Уся обробка зображень виконується локально у браузері.</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
