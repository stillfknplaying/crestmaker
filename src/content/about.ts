type Lang = "en" | "ru" | "ua";

export function aboutHtml(lang: Lang): string {
  const en = `<p>CrestMaker is a client-side tool for converting images into BMP 256-color clan crests for Lineage II.</p>
<p>All processing is done locally in your browser.</p>
`;

  const ru = `<p>CrestMaker — это клиентский инструмент для конвертации изображений в BMP 256 цветов для клановых значков Lineage II.</p>
<p>Вся обработка выполняется локально в браузере.</p>
`;

  const ua = `<p>CrestMaker — це клієнтський інструмент для конвертації зображень у BMP 256 кольорів для кланових значків Lineage II.</p>
<p>Уся обробка виконується локально у браузері.</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
