import type { Lang } from "../i18n";

function prefix(lang: Lang) {
  return `/${lang}`;
}

function videoEmbedDetails(opts: { lang: Lang; title: string; youtubeId: string }) {
  const watch = `https://www.youtube.com/embed/${opts.youtubeId}`;
  return `
    <details class="spoiler">
      <summary>${opts.title}</summary>
      <div class="media short">
        <iframe
          width="560"
          height="315"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          data-src="${watch}"
          title="${opts.title}"
        ></iframe>
      </div>
    </details>
  `;
}

export function seoLineage2CrestMakerHtml(lang: Lang): string {
  const p = prefix(lang);

  const title =
    lang === "ru" ? "Lineage 2 Crest Maker онлайн" :
    lang === "ua" ? "Lineage 2 Crest Maker онлайн" :
    "Lineage 2 Crest Maker online";

  const intro =
    lang === "ru"
      ? `Онлайн <b>crest maker</b> для Lineage 2: сделай клановый значок <b>16×12 BMP (256 цветов)</b> и эмблему альянса <b>8×12</b> прямо в браузере. Разметка <b>24×12</b> - это удобный режим: скачиваешь отдельные <b>16×12</b> и <b>8×12</b> одним кликом.`
      : lang === "ua"
      ? `Онлайн <b>crest maker</b> для Lineage 2: створи клановий значок <b>16×12 BMP (256 кольорів)</b> і емблему альянсу <b>8×12</b> прямо в браузері. Розмітка <b>24×12</b> - це зручний режим: завантажуєш окремі <b>16×12</b> та <b>8×12</b> одним кліком.`
      : `A <b>Lineage 2 crest maker</b> to create <b>16×12 BMP (256 colors)</b> clan crests and <b>8×12</b> alliance emblems directly in the browser. The <b>24×12</b> layout mode is just a convenience - it downloads separate <b>16×12</b> and <b>8×12</b> files for in-game upload.`;

  const steps =
    lang === "ru"
      ? `
        <ol>
          <li>Загрузи картинку (PNG/JPG/GIF).</li>
          <li>Обрежь и уменьши до <b>16×12</b> (клан) или <b>8×12</b> (альянс).</li>
          <li>Если “мылит” - покрути настройки (контраст, резкость), пока не станет чётко.</li>
          <li>Скачай <b>BMP 256 цветов</b>.</li>
          <li>В игре: окно клана (часто <b>Alt+N</b>) → «Эмблема» → выбери BMP.</li>
        </ol>
      `
      : lang === "ua"
      ? `
        <ol>
          <li>Завантаж зображення (PNG/JPG/GIF).</li>
          <li>Обріж і зменш до <b>16×12</b> (клан) або <b>8×12</b> (альянс).</li>
          <li>Якщо “мило” - покрути налаштування (контраст, різкість), поки не стане чітко.</li>
          <li>Завантаж <b>BMP 256 кольорів</b>.</li>
          <li>У грі: вікно клану (часто <b>Alt+N</b>) → «Емблема» → вибери BMP.</li>
        </ol>
      `
      : `
        <ol>
          <li>Upload an image (PNG/JPG/GIF).</li>
          <li>Crop and resize to <b>16×12</b> (clan) or <b>8×12</b> (alliance).</li>
          <li>If it looks muddy, tweak settings (contrast/sharpen) until it’s readable.</li>
          <li>Download <b>8‑bit BMP (256 colors)</b>.</li>
          <li>In game: clan window (often <b>Alt+N</b>) → “Emblem” → select BMP.</li>
        </ol>
      `;

  const links = `
    <p class="muted navlinks">
      <a href="${p}/guide">${lang === "ru" ? "Гайд" : lang === "ua" ? "Гайд" : "Guide"}</a>
      · <a href="${p}/icons">${lang === "ru" ? "Готовые эмблемы" : lang === "ua" ? "Готові емблеми" : "Ready crests"}</a>
    </p>
  `;

  return `
    <h3>${title}</h3>
    <p>${intro}</p>
    ${links}
    <h4>${lang === "ru" ? "Пошагово" : lang === "ua" ? "Кроки" : "Steps"}</h4>
    ${steps}
    <p><a class="btn btnlink" href="${p}/">${lang === "ru" ? "Открыть инструмент" : lang === "ua" ? "Відкрити інструмент" : "Open the tool"}</a></p>
  `;
}

export function seoCreateClanCrestHtml(lang: Lang): string {
  const p = prefix(lang);
  return lang === "ru"
    ? `
      <h3>Как создать клановый значок Lineage 2 (16×12 BMP 256)</h3>
      <p>Lineage 2 обычно требует <b>8‑bit BMP (256 цветов)</b> для кланового значка <b>16×12</b>.</p>
      <ol>
        <li>Выбери простой дизайн (толстые линии, высокий контраст).</li>
        <li>Загрузи изображение в инструмент и выставь размер <b>16×12</b>.</li>
        <li>Если “мылит” - покрути настройки (контраст, резкость), пока не станет чётко.</li>
        <li>Скачай BMP и используй новую эмблему в игре.</li>
      </ol>
      <p class="muted">Также: <a href="${p}/l2-crest-16x12-bmp-requirements">требования к 16×12 BMP</a>.</p>
      <p><a class="btn btnlink" href="${p}/">Открыть инструмент</a></p>
    `
    : lang === "ua"
    ? `
      <h3>Як створити клановий значок Lineage 2 (16×12 BMP 256)</h3>
      <p>Lineage 2 зазвичай потребує <b>8‑bit BMP (256 кольорів)</b> для кланового значка <b>16×12</b>.</p>
      <ol>
        <li>Обери простий дизайн (товсті лінії, високий контраст).</li>
        <li>Завантаж зображення в інструмент і вистав розмір <b>16×12</b>.</li>
        <li>Якщо “мило” - підніми контраст/різкість, поки не стане чітко.</li>
        <li>Завантаж BMP і додай в грі.</li>
      </ol>
      <p class="muted">Також: <a href="${p}/l2-crest-16x12-bmp-requirements">вимоги до 16×12 BMP</a>.</p>
      <p><a class="btn btnlink" href="${p}/">Відкрити інструмент</a></p>
    `
    : `
      <h3>How to create a Lineage 2 clan crest (16×12 BMP 256 colors)</h3>
      <p>Lineage 2 usually requires an <b>8‑bit BMP (256-color palette)</b> for a <b>16×12</b> clan crest.</p>
      <ol>
        <li>Use a simple, high-contrast design (thick shapes, few details).</li>
        <li>Upload your image and set size to <b>16×12</b>.</li>
        <li>If it looks blurry: tweak the settings (contrast/sharpen) until it looks clear.</li>
        <li>Download the BMP and use the new crest in-game.</li>
      </ol>
      <p class="muted">Also see: <a href="${p}/l2-crest-16x12-bmp-requirements">16×12 BMP requirements</a>.</p>
      <p><a class="btn btnlink" href="${p}/">Open the tool</a></p>
    `;
}

export function seoRequirements16x12Html(lang: Lang): string {
  const p = prefix(lang);
  return lang === "ru"
    ? `
      <h3>Требования к значку Lineage 2: 16×12 BMP (256 цветов)</h3>
      <ul>
        <li><b>Размер:</b> 16×12 пикселей.</li>
        <li><b>Формат:</b> BMP 8‑bit (256 colors / indexed palette).</li>
        <li><b>Совет:</b> минимум мелких деталей, высокий контраст.</li>
      </ul>
      <h4>Частые ошибки</h4>
      <ul>
        <li>Файл BMP не индексированный (24‑bit) → переделай в 8‑bit.</li>
        <li>Неверный размер → выставь 16×12 перед экспортом.</li>
        <li>Цвета “плывут” → попробуй поднять контраст/резкость.</li>
      </ul>
      <p class="muted">Про эмблему альянса: <a href="${p}/l2-alliance-crest-24x12-bmp">24×12 BMP</a>.</p>
      <p><a class="btn btnlink" href="${p}/">Открыть инструмент</a></p>
    `
    : lang === "ua"
    ? `
      <h3>Вимоги до значка Lineage 2: 16×12 BMP (256 кольорів)</h3>
      <ul>
        <li><b>Розмір:</b> 16×12 пікселів.</li>
        <li><b>Формат:</b> BMP 8‑bit (256 colors / indexed palette).</li>
        <li><b>Порада:</b> мінімум дрібних деталей, високий контраст.</li>
      </ul>
      <h4>Часті помилки</h4>
      <ul>
        <li>BMP не індексований (24‑bit) → перероби в 8‑bit.</li>
        <li>Невірний розмір → вистав 16×12 перед експортом.</li>
        <li>Кольори “пливуть” → підніми контраст/різкість.</li>
      </ul>
      <p class="muted">Про емблему альянсу: <a href="${p}/l2-alliance-crest-24x12-bmp">24×12 BMP</a>.</p>
      <p><a class="btn btnlink" href="${p}/">Відкрити інструмент</a></p>
    `
    : `
      <h3>Lineage 2 crest requirements: 16×12 BMP (256 colors)</h3>
      <ul>
        <li><b>Size:</b> 16×12 pixels.</li>
        <li><b>Format:</b> 8‑bit BMP (256-color indexed palette).</li>
        <li><b>Tip:</b> fewer details, higher contrast.</li>
      </ul>
      <h4>Common issues</h4>
      <ul>
        <li>BMP is not indexed (24‑bit) → export as 8‑bit.</li>
        <li>Wrong size → set 16×12 before export.</li>
        <li>Colors look off → adjust contrast/sharpen.</li>
      </ul>
      <p class="muted">Alliance crest: <a href="${p}/l2-alliance-crest-24x12-bmp">24×12 BMP</a>.</p>
      <p><a class="btn btnlink" href="${p}/">Open the tool</a></p>
    `;
}

export function seoAlliance24x12Html(lang: Lang): string {
  const p = prefix(lang);
  return lang === "ru"
    ? `
      <h3>Эмблема альянса Lineage 2: 24×12 BMP</h3>
      <p>На многих серверах эмблема альянса - это <b>24×12</b>, состоящая из <b>8×12</b> (ally) и <b>16×12</b> (clan).</p>
      <ul>
        <li><b>Размер:</b> 24×12</li>
        <li><b>Формат:</b> BMP 8‑bit (256 цветов)</li>
      </ul>
      <p class="muted">Если сервер требует отдельную эмблему альянса <b>8×12</b> - выбери размер <b>8×12</b> в инструменте и экспортируй BMP.</p>
      <p><a class="btn btnlink" href="${p}/">Открыть инструмент</a></p>
    `
    : lang === "ua"
    ? `
      <h3>Емблема альянсу Lineage 2: 24×12 BMP</h3>
      <p>На багатьох серверах емблема альянсу - це <b>24×12</b>, що складається з <b>8×12</b> (ally) та <b>16×12</b> (clan).</p>
      <ul>
        <li><b>Розмір:</b> 24×12</li>
        <li><b>Формат:</b> BMP 8‑bit (256 кольорів)</li>
      </ul>
      <p class="muted">Якщо сервер вимагає окрему емблему альянсу <b>8×12</b> - вибери розмір <b>8×12</b> в інструменті та експортуй BMP.</p>
      <p><a class="btn btnlink" href="${p}/">Відкрити інструмент</a></p>
    `
    : `
      <h3>Lineage 2 alliance crest: 24×12 BMP</h3>
      <p>On many servers the alliance crest uses <b>24×12</b>, combining <b>8×12</b> (ally) + <b>16×12</b> (clan).</p>
      <ul>
        <li><b>Size:</b> 24×12</li>
        <li><b>Format:</b> 8‑bit BMP (256 colors)</li>
      </ul>
      <p class="muted">If your server requires a separate <b>8×12</b> alliance crest, switch to <b>8×12</b> size in the tool and export BMP.</p>
      <p><a class="btn btnlink" href="${p}/">Open the tool</a></p>
    `;
}

export function seoPromoShortsBlock(lang: Lang): string {
  // Optional embed block (lazy via details)
  if (lang === "ru") {
    return `
      <h4>Короткое видео</h4>
      ${videoEmbedDetails({ lang, title: "Промо (RU) - CrestMaker", youtubeId: "e3seSKhW_q0" })}
    `;
  }
  return `
    <h4>Short video</h4>
    ${videoEmbedDetails({ lang, title: "Promo (EN) - CrestMaker", youtubeId: "3VRItYzhfuI" })}
  `;
}
