type Lang = "en" | "ru" | "ua";

export function faqHtml(lang: Lang): string {
  const en = `<h3>What is CrestMaker?</h3>
<p>CrestMaker is a free online tool for converting images into <b>BMP 256-color</b> crests for <b>Lineage 2</b>. All processing is done locally in your browser.</p>

<h3>What crest sizes are supported?</h3>
<ul>
  <li><b>24×12 mode (2:1)</b>: download includes <b>24×12 + 16×12 + 8×12</b> BMP files.</li>
  <li><b>16×12 mode (4:3)</b>: download includes <b>only 16×12</b>.</li>
</ul>

<h3>What image formats can I upload?</h3>
<p>Supported formats:</p>
<ul>
  <li>PNG</li>
  <li>JPG / JPEG</li>
  <li>WebP</li>
  <li>BMP</li>
  <li>GIF (static or first frame of animated GIFs)</li>
</ul>
<p><b>AVIF</b> may work in modern browsers, but support depends on your browser. <b>HEIC/HEIF</b> and <b>SVG</b> are not supported.</p>

<h3>How can I upload an image?</h3>
<ul>
  <li>Click <b>Upload image</b></li>
  <li><b>Drag &amp; drop</b> an image file anywhere on the page</li>
  <li>Paste an image with <b>Ctrl+V</b></li>
  <li>Load an image from a direct <b>image URL</b></li>
</ul>

<h3>Is my image uploaded to a server?</h3>
<p>No. CrestMaker processes images locally in your browser. Your images are not uploaded or stored on any server.</p>

<h3>Why does the crest look different in the game?</h3>
<p>Lineage 2 crests are extremely small and require 8-bit (256-color) BMP. Because of these limitations, fine details and smooth gradients may be reduced, and colors can look slightly different compared to the original.</p>

<h3>Does CrestMaker use cookies?</h3>
<p>CrestMaker uses only essential storage for basic preferences (for example, language and cookie settings). No tracking or advertising cookies are enabled by default.</p>
`;

  const ru = `<h3>Что такое CrestMaker?</h3>
<p>CrestMaker — это бесплатный онлайн‑инструмент для конвертации изображений в <b>BMP 256 цветов</b> для <b>Lineage 2</b>. Вся обработка выполняется локально в вашем браузере.</p>

<h3>Какие размеры поддерживаются?</h3>
<ul>
  <li><b>Режим 24×12 (2:1)</b>: при скачивании вы получите <b>24×12 + 16×12 + 8×12</b> BMP‑файлы.</li>
  <li><b>Режим 16×12 (4:3)</b>: при скачивании вы получите <b>только 16×12</b>.</li>
</ul>

<h3>Какие форматы изображений можно загрузить?</h3>
<p>Поддерживаемые форматы:</p>
<ul>
  <li>PNG</li>
  <li>JPG / JPEG</li>
  <li>WebP</li>
  <li>BMP</li>
  <li>GIF (статичный или первый кадр анимации)</li>
</ul>
<p><b>AVIF</b> может работать в современных браузерах, но зависит от поддержки браузера. <b>HEIC/HEIF</b> и <b>SVG</b> не поддерживаются.</p>

<h3>Как загрузить изображение?</h3>
<ul>
  <li>Нажмите <b>Upload image</b></li>
  <li>Перетащите файл изображения на страницу (<b>Drag &amp; Drop</b>)</li>
  <li>Вставьте изображение через <b>Ctrl+V</b></li>
  <li>Загрузите по прямой <b>ссылке на изображение</b></li>
</ul>

<h3>Загружается ли изображение на сервер?</h3>
<p>Нет. CrestMaker обрабатывает изображения локально в браузере. Ваши изображения не отправляются и не сохраняются на сервере.</p>

<h3>Почему результат выглядит иначе в игре?</h3>
<p>Значки Lineage 2 очень маленькие и требуют 8‑битный BMP (256 цветов). Из‑за этих ограничений мелкие детали и плавные градиенты могут пропадать, а цвета могут выглядеть немного иначе, чем в исходнике.</p>

<h3>Используются ли cookies?</h3>
<p>CrestMaker использует только необходимые данные хранения для базовых настроек (например, язык и cookie‑настройки). Трекинг и рекламные cookies по умолчанию не включаются.</p>
`;

  const ua = `<h3>Що таке CrestMaker?</h3>
<p>CrestMaker — це безкоштовний онлайн‑інструмент для конвертації зображень у <b>BMP 256 кольорів</b> для <b>Lineage 2</b>. Уся обробка виконується локально у вашому браузері.</p>

<h3>Які розміри підтримуються?</h3>
<ul>
  <li><b>Режим 24×12 (2:1)</b>: під час завантаження ви отримаєте <b>24×12 + 16×12 + 8×12</b> BMP‑файли.</li>
  <li><b>Режим 16×12 (4:3)</b>: під час завантаження ви отримаєте <b>лише 16×12</b>.</li>
</ul>

<h3>Які формати зображень можна завантажити?</h3>
<p>Підтримувані формати:</p>
<ul>
  <li>PNG</li>
  <li>JPG / JPEG</li>
  <li>WebP</li>
  <li>BMP</li>
  <li>GIF (статичний або перший кадр анімації)</li>
</ul>
<p><b>AVIF</b> може працювати у сучасних браузерах, але це залежить від підтримки браузера. <b>HEIC/HEIF</b> та <b>SVG</b> не підтримуються.</p>

<h3>Як завантажити зображення?</h3>
<ul>
  <li>Натисніть <b>Upload image</b></li>
  <li>Перетягніть файл зображення на сторінку (<b>Drag &amp; Drop</b>)</li>
  <li>Вставте зображення через <b>Ctrl+V</b></li>
  <li>Завантажте за прямим <b>посиланням на зображення</b></li>
</ul>

<h3>Чи надсилається зображення на сервер?</h3>
<p>Ні. CrestMaker обробляє зображення локально у браузері. Ваші зображення не надсилаються та не зберігаються на сервері.</p>

<h3>Чому результат виглядає інакше в грі?</h3>
<p>Значки Lineage 2 дуже маленькі та потребують 8‑бітний BMP (256 кольорів). Через ці обмеження дрібні деталі й плавні градієнти можуть зникати, а кольори можуть виглядати трохи інакше, ніж в оригіналі.</p>

<h3>Чи використовуються cookies?</h3>
<p>CrestMaker використовує лише необхідне сховище даних для базових налаштувань (наприклад, мова та cookie‑налаштування). Трекінг і рекламні cookies за замовчуванням не ввімкнені.</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
