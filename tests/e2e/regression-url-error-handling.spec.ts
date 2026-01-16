import { test, expect } from "@playwright/test";

test("load by URL shows error state for non-image response", async ({ page }) => {
  const url = "https://example.com/not-an-image";

  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/html",
        "access-control-allow-origin": "*",
      },
      body: "<html><body>not an image</body></html>",
    });
  });

  await page.goto("/#/");

  await page.getByTestId("url-input").fill(url);
  await page.getByTestId("load-url").click();

  const err = page.getByTestId("url-error");
  // Error text should become visible (i.e. hidden class removed).
  await expect(err).not.toHaveClass(/hidden/, { timeout: 15000 });
});
