import type { Lang } from "../i18n";

function h(en: string, ru: string, ua: string, lang: Lang) {
  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}

export function iconsHtml(lang: Lang) {
  const lead = h(
    "A small starter pack of ready Lineage 2 crest layouts (emblems/icons).",
    "Небольшой стартовый набор готовых макетов эмблем/иконок Lineage 2.",
    "Невеликий стартовий набір готових макетів емблем/іконок Lineage 2.",
    lang
  );

  const note = h(
    "Click any card to download ready BMP files for the game (24×12 preview + 16×12 clan + 8×12 alliance).",
    "Нажмите на любую карточку - вы получите готовые BMP‑файлы для игры (превью 24×12 + клан 16×12 + альянс 8×12).",
    "Натисніть на будь-яку картку - ви отримаєте готові BMP‑файли для гри (прев'ю 24×12 + клан 16×12 + альянс 8×12).",
    lang
  );

  const howToTitle = h(
    "How to use",
    "Как использовать",
    "Як користуватися",
    lang
  );

  const howToLi1 = h(
    "Open the tool.",
    "Открой инструмент.",
    "Відкрий інструмент.",
    lang
  );
  const howToLi2 = h(
    "Choose the size of an emblem you want to create: 24×12 or 16×12.",
    "Выбери размер иконки, которую хочешь сделать: 24×12 или 16×12.",
    "Обери розмір іконки/емблеми: 24×12 або 16×12.",
    lang
  );
  const howToLi3 = h(
    "Upload an image you want to turn into an icon/emblem.",
    "Загрузи картинку, из которой хочешь сделать иконку/эмблему.",
    "Завантаж зображення, з якого хочеш зробити іконку/емблему.",
    lang
  );
  const howToLi4 = h(
    "Select the area of the image.",
    "Выбери область на картинке.",
    "Обери область на зображенні.",
    lang
  );
  const howToLi5 = h(
    "Download ready BMP files you can use in the game.",
    "Скачай готовые BMP‑файлы, которые можно использовать в игре.",
    "Збережи готові BMP‑файли, які можна одразу використовувати в грі.",
    lang
  );

  const galleryLabel = h("Gallery", "Галерея", "Галерея", lang);

  return `
    <div class="icons-gallery" data-icons-gallery="1">
      <p class="muted">${lead}</p>
      <p class="muted">${note}</p>

      <h3>${howToTitle}</h3>
      <ol>
        <li>${howToLi1}</li>
        <li>${howToLi2}</li>
        <li>${howToLi3}</li>
        <li>${howToLi4}</li>
        <li>${howToLi5}</li>
      </ol>

      <div class="crest-grid" aria-label="${galleryLabel}">
        ${Array.from({ length: 9 }, (_, i) => {
          const n = String(i + 1).padStart(2, "0");
          return `
            <a class="crest-card" data-gallery-bmp="1" href="/guide/crest_${n}.bmp" download="crest_${n}.bmp">
              <img class="crest" loading="lazy" decoding="async" src="/guide/crest_${n}.bmp" alt="crest ${n} preview" />
            </a>
          `;
        }).join("")}
      </div>

      <p class="muted" style="margin-top:14px">
        <a href="/${lang}/">${h("Open the tool", "Открыть инструмент", "Відкрити інструмент", lang)}</a>
        <span class="sep"></span>
        <a href="/${lang}/guide">${h("Guide", "Гайд", "Гайд", lang)}</a>
      </p>
    </div>
  `;
}
