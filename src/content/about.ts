type Lang = "en" | "ru" | "ua";

export function aboutHtml(lang: Lang): string {
  const en = `
<p><b>CrestMaker</b> is a client‑side tool that converts images into 8‑bit (256‑color) BMP crests for Lineage II.</p>
<p>All processing happens locally in your browser — your images are not uploaded anywhere.</p>

<h3>Supported outputs</h3>
<ul>
  <li>24×12: full emblem (ally 8×12 + clan 16×12)</li>
  <li>16×12: clan emblem only</li>
</ul>

<p class="muted">Last updated: January 2026</p>
`;

  const ru = `
<p><b>CrestMaker</b> — клиентский инструмент для конвертации изображений в 8‑битные (256 цветов) BMP‑крэсты для Lineage II.</p>
<p>Вся обработка выполняется локально в вашем браузере — изображения никуда не загружаются.</p>

<h3>Поддерживаемые размеры</h3>
<ul>
  <li>24×12: полный значок (ally 8×12 + clan 16×12)</li>
  <li>16×12: только клановый значок</li>
</ul>

<p class="muted">Последнее обновление: January 2026</p>
`;

  const ua = `
<p><b>CrestMaker</b> — клієнтський інструмент для конвертації зображень у 8‑бітні (256 кольорів) BMP‑кре́сти для Lineage II.</p>
<p>Уся обробка виконується локально у вашому браузері — зображення нікуди не завантажуються.</p>

<h3>Підтримувані розміри</h3>
<ul>
  <li>24×12: повний значок (ally 8×12 + clan 16×12)</li>
  <li>16×12: лише клановий значок</li>
</ul>

<p class="muted">Last updated: January 2026</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
