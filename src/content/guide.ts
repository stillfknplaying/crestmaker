import type { Lang } from "../i18n";

type Copy = {
  title: string;
  intro1: string;
  intro2: string;
  hUpload: string;
  uploadText: string;
  spoilerUpload: string;
  hCrop: string;
  cropText: string;
  spoilerCrop: string;
  hModes: string;
  modesText: string;
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
  hExamples: string;
  examplesText: string;
  spoilerExamples: string;
};

const COPY: Record<Lang, Copy> = {
  en: {
    title: "How to Use CrestMaker",
    intro1:
      "CrestMaker is a small web tool for creating Lineage 2 clan & alliance icons (BMP 256 colors). It works directly in your browser — no install, no registration.",
    intro2:
      "Workflow: add an image → choose a crop → pick a mode/preset → fine‑tune → download BMPs.",
    hUpload: "1) Add an image",
    uploadText:
      "You can add an image by uploading a file, pasting from clipboard (Ctrl+V), loading by URL, or drag & drop.",
    spoilerUpload: "Spoiler: Drag & drop from another browser tab (fastest)",
    hCrop: "2) Crop (this matters the most)",
    cropText:
      "Icons are tiny (24×12 or 16×12). A small crop shift can change the final result completely. Move the crop, adjust scale, and always check both True Size and Zoom.",
    spoilerCrop: "Spoiler: Good crop vs bad crop",
    hModes: "3) Mode",
    modesText: "Choose a mode depending on your source image:",
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
      "When you like the result, click Download BMPs. Files are ready to use in Lineage 2.",
    hExamples: "Examples",
    examplesText:
      "Below are a few ready icons.",
    spoilerExamples: "Spoiler: Examples",
  },
  ru: {
    title: "Мини‑гайд: как пользоваться CrestMaker",
    intro1:
      "CrestMaker — небольшой веб‑инструмент для создания клановых/альянсовых иконок Lineage 2 (BMP 256 цветов). Работает прямо в браузере — без установки и регистрации.",
    intro2: "Схема простая: добавить картинку → выбрать кроп → подобрать режим/пресет → докрутить → скачать BMP.",
    hUpload: "1) Добавить картинку",
    uploadText:
      "Картинку можно загрузить файлом, вставить из буфера (Ctrl+V), добавить по ссылке или просто перетащить мышкой.",
    spoilerUpload: "Спойлер: Перетащить картинку из вкладки браузера (самый быстрый способ)",
    hCrop: "2) Crop (самое важное)",
    cropText:
      "Размер иконки очень маленький (24×12 или 16×12), поэтому кроп решает всё. Сдвинули кроп на пару пикселей — результат уже другой. Двигайте кроп, меняйте масштаб и всегда проверяйте True Size и Zoom.",
    spoilerCrop: "Спойлер: Хороший кроп vs плохой кроп",
    hModes: "3) Режим",
    modesText: "Выберите режим под исходную картинку:",
    modernTitle: "Modern",
    modernText: "Лучше для логотипов, рендеров, фото, градиентов. Плавнее переходы.",
    pixelTitle: "Pixel",
    pixelText: "Лучше для пиксель‑арта и простых форм. Чётче края.",
    hPresets: "4) Пресеты",
    presetsText:
      "Пресеты — не “волшебная кнопка”. Одна и та же картинка может выглядеть лучше в другом пресете, с другим кропом, яркостью/контрастом или доп. опциями. Сравнивайте результат в True Size и Zoom.",
    spoilerPresets: "Спойлер: Сравнение пресетов",
    hTune: "5) Доработка результата",
    tuneText:
      "Подкрутите Brightness/Contrast и дополнительные переключатели (например sharpen), чтобы повысить читаемость. Обычно лучше работают небольшие изменения.",
    hDownload: "6) Скачать",
    downloadText:
      "Когда результат устраивает — нажмите Download BMPs. Файлы сразу готовы для Lineage 2.",
    hExamples: "Примеры",
    examplesText:
      "Ниже — несколько готовых иконок.",
    spoilerExamples: "Спойлер: Примеры",
  },
  ua: {
    title: "Міні‑гайд: як користуватися CrestMaker",
    intro1:
      "CrestMaker — невеликий веб‑інструмент для створення кланових/альянсових іконок Lineage 2 (BMP 256 кольорів). Працює прямо в браузері — без встановлення та реєстрації.",
    intro2: "Схема проста: додати зображення → вибрати кроп → підібрати режим/пресет → підкрутити → завантажити BMP.",
    hUpload: "1) Додати зображення",
    uploadText:
      "Зображення можна завантажити файлом, вставити з буфера (Ctrl+V), додати за URL або перетягнути мишкою.",
    spoilerUpload: "Спойлер: Перетягнути зображення з вкладки браузера (найшвидше)",
    hCrop: "2) Crop (найважливіше)",
    cropText:
      "Іконка дуже маленька (24×12 або 16×12), тому кроп вирішує все. Зсунули кроп на пару пікселів — результат уже інший. Рухайте кроп, міняйте масштаб і завжди перевіряйте True Size та Zoom.",
    spoilerCrop: "Спойлер: Хороший кроп vs поганий кроп",
    hModes: "3) Режим",
    modesText: "Оберіть режим під ваше зображення:",
    modernTitle: "Modern",
    modernText: "Краще для логотипів, рендерів, фото, градієнтів. Плавні переходи.",
    pixelTitle: "Pixel",
    pixelText: "Краще для піксель‑арту та простих форм. Чіткі краї.",
    hPresets: "4) Пресети",
    presetsText:
      "Пресети — не “магічна кнопка”. Те саме зображення може виглядати краще з іншим пресетом, кропом, яскравістю/контрастом або додатковими опціями. Порівнюйте результат у True Size та Zoom.",
    spoilerPresets: "Спойлер: Порівняння пресетів",
    hTune: "5) Дотюн",
    tuneText:
      "Підкрутіть Brightness/Contrast та додаткові перемикачі (наприклад sharpen), щоб підвищити читабельність. Зазвичай краще працюють невеликі зміни.",
    hDownload: "6) Завантаження",
    downloadText:
      "Коли результат подобається — натисніть Download BMPs. Файли одразу готові для Lineage 2.",
    hExamples: "Приклади",
    examplesText:
      "Нижче — кілька готових іконок.",
    spoilerExamples: "Спойлер: Приклади",
  },
};

function mdEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function guideHtml(lang: Lang): string {
  const c = COPY[lang];

  return `
    <h1>${mdEscape(c.title)}</h1>
    <p>${mdEscape(c.intro1)}</p>
    <p>${mdEscape(c.intro2)}</p>

    <h2>${mdEscape(c.hUpload)}</h2>
    <p>${mdEscape(c.uploadText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerUpload)}</summary>
      <div class="spoiler-body">
        <div class="guide-video">
          <video class="guide-media" controls muted playsinline preload="none" data-src="/guide/media_01.webm"></video>
        </div>
      </div>
    </details>

    <h2>${mdEscape(c.hCrop)}</h2>
    <p>${mdEscape(c.cropText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerCrop)}</summary>
      <div class="spoiler-body">
        <img class="guide-media" loading="lazy" decoding="async" data-src="/guide/media_02.webp" alt="Crop comparison" />
      </div>
    </details>

    <h2>${mdEscape(c.hModes)}</h2>
    <p>${mdEscape(c.modesText)}</p>
    <ul>
      <li><b>${mdEscape(c.modernTitle)}:</b> ${mdEscape(c.modernText)}</li>
      <li><b>${mdEscape(c.pixelTitle)}:</b> ${mdEscape(c.pixelText)}</li>
    </ul>

    <h2>${mdEscape(c.hPresets)}</h2>
    <p>${mdEscape(c.presetsText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerPresets)}</summary>
      <div class="spoiler-body">
        <img class="guide-media" loading="lazy" decoding="async" data-src="/guide/media_03.webp" alt="Preset comparison" />
      </div>
    </details>

    <h2>${mdEscape(c.hTune)}</h2>
    <p>${mdEscape(c.tuneText)}</p>

    <h2>${mdEscape(c.hDownload)}</h2>
    <p>${mdEscape(c.downloadText)}</p>

    <h2>${mdEscape(c.hExamples)}</h2>
    <p>${mdEscape(c.examplesText)}</p>

    <details class="spoiler">
      <summary>${mdEscape(c.spoilerExamples)}</summary>
      <div class="spoiler-body">
        <div class="crest-grid">
          ${Array.from({ length: 9 }, (_, i) => {
            const n = String(i + 1).padStart(2, "0");
            return `<img class="crest" loading="lazy" decoding="async" data-src="/guide/crest_${n}.bmp" alt="crest ${n}" />`;
          }).join("\n")}
        </div>
      </div>
    </details>
  `;
}
