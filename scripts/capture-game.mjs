/**
 * Captures the penalty game in five states: aim, power, a goal, a save and the
 * end-of-shootout summary. Serves the static export in `out/`.
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const PORT = 3114;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = new URL("../screenshots/all/", import.meta.url).pathname;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch {}
      if (Date.now() - started > timeoutMs) return reject(new Error("static server did not start"));
      setTimeout(tick, 250);
    };
    tick();
  });
}

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

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => localStorage.setItem("atlas-theme", "dark"));
  await page.goto(`${BASE}/play/`, { waitUntil: "networkidle0", timeout: 45000 });
  await wait(700);

  const shot = async (name) => {
    await page.screenshot({ path: `${OUT}${name}.png`, fullPage: false });
    console.log("captured", name);
  };

  // 1. aim state, with the reticle placed in the top corner
  await page.click('button[aria-label="Aim higher"]');
  await page.click('button[aria-label="Aim right"]');
  await wait(350);
  await shot("15-game-aim");

  // 2. power bar mid-sweep
  await page.click("button.btn.btn-accent"); // lock aim
  await wait(430);
  await shot("19-game-power");

  // 3. strike, catch the celebration
  await page.click("button.btn.btn-accent");
  await wait(760);
  await shot("20-game-result");

  // 4. finish the five, polling for the controls between shots
  const clickButton = async (label) =>
    page.evaluate((text) => {
      const button = [...document.querySelectorAll("button")].find(
        (b) => b.textContent?.trim() === text
      );
      if (button) {
        button.click();
        return true;
      }
      return false;
    }, label);

  const waitForLock = async (timeout = 6000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const ready = await page.evaluate(() =>
        [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Lock aim")
      );
      if (ready) return true;
      await wait(120);
    }
    return false;
  };

  for (let i = 0; i < 5; i += 1) {
    if (!(await waitForLock())) break;
    await clickButton("Lock aim");
    await wait(320);
    await clickButton("Strike");
    await wait(700);
  }

  const summaryStart = Date.now();
  while (Date.now() - summaryStart < 9000) {
    const over = await page.evaluate(() =>
      [...document.querySelectorAll("button")].some((b) =>
        b.textContent?.includes("Take five more")
      )
    );
    if (over) break;
    await wait(200);
  }
  await wait(400);
  await shot("21-game-summary");

  // 5. a clean board on the way back (aim state after restart)
  await page.evaluate(() => {
    const again = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Take five more")
    );
    again?.click();
  });
  await wait(500);
  await shot("22-game-restart");

  await browser.close();
} finally {
  server.kill("SIGTERM");
}
