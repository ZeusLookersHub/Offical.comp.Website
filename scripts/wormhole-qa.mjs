import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
const output =
  process.env.WORMHOLE_QA_OUTPUT || "node_modules/.cache/wormhole-qa";
await mkdir(output, { recursive: true });
const server = await createServer({
  server: { host: "127.0.0.1", port: 5284, strictPort: true },
});
const browser = await chromium.launch({
  executablePath: process.env.QA_CHROMIUM_EXECUTABLE,
  headless: true,
  args: [
    "--no-sandbox",
    "--enable-webgl",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const errors = [],
  checks = [],
  geometry = [],
  performanceResults = [];
const url = "http://127.0.0.1:5284/#/lookers-ai";
let page;
async function open({
  width = 1440,
  height = 900,
  reduce = false,
  fallback = false,
} = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
  await context.addInitScript(
    ({ fallback }) => {
      window.__qa = {
        requested: 0,
        deletedTextures: 0,
        deletedBuffers: 0,
        deletedPrograms: 0,
        deletedShaders: 0,
      };
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = function (fn) {
        window.__qa.requested++;
        return raf.call(this, fn);
      };
      if (fallback) {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return type === "webgl" ? null : get.call(this, type, ...args);
        };
      }
      for (const [method, key] of [
        ["deleteTexture", "deletedTextures"],
        ["deleteBuffer", "deletedBuffers"],
        ["deleteProgram", "deletedPrograms"],
        ["deleteShader", "deletedShaders"],
      ]) {
        const original = WebGLRenderingContext.prototype[method];
        WebGLRenderingContext.prototype[method] = function (...args) {
          window.__qa[key]++;
          return original.apply(this, args);
        };
      }
    },
    { fallback },
  );
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url);
  await page.getByRole("button", { name: "DESIGN", exact: true }).waitFor();
  await page.waitForFunction(
    () =>
      Number(
        getComputedStyle(document.querySelector("#root > div.min-h-screen"))
          .opacity,
      ) > 0.99,
  );
  await page.waitForTimeout(1200);
  return context;
}
const renderer = () => page.locator(".wh-gl").getAttribute("data-renderer");
async function measure(label) {
  const result = await page.evaluate(() => {
    const scene = document
      .querySelector(".wormhole-hero")
      .getBoundingClientRect();
    const root = document.querySelector(".wormhole-hero");
    return {
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      scene: {
        x: scene.x,
        y: scene.y,
        width: scene.width,
        height: scene.height,
      },
      planets: [
        ...root.querySelectorAll(
          ".view[aria-hidden=false] .lh-planet:not(.lh-planet--slot)",
        ),
      ].map((n) => {
        const r = n.getBoundingClientRect();
        return {
          label: n.ariaLabel,
          x: r.x,
          y: r.y,
          right: r.right,
          bottom: r.bottom,
        };
      }),
    };
  });
  assert.ok(result.scrollWidth <= result.width, JSON.stringify(result));
  assert.ok(
    result.scene.y + result.scene.height <= result.height + 1,
    JSON.stringify(result),
  );
  for (const p of result.planets) {
    assert.ok(
      p.x >= -1 && p.right <= result.width + 1,
      JSON.stringify({ label, p, result }),
    );
    assert.ok(
      p.y >= result.scene.y - 1 && p.bottom <= result.height + 1,
      JSON.stringify({ label, p, result }),
    );
  }
  geometry.push({ label, ...result });
}
try {
  await server.listen();
  let context = await open();
  assert.equal(await renderer(), "webgl");
  await measure("desktop");
  await page.screenshot({ path: `${output}/desktop-wormhole.png` });
  // Prove that the actual shader framebuffer changes, with the scene otherwise mounted.
  const pixel = () =>
    page.locator(".wh-gl").evaluate(
      (cv) =>
        new Promise((resolve) =>
          requestAnimationFrame(() => {
            const gl = cv.getContext("webgl");
            const bytes = new Uint8Array(cv.width * cv.height * 4);
            gl.readPixels(
              0,
              0,
              cv.width,
              cv.height,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              bytes,
            );
            let hash = 0;
            for (let i = 0; i < bytes.length; i += 17)
              hash = (hash * 31 + bytes[i]) | 0;
            resolve(hash);
          }),
        ),
    );
  const first = await pixel();
  await page.waitForTimeout(600);
  const second = await pixel();
  assert.notEqual(first, second);
  assert.ok(
    await page
      .locator(".lh-planet .lh-globe")
      .first()
      .evaluate((g) => Number(g.style.getPropertyValue("--so")) > 0),
  );
  checks.push(
    "WebGL compiled, texture rendered, animated framebuffer changed and planet light spill applied",
  );
  const perf = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now();
        function frame(now) {
          times.push(now - last);
          last = now;
          if (times.length < 60) requestAnimationFrame(frame);
          else
            resolve({
              frames: times.length,
              meanMs: times.reduce((a, b) => a + b) / times.length,
              maxMs: Math.max(...times),
            });
        }
        requestAnimationFrame(frame);
      }),
  );
  performanceResults.push({
    device: "Headless Chromium desktop, software WebGL",
    ...perf,
  });
  await page.getByRole("button", { name: "DESIGN", exact: true }).click();
  await page
    .getByRole("button", { name: "Motion Design", exact: true })
    .waitFor();
  await page.waitForTimeout(1100);
  await measure("desktop-missions");
  await page.screenshot({ path: `${output}/desktop-missions.png` });
  await page
    .getByRole("button", { name: "Motion Design", exact: true })
    .click();
  await page.getByTestId("adaptive-chat").waitFor();
  assert.equal(await page.locator(".wormhole-hero").count(), 0);
  assert.ok((await page.getByTestId("active-question").count()) <= 1);
  const disposed = await page.evaluate(() => window.__qa);
  for (const key of ["deletedTextures", "deletedBuffers", "deletedPrograms"])
    assert.ok(disposed[key] >= 1, JSON.stringify(disposed));
  assert.ok(disposed.deletedShaders >= 2);
  checks.push(
    "Mission warp enters the real adaptive chat and disposes texture, buffer, program and both shaders",
  );
  await page.getByRole("button", { name: "← Universes", exact: true }).click();
  await page.locator(".wh-gl[data-renderer=webgl]").waitFor();
  assert.equal(await page.locator("canvas.lh-space").count(), 1);
  await context.close();
  checks.push("Returning to universes mounts one background and one WebGL eye");
  for (const width of [1024, 768, 390, 320]) {
    context = await open({ width, height: 844, reduce: true });
    await measure(`english-${width}`);
    assert.equal(await renderer(), "webgl");
    await page.screenshot({ path: `${output}/${width}-wormhole.png` });
    const before = await page.evaluate(() => window.__qa.requested);
    await page.waitForTimeout(250);
    assert.equal(
      await page.evaluate(() => window.__qa.requested),
      before,
      "Reduced motion must not schedule ongoing animation frames",
    );
    await page.getByRole("button", { name: "عربي", exact: true }).click();
    await measure(`arabic-${width}`);
    await page.screenshot({ path: `${output}/${width}-arabic.png` });
    await page.getByRole("button", { name: "التصميم", exact: true }).click();
    await page.waitForTimeout(100);
    await measure(`missions-${width}`);
    await page.screenshot({ path: `${output}/${width}-missions.png` });
    await context.close();
  }
  checks.push(
    "English/Arabic desktop, tablet and 390/320px mobile geometry; reduced motion schedules no continuing RAF",
  );
  context = await open({
    width: 390,
    height: 844,
    reduce: true,
    fallback: true,
  });
  assert.equal(await renderer(), "svg");
  assert.ok(await page.locator(".wh-eye").isVisible());
  await page.screenshot({ path: `${output}/mobile-svg-fallback.png` });
  await page.getByRole("button", { name: "DESIGN", exact: true }).click();
  await page
    .getByRole("button", { name: "Motion Design", exact: true })
    .click();
  await page.getByTestId("adaptive-chat").waitFor();
  await context.close();
  checks.push(
    "WebGL unavailable retains approved SVG and still navigates to chat",
  );
  context = await open({ reduce: true });
  await page.locator(".wh-gl").evaluate((cv) => {
    window.__qaLostExt = cv
      .getContext("webgl")
      .getExtension("WEBGL_lose_context");
    window.__qaLostExt.loseContext();
  });
  await page.waitForTimeout(100);
  assert.equal(await renderer(), "svg");
  await page
    .locator(".wh-gl")
    .evaluate((cv) => window.__qaLostExt.restoreContext());
  await page.locator(".wh-gl[data-renderer=webgl]").waitFor();
  await context.close();
  checks.push(
    "Context loss shows SVG; context restoration recreates WebGL resources",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        status: "success",
        checks,
        geometry,
        performanceResults,
        errors,
        browser: browser.version(),
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks, performanceResults, errors }, null, 2));
} catch (error) {
  if (page && !page.isClosed())
    await page.screenshot({ path: `${output}/failure.png` });
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      { status: "failure", error: String(error), checks, geometry, errors },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
  await server.close();
}
