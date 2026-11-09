/**
 * Captures every screen of the static export in `out/`.
 * Usage: node scripts/capture-all.mjs   (run `npm run build` first)
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const PORT = 3113;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = new URL("../screenshots/all/", import.meta.url).pathname;

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {
        /* not up yet */
      }
      if (Date.now() - started > timeoutMs) return reject(new Error("static server did not start"));
      setTimeout(tick, 250);
    };
    tick();
  });
}

const PAGES = [
  { name: "01-home", path: "/", height: 1250 },
  { name: "02-home-light", path: "/", height: 1250, light: true },
  { name: "03-home-mobile", path: "/", width: 390, height: 844, scale: 2 },
  { name: "04-players-index", path: "/players/", height: 1200 },
  { name: "05-players-mobile", path: "/players/", width: 390, height: 844, scale: 2 },
  { name: "06-player-gurman", path: "/players/gurman-singh-bindra/", height: 1500 },
  { name: "07-player-messi", path: "/players/lionel-messi/", height: 1500 },
  { name: "08-countries", path: "/countries/", height: 1200 },
  { name: "09-country-spain", path: "/countries/spain/", height: 1300 },
  { name: "10-clubs", path: "/clubs/", height: 1100 },
  { name: "11-club-man-utd", path: "/clubs/manchester-united/", height: 900 },
  { name: "12-timeline-2026", path: "/timeline/?year=2026", height: 1100 },
  { name: "13-timeline-1930", path: "/timeline/?year=1930", height: 1100 },
  { name: "14-compare", path: "/compare/?p=lionel-messi,cristiano-ronaldo,kylian-mbappe", height: 1250 },
  { name: "15-game-aim", path: "/play/", height: 1100 },
  { name: "16-about", path: "/about/", height: 1300 },
  { name: "17-search", path: "/search/", height: 800 },
  { name: "18-404", path: "/404.html", height: 700 },
];

const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", "out"], {
  cwd: new URL("..", import.meta.url).pathname,
  stdio: "ignore",
});

try {
  await mkdir(OUT, { recursive: true });
  await waitForServer(`${BASE}/index.html`);
  const browser = await puppeteer.launch({
    executablePath: "/usr/local/bin/chromium",
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  for (const page of PAGES) {
    const tab = await browser.newPage();
    await tab.setViewport({
      width: page.width ?? 1440,
      height: page.height ?? 1000,
      deviceScaleFactor: page.scale ?? 1,
    });
    // localStorage is shared across tabs, so set the theme explicitly on every page
    await tab.evaluateOnNewDocument((theme) => {
      try {
        localStorage.setItem("atlas-theme", theme);
      } catch {}
    }, page.light ? "light" : "dark");
    await tab.goto(`${BASE}${page.path}`, { waitUntil: "networkidle0", timeout: 45000 });
    await new Promise((resolve) => setTimeout(resolve, 700));
    await tab.screenshot({ path: `${OUT}${page.name}.png`, fullPage: false });
    console.log("captured", page.name);
    await tab.close();
  }

  // ---- the game, mid-play: aim, power bar, and a shot result -------------
  const game = await browser.newPage();
  await game.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await game.evaluateOnNewDocument(() => localStorage.setItem("atlas-theme", "dark"));
  await game.goto(`${BASE}/play/`, { waitUntil: "networkidle0", timeout: 45000 });
  await new Promise((resolve) => setTimeout(resolve, 600));

  // aim top-left corner, lock it, let the power bar sweep, then shoot
  await game.click('button[aria-label="Aim left"]');
  await game.click('button[aria-label="Aim higher"]');
  await game.click("button.btn.btn-accent"); // lock aim
  await new Promise((resolve) => setTimeout(resolve, 420));
  await game.screenshot({ path: `${OUT}19-game-power.png`, fullPage: false });
  console.log("captured 19-game-power");

  await game.click("button.btn.btn-accent"); // shoot
  await new Promise((resolve) => setTimeout(resolve, 620));
  await game.screenshot({ path: `${OUT}20-game-result.png`, fullPage: false });
  console.log("captured 20-game-result");

  await browser.close();
} finally {
  server.kill("SIGTERM");
}
