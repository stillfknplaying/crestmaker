import { test, expect } from "@playwright/test";

const url = "https://example.com/missing.png";

test("load by URL shows error state for 404", async ({ page }) => {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 404,
      headers: {
        "content-type": "text/plain",
        "access-control-allow-origin": "*",
      },
      body: "Not found",
    });
  });

  await page.goto("/#/");

  await page.getByTestId("url-input").fill(url);
  await page.getByTestId("load-url").click();

  const err = page.getByTestId("url-error");
  await expect(err).toBeAttached();

  // Different UIs implement error visibility differently; accept either visible or "not hidden" by class.
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('[data-testid="url-error"]');
        if (!el) return "missing";
        const clsHidden = el.classList.contains("hidden");
        const style = window.getComputedStyle(el);
        const hiddenByStyle = style.display === "none" || style.visibility === "hidden" || style.opacity === "0";
        return clsHidden || hiddenByStyle ? "hidden" : "shown";
      });
    }, { timeout: 15000 })
    .toBe("shown");
});
