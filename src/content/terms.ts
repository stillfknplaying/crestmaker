type Lang = "en" | "ru" | "ua";

export function termsHtml(lang: Lang): string {
  const en = `<p>This tool is provided "as is", without warranties of any kind.</p>

<ul>
  <li>You use the tool at your own risk</li>
  <li>The author is not responsible for any loss or damage</li>
  <li>The tool is intended for personal use</li>
  <li>You are responsible for the images you use and for complying with third-party rights</li>
</ul>

<p>If you use “Load by URL”, your browser may contact third-party websites directly. Those requests are outside of CrestMaker’s control.</p>

<p>By using this tool, you agree to these terms.</p>
`;

  const ru = `<p>Инструмент предоставляется "как есть", без каких-либо гарантий.</p>

<ul>
  <li>Вы используете инструмент на свой страх и риск</li>
  <li>Автор не несёт ответственности за возможный ущерб</li>
  <li>Инструмент предназначен для личного использования</li>
  <li>Вы несёте ответственность за используемые изображения и соблюдение прав третьих лиц</li>
</ul>

<p>Если вы используете “Load by URL”, ваш браузер может обращаться к сторонним сайтам напрямую. Эти запросы находятся вне контроля CrestMaker.</p>

<p>Используя этот инструмент, вы соглашаетесь с условиями.</p>
`;

  const ua = `<p>Інструмент надається "як є", без будь-яких гарантій.</p>

<ul>
  <li>Ви використовуєте інструмент на власний ризик</li>
  <li>Автор не несе відповідальності за можливі збитки</li>
  <li>Інструмент призначений для особистого використання</li>
  <li>Ви несете відповідальність за використані зображення та дотримання прав третіх осіб</li>
</ul>

<p>Якщо ви використовуєте “Load by URL”, ваш браузер може звертатися до сторонніх сайтів напряму. Ці запити знаходяться поза контролем CrestMaker.</p>

<p>Користуючись інструментом, ви погоджуєтеся з цими умовами.</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
