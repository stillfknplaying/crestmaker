import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.resolve(__dirname, "../fixtures/sample.png");
const url = "https://example.com/sample.png";

test("load image by URL renders results", async ({ page }) => {
  const pngBytes = fs.readFileSync(fixturePath);

  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "image/png",
        "access-control-allow-origin": "*",
      },
      body: pngBytes,
    });
  });

  await page.goto("/#/");

  await page.getByTestId("url-input").fill(url);
  await page.getByTestId("load-url").click();

  await expect(page.getByTestId("download")).toBeEnabled({ timeout: 15000 });
  await expect(page.getByTestId("url-error")).toHaveClass(/hidden/);
});
