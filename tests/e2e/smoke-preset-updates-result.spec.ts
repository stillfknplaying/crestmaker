import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");

async function hashCanvas(page: Page, testId: string): Promise<string> {
  return page.evaluate((tid) => {
    const canvas = document.querySelector<HTMLCanvasElement>(`[data-testid="${tid}"]`);
    if (!canvas) return "missing";
    const ctx = canvas.getContext("2d");
    if (!ctx) return "noctx";
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let h = 2166136261;
    for (let i = 0; i < data.length; i += 16) {
      h ^= data[i];
      h = Math.imul(h, 16777619);
    }
    return `${canvas.width}x${canvas.height}:${(h >>> 0).toString(16)}`;
  }, testId);
}

test("changing preset updates the rendered result", async ({ page }) => {
  await page.goto("/#/");
  await page.getByTestId("upload-input").setInputFiles(fixturePath);
  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });

  const before = await hashCanvas(page, "canvas-result-24");

const preset = page.getByTestId("preset");
const values = await preset
  .locator("option")
  .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));

expect(values.length).toBeGreaterThan(0);

const current = await preset.inputValue();
const target = values.find((v) => v !== current) ?? values[0];

await preset.selectOption(target);

// Проверяем, что пресет реально переключился
await expect(preset).toHaveValue(target);

// И что приложение остаётся в рабочем состоянии
await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });
await expect(page.getByTestId("canvas-result-24")).toBeAttached();

});
