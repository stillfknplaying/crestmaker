import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const BASE_URL = "http://127.0.0.1:4173";

// Routes to prerender (locale prefixes are part of the path)
const LANGS = ["en", "ru", "ua"];
const ROUTES = [
  "/",
  "/guide",
  "/faq",
  "/privacy",
  "/terms",
  "/gdpr",
  "/cookies",
  "/icons",
  "/about",
  "/lineage-2-crest-maker",
  "/create-lineage-2-clan-crest",
  "/l2-crest-16x12-bmp-requirements",
  "/l2-alliance-crest-24x12-bmp",
];

function distFileFor(urlPath) {
  // /en/guide -> dist/en/guide/index.html
  const clean = urlPath.replace(/\/+$/, "");
  const segs = clean.split("/").filter(Boolean);
  if (segs.length === 0) return path.join(DIST, "index.html");
  return path.join(DIST, ...segs, "index.html");
}

async function waitForServer() {
  const maxMs = 15000;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(BASE_URL, { redirect: "manual" });
      if (res.ok || res.status === 200 || res.status === 304 || res.status === 301 || res.status === 302) return;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error("vite preview did not start in time");
}

async function main() {
  if (!existsSync(DIST)) {
    throw new Error("dist/ not found. Run build first.");
  }

  const preview = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {
    stdio: "ignore",
  });

  try {
    await waitForServer();

    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const lang of LANGS) {
      for (const r of ROUTES) {
        const urlPath = r === "/" ? `/${lang}/` : `/${lang}${r}`;
        const url = BASE_URL + urlPath;

        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForSelector("#routeRoot", { timeout: 15000 });

        const html = await page.content();

        const outFile = distFileFor(urlPath);
        await mkdir(path.dirname(outFile), { recursive: true });
        await writeFile(outFile, html, "utf8");
        // eslint-disable-next-line no-console
        console.log("prerendered:", urlPath, "->", path.relative(process.cwd(), outFile));
      }
    }

    await browser.close();
  } finally {
    preview.kill("SIGTERM");
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
