/**
 * Captures the three handoff screenshots from a production build.
 * Usage: node scripts/screenshots.mjs   (expects `npm run build` to have run)
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const PORT = 3111;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = new URL("../screenshots/", import.meta.url).pathname;

const shots = [
  { name: "home", path: "/", width: 1440, height: 1200 },
  { name: "player", path: "/players/gurman-singh-bindra", width: 1440, height: 1400 },
  { name: "timeline", path: "/timeline?year=2026", width: 1440, height: 1100 },
  { name: "players-index", path: "/players", width: 1440, height: 1100 },
  { name: "mobile-home", path: "/", width: 390, height: 844 },
];

function waitForServer(url, timeoutMs = 60000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {
        /* not up yet */
      }
      if (Date.now() - started > timeoutMs) return reject(new Error("server did not start"));
      setTimeout(tick, 400);
    };
    tick();
  });
}

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: new URL("..", import.meta.url).pathname,
  stdio: "ignore",
  detached: false,
});

try {
  await mkdir(OUT, { recursive: true });
  await waitForServer(BASE);
  const browser = await puppeteer.launch({
    executablePath: "/usr/local/bin/chromium",
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });

  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 2 });
    await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle0", timeout: 45000 });
    await new Promise((resolve) => setTimeout(resolve, 900));
    await page.screenshot({ path: `${OUT}${shot.name}.png`, fullPage: false });
    console.log("captured", shot.name);
    await page.close();
  }

  await browser.close();
} finally {
  server.kill("SIGTERM");
}
