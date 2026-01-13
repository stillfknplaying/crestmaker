type Lang = "en" | "ru" | "ua";

export function termsHtml(lang: Lang): string {
  const en = `
<p>This tool is provided "as is", without warranties of any kind.</p>

<ul>
  <li>You use the tool at your own risk</li>
  <li>The author is not responsible for any loss or damage</li>
  <li>The tool is intended for personal use</li>
</ul>

<p>By using this tool, you agree to these terms.</p>

<p class="muted">Last updated: January 2026</p>
`;

  const ru = `
<p>Инструмент предоставляется "как есть", без каких-либо гарантий.</p>

<ul>
  <li>Вы используете инструмент на свой страх и риск</li>
  <li>Автор не несёт ответственности за возможный ущерб</li>
  <li>Инструмент предназначен для личного использования</li>
</ul>

<p>Используя этот инструмент, вы соглашаетесь с условиями.</p>

<p class="muted">Последнее обновление: January 2026</p>
`;

  const ua = `
<p>Інструмент надається "як є", без будь-яких гарантій.</p>

<ul>
  <li>Ви використовуєте інструмент на власний ризик</li>
  <li>Автор не несе відповідальності за можливі збитки</li>
  <li>Інструмент призначений для особистого використання</li>
</ul>

<p>Користуючись інструментом, ви погоджуєтеся з цими умовами.</p>

<p class="muted">Last updated: January 2026</p>
`;

  return lang === "ru" ? ru : lang === "ua" ? ua : en;
}
