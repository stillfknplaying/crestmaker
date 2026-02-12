import type { Lang } from "../i18n";

function h(en: string, ru: string, ua: string, lang: Lang) {
  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}

export function iconsHtml(lang: Lang) {
  // The document page wrapper already renders the main H1.
  // Keep this page's inner title as H2 to avoid duplicate headings.
  const title = h(
    "Ready crests (download)",
    "Готовые эмблемы (скачать)",
    "Готові емблеми (завантажити)",
    lang
  );

  const lead = h(
    "A small starter pack of ready-to-use Lineage 2 clan/alliance crests. Click any card to download the BMP.",
    "Небольшой стартовый набор готовых эмблем Lineage 2. Нажми по карточке, чтобы скачать BMP.",
    "Невеликий стартовий набір готових емблем Lineage 2. Натисни по картці, щоб завантажити BMP.",
    lang
  );

  const note = h(
    "These are 8-bit BMP (256 colors). If your server needs a different size, open the tool and convert.",
    "Это BMP 8-bit (256 цветов). Если сервер требует другой размер - открой инструмент и конвертируй.",
    "Це BMP 8-bit (256 кольорів). Якщо сервер вимагає інший розмір - відкрий інструмент і конвертуй.",
    lang
  );

  return `
    <article class="md">
      <h2>${title}</h2>
      <p class="muted">${lead}</p>
      <p class="muted">${note}</p>

      <div class="crest-grid">
        ${Array.from({ length: 9 }, (_, i) => {
          const n = String(i + 1).padStart(2, "0");
          return `
            <a class="crest-card" href="/guide/crest_${n}.bmp" download="crest_${n}.bmp" title="Download crest_${n}.bmp">
              <img class="crest" loading="lazy" decoding="async" src="/guide/crest_${n}.bmp" alt="crest ${n} preview" />
              <span class="crest-name">crest_${n}.bmp</span>
            </a>
          `;
        }).join("")}
      </div>

      <p class="muted" style="margin-top:14px">
        <a href="/${lang}/">${h("Open the tool", "Открыть инструмент", "Відкрити інструмент", lang)}</a>
      </p>
    </article>
  `;
}
