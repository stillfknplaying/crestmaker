import type { Lang } from "../i18n";

type Copy = {
  title: string;
  intro1: string;
  intro2: string;

  hQuick: string;
  quickLi1: string;
  quickLi2: string;
  quickLi3: string;
  quickLi4: string;

  hVideos: string;
  videosSummary: string;
  videosNote: string;

  hSizes: string;
  sizesText: string;
  sizesLiClan: string;
  sizesLiAlliance: string;
  sizesLiLayout: string;
  sizesNote: string;

  hUpload: string;
  uploadText: string;
  spoilerUpload: string;

  hCrop: string;
  cropText: string;
  spoilerCrop: string;

  hModes: string;
  modesText: string;
  modesNote: string;
  modernTitle: string;
  modernText: string;
  pixelTitle: string;
  pixelText: string;

  hPresets: string;
  presetsText: string;
  spoilerPresets: string;

  hTune: string;
  tuneText: string;

  hDownload: string;
  downloadText: string;
  downloadLiClan: string;
  downloadLiLayout: string;

  hServerRules: string;
  serverRulesText: string;

  hExamples: string;
  examplesText: string;
  spoilerExamples: string;
};

const COPY: Record<Lang, Copy> = {
  en: {
    title: "Lineage 2 crest / emblem / icon guide (clan 16×12, alliance 8×12)",
    intro1:
      "CrestMaker is a small web tool for creating Lineage 2 crests/emblems/icons (BMP 256 colors). It works directly in your browser - no install, no registration.",
    intro2:
      "Workflow: add an image → choose a crop → pick a mode/preset → fine‑tune → download BMPs.",

    hQuick: "Quick steps",
    quickLi1: "Add an image",
    quickLi2: "Crop",
    quickLi3: "Mode + presets",
    quickLi4: "Download BMPs",

    hVideos: "Video example (YouTube Shorts)",
    videosSummary: "Open video (9:16)",
    videosNote: "Optional. Open only if you want a quick preview.",

    hSizes: "Sizes & BMP 256 requirements",
    sizesText:
      "Lineage 2 typically uses 8‑bit BMP (256 colors). In-game upload is separate for clan and alliance.",
    sizesLiClan: "Clan crest: 16×12 BMP (8‑bit / 256 colors) - upload in-game",
    sizesLiAlliance: "Alliance emblem: 8×12 BMP (8‑bit / 256 colors) - upload in-game",
    sizesLiLayout:
      "24×12 layout (clan+alliance): design both parts together and download 3 BMPs (24×12 preview + 16×12 + 8×12)",
    sizesNote:
      "Important: you cannot upload a single 24×12 file in Lineage 2. You upload 16×12 (clan) and 8×12 (alliance) separately.",

    hUpload: "1) Add an image",
    uploadText:
      "You can add an image by uploading a file, pasting from clipboard (Ctrl+V), loading by URL, or drag & drop.",
    spoilerUpload: "Spoiler: Drag & drop from another browser tab (fastest)",

    hCrop: "2) Crop",
    cropText:
      "Icons are tiny (16×12 / 8×12), so crop is everything. A small crop shift can change the result completely. Move the crop, adjust scale, and always check both True Size and Zoom.",
    spoilerCrop: "Spoiler: Good crop vs bad crop",

    hModes: "3) Mode",
    modesText: "Choose a mode depending on your source image:",
    modesNote:
      "Use 16×12 mode if you need only a clan crest. Use 24×12 layout if you want to prepare both clan + alliance in one go (download will include separate files).",
    modernTitle: "Modern",
    modernText: "Best for logos, renders, photos, gradients. Smoother transitions.",
    pixelTitle: "Pixel",
    pixelText: "Best for pixel-art and simple shapes. Sharper edges.",

    hPresets: "4) Presets",
    presetsText:
      "Presets are not a magic button. The same image can look better with a different preset, a different crop, or small Brightness/Contrast adjustments. Always compare in True Size and Zoom.",
    spoilerPresets: "Spoiler: Preset comparison",

    hTune: "5) Fine tuning",
    tuneText:
      "Use Brightness/Contrast and extra toggles (like sharpening) to improve readability. Small changes usually work better than extreme values.",

    hDownload: "6) Download",
    downloadText:
      "When the result looks good, click Download BMPs. CrestMaker exports upload‑ready files.",
    downloadLiClan: "16×12 mode: 1 BMP (clan 16×12)",
    downloadLiLayout: "24×12 layout mode: 3 BMPs (24×12 preview + clan 16×12 + alliance 8×12)",

    hServerRules: "If your server has custom rules",
    serverRulesText:
      "Most servers accept BMP 8‑bit (256 colors). If your server has extra limits (file size, palette rules, etc.), start from the correct size, keep colors under 256, and verify in True Size.",

    hExamples: "Examples",
    examplesText: "Below are a few ready 24×12 layout BMPs. Re‑export in the tool if you need separate 16×12 / 8×12 uploads.",
    spoilerExamples: "Spoiler: Examples",
  },

  ru: {
    title: "Гайд по эмблемам/иконкам Lineage 2 (клан 16×12, альянс 8×12)",
    intro1:
      "CrestMaker - веб‑инструмент для создания эмблем/значков/иконок Lineage 2 (BMP 256 цветов). Работает прямо в браузере - без установки и регистрации.",
    intro2:
      "Схема простая: добавить картинку → выбрать кроп → подобрать режим/пресет → докрутить → скачать BMP.",

    hQuick: "Быстрые шаги",
    quickLi1: "Добавить картинку",
    quickLi2: "Выбор области",
    quickLi3: "Режим + пресеты",
    quickLi4: "Скачать BMP",

    hVideos: "Видео пример (YouTube Shorts)",
    videosSummary: "Открыть видео (9:16)",
    videosNote: "Опционально. Открывай только если нужен быстрый пример.",

    hSizes: "Размеры и требования BMP 256",
    sizesText:
      "Чаще всего нужен BMP 8‑bit (256 цветов). В игре загрузка клана и альянса делается отдельно.",
    sizesLiClan: "Клановая эмблема: 16×12 BMP (8‑bit / 256 цветов) - загрузка в игре",
    sizesLiAlliance: "Альянс: 8×12 BMP (8‑bit / 256 цветов) - загрузка в игре",
    sizesLiLayout:
      "Разметка 24×12 (клан+альянс): делайте оба блока вместе и скачивайте 3 BMP (превью 24×12 + 16×12 + 8×12)",
    sizesNote:
      "Важно: загрузить один файл 24×12 в Lineage 2 нельзя. В игру загружается отдельно 16×12 (клан) и 8×12 (альянс).",

    hUpload: "1) Добавить картинку",
    uploadText:
      "Картинку можно загрузить файлом, вставить из буфера (Ctrl+V), добавить по ссылке или просто перетащить мышкой.",
    spoilerUpload: "Спойлер: Перетащить картинку из вкладки браузера (самый быстрый способ)",

    hCrop: "2) Выбор области",
    cropText:
      "Иконки крошечные (16×12 / 8×12), поэтому кроп решает всё. Сдвинули кроп на пару пикселей - результат уже другой. Двигайте кроп, меняйте масштаб и всегда проверяйте True Size и Zoom.",
    spoilerCrop: "Спойлер: Хороший кроп vs плохой кроп",

    hModes: "3) Режим",
    modesText: "Выберите режим под исходную картинку:",
    modesNote:
      "Если нужна только клановая эмблема - выбирайте 16×12. Если нужно подготовить и клан, и альянс одним разом - используйте разметку 24×12 (при скачивании будут отдельные файлы).",
    modernTitle: "Modern",
    modernText: "Лучше для логотипов, рендеров, фото, градиентов. Плавнее переходы.",
    pixelTitle: "Pixel",
    pixelText: "Лучше для пиксель‑арта и простых форм. Чётче края.",

    hPresets: "4) Пресеты",
    presetsText:
      "Пресеты - не “волшебная кнопка”. Одна и та же картинка может выглядеть лучше в другом пресете, с другим кропом, яркостью/контрастом или доп. опциями. Сравнивайте результат в True Size и Zoom.",
    spoilerPresets: "Спойлер: Сравнение пресетов",

    hTune: "5) Доработка результата",
    tuneText:
      "Подкрутите Brightness/Contrast и дополнительные переключатели (например sharpen), чтобы повысить читаемость. Обычно лучше работают небольшие изменения.",

    hDownload: "6) Скачать",
    downloadText:
      "Когда результат устраивает - нажмите Скачать BMP. CrestMaker выгружает файлы, готовые для Lineage 2.",
    downloadLiClan: "Режим 16×12: 1 BMP (клан 16×12)",
    downloadLiLayout: "Разметка 24×12: 3 BMP (превью 24×12 + клан 16×12 + альянс 8×12)",

    hServerRules: "Если на сервере “особые” правила",
    serverRulesText:
      "В большинстве случаев подходит BMP 8‑bit (256 цветов). Если есть дополнительные ограничения (вес файла, правила палитры и т.д.) - начните с правильного размера, держите палитру ≤256 и проверяйте читаемость в True Size.",

    hExamples: "Примеры",
    examplesText: "Ниже - несколько готовых BMP‑макетов 24×12. Если нужны отдельные 16×12 / 8×12 - переэкспортируйте через инструмент.",
    spoilerExamples: "Спойлер: Примеры",
  },

  ua: {
    title: "Гайд по емблемах/іконках Lineage 2 (клан 16×12, альянс 8×12)",
    intro1:
      "CrestMaker - веб‑інструмент для створення емблем/значків/іконок Lineage 2 (BMP 256 кольорів). Працює прямо в браузері - без встановлення та реєстрації.",
    intro2:
      "Схема проста: додати зображення → вибрати кроп → підібрати режим/пресет → підкрутити → завантажити BMP.",

    hQuick: "Швидкі кроки",
    quickLi1: "Додати зображення",
    quickLi2: "Вибір області",
    quickLi3: "Режим + пресети",
    quickLi4: "Зберегти BMP",

    hVideos: "Відео приклад (YouTube Shorts)",
    videosSummary: "Відкрити відео (9:16)",
    videosNote: "Опційно. Відкривай тільки якщо потрібен швидкий приклад.",

    hSizes: "Розміри та вимоги BMP 256",
    sizesText:
      "Найчастіше потрібен BMP 8‑bit (256 кольорів). У грі завантаження для клану та альянсу робиться окремо.",
    sizesLiClan: "Кланова емблема: 16×12 BMP (8‑bit / 256 кольорів) - завантаження в грі",
    sizesLiAlliance: "Альянс: 8×12 BMP (8‑bit / 256 кольорів) - завантаження в грі",
    sizesLiLayout:
      "Розмітка 24×12 (клан+альянс): робіть обидва блоки разом і завантажуйте 3 BMP (превʼю 24×12 + 16×12 + 8×12)",
    sizesNote:
      "Важливо: завантажити один файл 24×12 у Lineage 2 не можна. У гру завантажується окремо 16×12 (клан) та 8×12 (альянс).",

    hUpload: "1) Додати зображення",
    uploadText:
      "Зображення можна завантажити файлом, вставити з буфера (Ctrl+V), додати за URL або перетягнути мишкою.",
    spoilerUpload: "Спойлер: Перетягнути зображення з вкладки браузера (найшвидше)",

    hCrop: "2) Вибір області",
    cropText:
      "Іконки крихітні (16×12 / 8×12), тому кроп вирішує все. Зсунули кроп на кілька пікселів - результат вже інший. Рухайте кроп, міняйте масштаб і завжди перевіряйте True Size та Zoom.",
    spoilerCrop: "Спойлер: Хороший кроп vs поганий кроп",

    hModes: "3) Режим",
    modesText: "Оберіть режим під ваше зображення:",
    modesNote:
      "Якщо потрібна тільки кланова емблема - обирайте 16×12. Якщо потрібно підготувати і клан, і альянс за один раз - використовуйте розмітку 24×12 (при завантаженні будуть окремі файли).",
    modernTitle: "Modern",
    modernText: "Краще для логотипів, рендерів, фото, градієнтів. Плавні переходи.",
    pixelTitle: "Pixel",
    pixelText: "Краще для піксель‑арту та простих форм. Чіткі краї.",

    hPresets: "4) Пресети",
    presetsText:
      "Пресети - не “магічна кнопка”. Те саме зображення може виглядати краще з іншим пресетом, кропом, яскравістю/контрастом або додатковими опціями. Порівнюйте результат у True Size та Zoom.",
    spoilerPresets: "Спойлер: Порівняння пресетів",

    hTune: "5) Доопрацювання результату",
    tuneText:
      "Підкрутіть Brightness/Contrast та додаткові перемикачі (наприклад sharpen), щоб підвищити читабельність. Зазвичай краще працюють невеликі зміни.",

    hDownload: "6) Завантаження",
    downloadText:
      "Коли результат подобається - натисніть Зберегти BMP. CrestMaker вивантажує файли, готові для Lineage 2.",
    downloadLiClan: "Режим 16×12: 1 BMP (клан 16×12)",
    downloadLiLayout: "Розмітка 24×12: 3 BMP (превʼю 24×12 + клан 16×12 + альянс 8×12)",

    hServerRules: "Якщо на сервері “особливі” правила",
    serverRulesText:
      "У більшості випадків підходить BMP 8‑bit (256 кольорів). Якщо є додаткові обмеження (вага файлу, правила палітри тощо) - почніть з правильного розміру, тримайте палітру ≤256 та перевіряйте читабельність у True Size.",

    hExamples: "Приклади",
    examplesText: "Нижче - кілька готових BMP‑макетів 24×12. Якщо потрібні окремі 16×12 / 8×12 - переекспортуйте через інструмент.",
    spoilerExamples: "Спойлер: Приклади",
  },
};

function mdEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function guideHtml(lang: Lang): string {
  const c = COPY[lang];

  const promoLink = lang === "ru"
    ? "https://www.youtube.com/shorts/e3seSKhW_q0"
    : "https://www.youtube.com/shorts/3VRItYzhfuI";
  const promoId = promoLink.split("/shorts/")[1]?.split("?")[0] || "";
  const promoEmbed = promoId
    ? `https://www.youtube.com/embed/${promoId}?playsinline=1&rel=0&modestbranding=1`
    : "";

  return `
    <h1>${mdEscape(c.title)}</h1>
    <p>${mdEscape(c.intro1)}</p>
    <p>${mdEscape(c.intro2)}</p>

    <h2 id="g-quick">${mdEscape(c.hQuick)}</h2>
    <ol>
      <li><a href="#g-upload">${mdEscape(c.quickLi1)}</a></li>
      <li><a href="#g-crop">${mdEscape(c.quickLi2)}</a></li>
      <li><a href="#g-mode">${mdEscape(c.quickLi3)}</a></li>
      <li><a href="#g-download">${mdEscape(c.quickLi4)}</a></li>
    </ol>

    <h2 id="g-sizes">${mdEscape(c.hSizes)}</h2>
    <p>${mdEscape(c.sizesText)}</p>
    <ul>
      <li>${mdEscape(c.sizesLiClan)}</li>
      <li>${mdEscape(c.sizesLiAlliance)}</li>
      <li>${mdEscape(c.sizesLiLayout)}</li>
    </ul>
    <p class="muted">${mdEscape(c.sizesNote)}</p>

    <h2 id="g-upload">${mdEscape(c.hUpload)}</h2>
    <p>${mdEscape(c.uploadText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerUpload)}</summary>
      <div class="spoiler-body">
        <div class="guide-video">
          <video class="guide-media" controls muted playsinline preload="none" data-src="/guide/media_01.webm"></video>
        </div>
      </div>
    </details>

    <h2 id="g-crop">${mdEscape(c.hCrop)}</h2>
    <p>${mdEscape(c.cropText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerCrop)}</summary>
      <div class="spoiler-body">
        <img class="guide-media" loading="lazy" decoding="async" data-src="/guide/media_02.webp" alt="Crop comparison" />
      </div>
    </details>

    <h2 id="g-mode">${mdEscape(c.hModes)}</h2>
    <p>${mdEscape(c.modesText)}</p>
    <ul>
      <li><b>${mdEscape(c.modernTitle)}:</b> ${mdEscape(c.modernText)}</li>
      <li><b>${mdEscape(c.pixelTitle)}:</b> ${mdEscape(c.pixelText)}</li>
    </ul>
    <p class="muted">${mdEscape(c.modesNote)}</p>

    <h2 id="g-presets">${mdEscape(c.hPresets)}</h2>
    <p>${mdEscape(c.presetsText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerPresets)}</summary>
      <div class="spoiler-body">
        <img class="guide-media" loading="lazy" decoding="async" data-src="/guide/media_03.webp" alt="Preset comparison" />
      </div>
    </details>

    <h2 id="g-tune">${mdEscape(c.hTune)}</h2>
    <p>${mdEscape(c.tuneText)}</p>

    <h2 id="g-download">${mdEscape(c.hDownload)}</h2>
    <p>${mdEscape(c.downloadText)}</p>
    <ul>
      <li>${mdEscape(c.downloadLiClan)}</li>
      <li>${mdEscape(c.downloadLiLayout)}</li>
    </ul>

    <h2 id="g-server">${mdEscape(c.hServerRules)}</h2>
    <p>${mdEscape(c.serverRulesText)}</p>

    <h2 id="g-examples">${mdEscape(c.hExamples)}</h2>
    <p>${mdEscape(c.examplesText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerExamples)}</summary>
      <div class="spoiler-body">
        <div class="crest-grid">
          ${Array.from({ length: 9 }, (_, i) => {
            const n = String(i + 1).padStart(2, "0");
            return `<a class="crest-card" href="/guide/crest_${n}.bmp" download="crest_${n}.bmp" title="Download crest_${n}.bmp">
              <img class="crest" loading="lazy" decoding="async" src="/guide/crest_${n}.bmp" alt="crest ${n} preview" />
              <span class="crest-name">crest_${n}.bmp</span>
            </a>`;
          }).join("\n")}
        </div>
      </div>
    </details>

    <h2 id="g-video">${mdEscape(c.hVideos)}</h2>
    <p class="muted">${mdEscape(c.videosNote)}</p>
    <details class="spoiler">
      <summary>${mdEscape(c.videosSummary)}</summary>
      <div class="spoiler-body">
        <div class="yt-9x16">
          <iframe
            class="yt-iframe"
            title="YouTube video"
            loading="lazy"
            data-src="${mdEscape(promoEmbed)}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </details>
  `;
}
