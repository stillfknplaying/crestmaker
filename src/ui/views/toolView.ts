import type { Lang } from "../../i18n";
import type { CrestMode, PipelineMode } from "../../types/types";

export type ToolViewCtx = {
  // i18n / html helpers
  t: (en: string, ru: string, ua: string) => string;
  escapeHtml: (s: string) => string;
  tipAttr: (en: string, ru: string, ua: string) => string;
  helpHtml: (en: string, ru: string, ua: string) => string;

  // state
  currentLang: Lang;
  currentMode: CrestMode;
  pipeline: PipelineMode;
  pixelPreset: string;
  advancedOpen: boolean;

  // computed view data
  cropLabel: string;
  trueW: number;
  trueH: number;
  templateName: string;
};

export function renderToolView(ctx: ToolViewCtx): string {
  const { t, escapeHtml, tipAttr, helpHtml } = ctx;
  const isPixel = ctx.pipeline === "pixel";

  return `
      <section class="tool">
        <div id="dropOverlay" class="drop-overlay" aria-hidden="true">
          <div class="drop-overlay-card">
            <div class="drop-overlay-title">${escapeHtml(t("Drop image to upload", "Отпустите, чтобы загрузить", "Відпустіть, щоб завантажити"))}</div>
            <div class="drop-overlay-sub">${escapeHtml(t("You can also paste with Ctrl+V", "Также можно вставить через Ctrl+V", "Також можна вставити через Ctrl+V"))}</div>
          </div>
        </div>

        <div class="toolbar">
          <label class="btn primary">
            ${escapeHtml(t("Upload image","Загрузить","Завантажити"))}
            <input data-testid="upload-input" id="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
          </label>

          <button data-testid="download" id="download" class="btn primary" disabled>${escapeHtml(t("Download BMPs","Скачать BMP","Завантажити BMP"))}</button>

          <div class="sep"></div>

          <div class="select" ${tipAttr(
            "Select output size: 24×12 (full) or 16×12 (clan only).",
            "Выберите размер: 24×12 (полный) или 16×12 (только клан).",
            "Оберіть розмір: 24×12 (повний) або 16×12 (лише клан)."
          )}>
            <span>${escapeHtml(t("Size","Размер","Розмір"))}</span>
            <select data-testid="mode" id="mode">
              <option value="ally_clan" ${ctx.currentMode === "ally_clan" ? "selected" : ""}>${escapeHtml(t("24×12","24×12","24×12"))}</option>
              <option value="only_clan" ${ctx.currentMode === "only_clan" ? "selected" : ""}>${escapeHtml(t("16×12","16×12","16×12"))}</option>
            </select>
          </div>

          <div class="select" ${tipAttr(
            "Choose conversion type: Modern (image-q) or Pixel (fixed 256 palette + ordered dither)",
            "Выберите тип конвертации: Modern (image-q) или Pixel (фикс. палитра 256 + ordered dither)",
            "Оберіть тип конвертації: Modern (image-q) або Pixel (фікс. палітра 256 + ordered dither)"
          )}>
            <span>${escapeHtml(t("Mode","Режим","Режим"))}</span>
            <select data-testid="pipeline" id="pipeline">
              <option value="old" ${ctx.pipeline === "old" ? "selected" : ""}>Modern</option>
              <option value="pixel" ${ctx.pipeline === "pixel" ? "selected" : ""}>Pixel</option>
            </select>
          </div>

          <div class="select" ${tipAttr(
            "Quick settings for converting to BMP 256 colors (depends on Conversion)",
            "Быстрые настройки конвертации в BMP 256 цветов (зависят от Конвертации)",
            "Швидкі налаштування конвертації в BMP 256 кольорів (залежать від Конвертації)"
          )}>
            <span>${escapeHtml(t("Preset","Пресет","Пресет"))}</span>
            <select data-testid="preset" id="preset">
              ${isPixel
                ? `
                  <option value="pixel-clean" ${ctx.pixelPreset === "pixel-clean" ? "selected" : ""}>Clean</option>
                  <option value="pixel-crisp" ${ctx.pixelPreset === "pixel-crisp" ? "selected" : ""}>Crisp</option>
                  <option value="pixel-stable" ${ctx.pixelPreset === "pixel-stable" ? "selected" : ""}>Stable</option>
                  <option value="pixel-indexed" ${ctx.pixelPreset === "pixel-indexed" ? "selected" : ""}>Indexed</option>`
                : `
                  <option value="balanced" selected>${escapeHtml(t("Balanced","Баланс","Баланс"))}</option>
                  <option value="simple">${escapeHtml(t("Simple","Обычно","Простий"))}</option>
                  <option value="complex">${escapeHtml(t("Complex","Сложная","Складна"))}</option>
                  <option value="legacy">${escapeHtml(t("Legacy","Legacy","Legacy"))}</option>
                `}
            </select>
          </div>

          <label class="toggle compact" ${tipAttr(
            "More conversion controls for 24×12 icons",
            "Больше настроек конвертации для иконки 24×12",
            "Більше налаштувань конвертації для іконки 24×12"
          )}>
            <span>${escapeHtml(t("Settings","Настройки","Налаштування"))}</span>
            <input data-testid="advanced" id="advanced" type="checkbox" ${ctx.advancedOpen ? "checked" : ""} />
            <span class="track"><span class="thumb"></span></span>
          </label>

          <button data-testid="reset" id="reset" class="btn ${ctx.advancedOpen ? "" : "hidden"}" disabled>${escapeHtml(t("Reset","Сброс","Скинути"))}</button>

          <div class="toolbar-right">
            <button class="btn ${ctx.currentLang === "en" ? "active" : ""}" data-lang="en">EN</button>
            <button class="btn ${ctx.currentLang === "ru" ? "active" : ""}" data-lang="ru">RU</button>
            <button class="btn ${ctx.currentLang === "ua" ? "active" : ""}" data-lang="ua">UA</button>
          </div>

          <!-- Load by URL: keep at the very end of the toolbar so it appears on the bottom row -->
          <div class="url-load toolbar-bottom">
            <div class="url-row">
              <input
                data-testid="url-input"
                id="url"
                class="input"
                type="url"
                placeholder="${escapeHtml(t("Image URL (http/https)","URL картинки (http/https)","URL картинки (http/https)"))}"
                ${tipAttr(
                  "Load an image from a direct URL. Some sites block access due to CORS.",
                  "Загрузить картинку по прямому URL. Некоторые сайты блокируют доступ (CORS).",
                  "Завантажити картинку за прямим URL. Деякі сайти блокують доступ (CORS)."
                )}
              />
              <button data-testid="load-url" id="loadUrl" class="btn">${escapeHtml(t("Load","Загрузить","Завантажити"))}</button>
            </div>
            <div data-testid="url-error" id="urlError" class="muted hidden" aria-live="polite"></div>
          </div>
        
          <div class="toolbarhint muted">
            ${escapeHtml(t("Tip: paste (Ctrl+V) or drag & drop an image anywhere on the page.", "Подсказка: вставьте (Ctrl+V) или перетащите картинку в любое место страницы.", "Підказка: вставте (Ctrl+V) або перетягніть картинку в будь-яке місце сторінки."))}
          </div>
</div>

        <div id="advancedPanel" class="advanced ${ctx.advancedOpen ? "" : "hidden"}">
          <div class="adv-top">
            <div id="smoothingRow" class="select">
              <span class="lbl">
                ${escapeHtml(t("Smoothing","Сглаживание","Згладжування"))}
                ${helpHtml(
                  "Adds a subtle pixel pattern to smooth color transitions in a 24×12 256-color BMP.",
                  "Добавляет лёгкий пиксельный узор, чтобы сгладить переходы цветов в BMP 256 (24×12).",
                  "Додає легкий піксельний візерунок, щоб згладити переходи кольорів у BMP 256 (24×12)."
                )}
              </span>
              <select id="dither">
                <option value="none">${escapeHtml(t("Off","Выкл","Вимк"))}</option>
                <option value="ordered4" selected>${escapeHtml(t("Pattern 4×4","Шаблон 4×4","Візерунок 4×4"))}</option>
                <option value="ordered8">${escapeHtml(t("Pattern 8×8","Шаблон 8×8","Візерунок 8×8"))}</option>
                <option value="atkinson">${escapeHtml(t("Smooth (Atkinson)","Плавно (Atkinson)","Плавно (Atkinson)"))}</option>
                <option value="floyd">${escapeHtml(t("Smooth (Floyd–Steinberg)","Плавно (Floyd–Steinberg)","Плавно (Floyd–Steinberg)"))}</option>
              </select>
            </div>

            <div class="range" id="strengthRow">
              <span class="lbl">
                ${escapeHtml(t("Strength","Сила","Сила"))}
                ${helpHtml(
                  "Controls how strong the smoothing pattern is. Lower = cleaner pixels, higher = smoother gradients.",
                  "Насколько сильное сглаживание. Ниже = чище пиксели, выше = плавнее переходы.",
                  "Наскільки сильне згладжування. Нижче = чистіші пікселі, вище = плавніші переходи."
                )}
              </span>
              <input id="ditherAmt" type="range" min="0" max="100" value="55" />
              <b><span id="ditherAmtVal">55</span>%</b>
            </div>

            <div class="range" id="brightnessRow">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Brightness","Яркость","Яскравість"))}</span>
                ${helpHtml(
                  "Adjusts brightness before conversion.",
                  "Регулирует яркость перед конвертацией.",
                  "Регулює яскравість перед конвертацією."
                )}
              </div>
              <input id="brightness" type="range" min="-50" max="50" value="0" />
              <b><span id="brightnessVal">0</span></b>
            </div>

            <div class="range" id="contrastRow">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Contrast","Контраст","Контраст"))}</span>
                ${helpHtml(
                  "Adjusts contrast before conversion.",
                  "Регулирует контраст перед конвертацией.",
                  "Регулює контраст перед конвертацією."
                )}
              </div>
              <input id="contrast" type="range" min="-50" max="50" value="0" />
              <b><span id="contrastVal">0</span></b>
            </div>

            <div class="btn-group adv-actions">
              <button id="rotL" class="btn" aria-label="${escapeHtml(t("Rotate left","Повернуть влево","Повернути ліворуч"))}">
                <span class="rot-label">${escapeHtml(t("Rotate","Повернуть","Повернути"))}</span>
                <span class="rot-icon" aria-hidden="true">⟲</span>
              </button>
              <button id="rotR" class="btn" aria-label="${escapeHtml(t("Rotate right","Повернуть вправо","Повернути праворуч"))}">
                <span class="rot-label">${escapeHtml(t("Rotate","Повернуть","Повернути"))}</span>
                <span class="rot-icon" aria-hidden="true">⟳</span>
              </button>
              <button id="invert" class="btn">${escapeHtml(t("Invert","Инвертировать","Інвертувати"))}</button>
            </div>
          </div>

          <div class="adv-toggles">
            <div class="adv-opt old-only" id="optTwoStep">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Smoother resize","Плавное уменьшение","Плавне зменшення"))}</span>
                ${helpHtml(
                  "Resizes in two steps so the 24×12 icon keeps cleaner pixels.",
                  "Уменьшает в два шага — меньше артефактов на 24×12.",
                  "Зменшує у два кроки — менше артефактів на 24×12."
                )}
              </div>
              <label class="toggle compact toggle-switch">
                <input id="twoStep" type="checkbox" checked />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>

            <div class="adv-opt old-only" id="optBalanceColors">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Balance colors","Баланс цветов","Баланс кольорів"))}</span>
                ${helpHtml(
                  "Keeps the icon from getting too dark or too pale after conversion.",
                  "Не даёт иконке стать слишком тёмной или слишком бледной после конвертации.",
                  "Не дає іконці стати надто темною або надто блідою після конвертації."
                )}
              </div>
              <label class="toggle compact toggle-switch">
                <input id="centerPalette" type="checkbox" checked />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>

            <div class="adv-opt" id="optBetterMatch">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Better color match","Точнее цвета","Точніші кольори"))}</span>
                ${helpHtml(
                  "Improves color matching for 256-color conversion (often looks cleaner on emblems).",
                  "Улучшает совпадение цветов при 256-цветной конвертации (часто выглядит чище на эмблемах).",
                  "Покращує співпадіння кольорів при 256-кольоровій конвертації (часто виглядає чистіше на емблемах)."
                )}
              </div>
              <label class="toggle compact toggle-switch">
                <input id="oklab" type="checkbox" checked />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>

            <div class="adv-opt old-only" id="optSubtleNoise">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Subtle noise","Лёгкий шум","Легкий шум"))}</span>
                ${helpHtml(
                  "Adds a tiny bit of noise to reduce visible patterns after smoothing.",
                  "Добавляет чуть-чуть шума, чтобы уменьшить заметные узоры после сглаживания.",
                  "Dодає трішки шуму, щоб зменшити помітні візерунки після згладжування."
                )}
              </div>
              <label class="toggle compact toggle-switch">
                <input id="noiseDither" type="checkbox" checked />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>

            <div class="adv-opt old-only" id="optSharpenEdges">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Sharpen edges","Чёткие границы","Чіткі межі"))}</span>
                ${helpHtml(
                  "Slightly sharpens edges so the crest outline stays crisp at 24×12.",
                  "Слегка подчёркивает границы — контур герба остаётся чётким на 24×12.",
                  "Трохи підкреслює межі — контур герба лишається чітким на 24×12."
                )}
              </div>
              <label class="toggle compact toggle-switch">
                <input id="edgeSharpen" type="checkbox" checked />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>

            <div class="adv-opt">
              <div class="opt-head">
                <span class="opt-name">${escapeHtml(t("Cleanup pixels","Очистка пикселей","Очищення пікселів"))}</span>
                ${helpHtml(
                  "Removes single stray pixels after conversion (good for tiny icons).",
                  "Убирает одиночные «лишние» пиксели после конвертации (полезно для маленьких иконок).",
                  "Прибирає поодинокі «зайві» пікселі після конвертації (корисно для маленьких іконок)."
                )}
              </div>
              <label class="toggle compact toggle-switch">
                <input id="cleanup" type="checkbox" checked />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-head">
              <h3>${escapeHtml(t("Crop","Crop","Crop"))} ${ctx.cropLabel}</h3>
              <label class="toggle compact">
                <span>Use crop</span>
                <input data-testid="use-crop" id="useCrop" type="checkbox" checked />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <canvas data-testid="canvas-crop" id="crop" width="480" height="240"></canvas>
          </div>

          <div class="card">
            <h3>${escapeHtml(t("True size","True size","True size"))} ${ctx.trueW}×${ctx.trueH}</h3>
            <div class="true-wrap">
              <canvas data-testid="canvas-true" id="dstTrue" width="${ctx.trueW}" height="${ctx.trueH}"></canvas>
            </div>
          </div>

          <div class="card" id="debugCard24">
            <h3>Result 24×12 (zoom)</h3>
            <canvas data-testid="canvas-result-24" id="dstZoom24" width="240" height="120"></canvas>
          </div>

          <div class="card" id="debugCard16">
            <h3>Result 16×12 (zoom)</h3>
            <canvas data-testid="canvas-result-16" id="dstZoom16" width="160" height="120"></canvas>
          </div>

          <div class="card full" id="previewCard">
            <div class="preview-head">
              <h3>Game preview</h3>
              <div class="muted hidden">Template: <b>${ctx.templateName}</b> (2560×1440, UI=1280×720)</div>
            </div>
            <div class="preview-wrap">
              <canvas data-testid="canvas-preview" id="preview"></canvas>
            </div>
          </div>
        </div>

        <div data-testid="reset-modal" id="confirmModal" class="modal hidden" role="dialog" aria-modal="true">
          <div class="modal-card">
            <h3>Reset advanced settings?</h3>
            <p class="muted">This will restore default values for the current preset.</p>
            <div class="modal-actions">
              <button data-testid="reset-cancel" id="confirmNo" class="btn">Cancel</button>
              <button data-testid="reset-confirm" id="confirmYes" class="btn primary">Reset</button>
            </div>
          </div>
        </div>
      </section>
  `;
}
