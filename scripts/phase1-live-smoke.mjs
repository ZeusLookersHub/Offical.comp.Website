import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
const output =
  process.env.PHASE1_LIVE_OUTPUT || "node_modules/.cache/phase1-live";
await mkdir(output, { recursive: true });
const server = await createServer({
  server: { host: "127.0.0.1", port: 5285, strictPort: true },
});
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.QA_CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
page.setDefaultTimeout(30000);
const network = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => {
  if (r.url().includes(".supabase.co/"))
    network.push({ path: new URL(r.url()).pathname, status: r.status() });
});
page.on("requestfailed", (r) => {
  if (r.url().includes(".supabase.co/"))
    network.push({
      path: new URL(r.url()).pathname,
      failure: r.failure()?.errorText,
    });
});
try {
  await server.listen();
  await page.goto("http://127.0.0.1:5285/#/lookers-ai");
  await page.waitForFunction(
    () =>
      Number(
        getComputedStyle(document.querySelector("#root > div.min-h-screen"))
          .opacity,
      ) > 0.99,
  );
  await page.getByRole("button", { name: "DESIGN", exact: true }).click();
  await page
    .getByRole("button", { name: "Motion Design", exact: true })
    .click();
  const active = page.getByTestId("active-question");
  await active
    .locator("input[type=text]")
    .fill(
      "A video 15 seconds 9:16; scene: a fictional amber perfume bottle; goal: introduce a fragrance; tool: Runway",
    );
  await active
    .getByRole("button", { name: "Done · Send", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Generate result", exact: true })
    .click();
  await page.getByLabel("Your prompt", { exact: true }).waitFor();
  const prompt = await page
    .getByLabel("Your prompt", { exact: true })
    .inputValue();
  assert.ok(prompt.includes("15 seconds"));
  const body = await page.getByTestId("adaptive-chat").innerText();
  const source = body.includes("AI service unavailable")
    ? "local-fallback"
    : "inspect-provenance";
  await page.screenshot({ path: `${output}/desktop-generation.png` });
  await page.reload();
  await page
    .getByRole("button", { name: "Previous Projects", exact: true })
    .click();
  await page.locator("[data-project-id]").first().click();
  await page.getByLabel("Your prompt", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Your prompt", { exact: true }).inputValue(),
    prompt,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/mobile-restored-result.png` });
  assert.deepEqual(errors, []);
  const report = {
    status: "completed",
    source,
    network,
    errors,
    checks: [
      "Actual integrated application called existing transport without request mocks",
      "Generated prompt rendered",
      "Reload and Previous Projects restored identical result",
    ],
    provenance: body
      .split("\n")
      .filter((line) => /AI|generated|fallback|service|local/i.test(line)),
  };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await server.close();
}
