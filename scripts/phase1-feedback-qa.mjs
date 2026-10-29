import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
const output =
  process.env.FEEDBACK_QA_OUTPUT || "node_modules/.cache/phase1-feedback";
await mkdir(output, { recursive: true });
const server = await createServer({
  server: { host: "127.0.0.1", port: 5286, strictPort: true },
});
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.QA_CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox"],
});
const errors = [],
  checks = [],
  geometry = [];
let page, context;
const url = "http://127.0.0.1:5286/#/lookers-ai";
async function open(width = 1918, height = 872, reduce = true) {
  if (context) await context.close();
  context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
  await context.route("**/*.supabase.co/**", (route) => route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(
    () =>
      Number(
        getComputedStyle(document.querySelector("#root > div.min-h-screen"))
          .opacity,
      ) > 0.99,
  );
}
const button = (name) => page.getByRole("button", { name, exact: true });
const active = () => page.getByTestId("active-question");
const send = () =>
  active().getByRole("button", { name: "Done · Send", exact: true }).click();
async function answer(text) {
  await active().locator("input[type=text]").fill(text);
  await send();
}
const overlaps = (a, b) =>
  Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1;
async function missionGeometry(label) {
  const g = await page.locator(".wormhole-missions").evaluate((n) => {
    const box = (e) => {
      const r = e.getBoundingClientRect();
      return {
        x: r.x,
        y: r.y,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    };
    return {
      cards: [...n.querySelectorAll(".lh-planet--rock")].map(box),
      focus: box(n.querySelector(".focus .lh-globe")),
      stage: box(n.querySelector(".stage")),
      width: innerWidth,
      height: innerHeight,
    };
  });
  assert.equal(g.cards.length, 4);
  for (let i = 0; i < 4; i++) {
    const a = g.cards[i];
    assert.ok(
      a.x >= 0 &&
        a.right <= g.width + 1 &&
        a.y >= g.stage.y - 1 &&
        a.bottom <= g.height + 1,
      JSON.stringify({ label, a, g }),
    );
    assert.ok(
      !overlaps(a, g.focus),
      JSON.stringify({ label, a, focus: g.focus }),
    );
    for (let j = i + 1; j < 4; j++)
      assert.ok(
        !overlaps(a, g.cards[j]),
        JSON.stringify({ label, a, b: g.cards[j] }),
      );
  }
  const cx = g.stage.x + g.stage.width / 2,
    cy = g.stage.y + g.stage.height / 2;
  const centers = g.cards.map((r) => ({
    x: r.x + r.width / 2,
    y: r.y + r.height / 2,
  }));
  assert.ok(Math.abs(centers[0].x - centers[3].x) < 2);
  assert.ok(Math.abs(centers[1].x - centers[2].x) < 2);
  assert.ok(Math.abs(centers[0].y - centers[1].y) < 2);
  assert.ok(Math.abs(centers[2].y - centers[3].y) < 2);
  assert.ok(Math.abs(centers[0].x + centers[1].x - 2 * cx) < 2);
  assert.ok(Math.abs(centers[0].y + centers[3].y - 2 * cy) < 2);
  geometry.push({ label, ...g });
}
try {
  await server.listen();
  if (!process.env.FEEDBACK_CHAT_ONLY) {
    await open(1918, 872, true);
    for (const world of [
      "MARKETING",
      "DESIGN",
      "BUSINESS",
      "PRESENTATIONS",
      "TECHNOLOGY",
    ]) {
      const planet = button(world);
      const r = await planet.boundingBox();
      await page.mouse.move(
        r.x + r.width / 2,
        r.y + Math.min(35, r.height / 2),
      );
      await page.waitForTimeout(700);
      await planet.click();
      await page.waitForTimeout(2100);
      await missionGeometry(world);
      if (world === "MARKETING")
        await page.screenshot({ path: `${output}/desktop-marketing.png` });
      await button("← All universes").click();
      await page.waitForTimeout(1000);
    }
    checks.push(
      "All five worlds at the supplied 1918×872 desktop size: reduced-motion layout, no mission/planet overlaps and symmetric face-on choices",
    );
    for (const width of [1024, 768, 390, 320]) {
      await open(width, 844);
      await button("عربي").click();
      await button("التسويق").click();
      await missionGeometry(`arabic-${width}`);
      if (width === 390)
        await page.screenshot({ path: `${output}/mobile-missions.png` });
    }
    checks.push(
      "Arabic tablet and mobile mission layout stays symmetric with no overlaps at 1024/768/390/320px",
    );
  }
  await open(1440, 900);
  await button("DESIGN").click();
  await button("Brand Identity").click();
  await answer("A fictional amber perfume bottle");
  // Ask any missing actual task fields through the real workflow.
  while (await active().count()) {
    const id = await active().getAttribute("data-question-id");
    if (id === "subject")
      await answer("Amber bottle with an approved gold label");
    else if (id === "format") {
      const ratios = await active()
        .locator(".lai-ratio-preview>span")
        .evaluateAll((nodes) =>
          nodes.map((n) => ({
            w: n.getBoundingClientRect().width,
            h: n.getBoundingClientRect().height,
          })),
        );
      assert.equal(ratios.length, 4);
      assert.ok(ratios[0].w === ratios[0].h);
      assert.ok(ratios[1].h > ratios[1].w);
      assert.ok(ratios[2].w > ratios[2].h);
      assert.ok(ratios[3].h > ratios[3].w);
      await button("عربي").click();
      await page.screenshot({ path: `${output}/ratio-previews-ar.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      const mobileRatios = await active()
        .locator(".lai-ratio-preview>span")
        .evaluateAll((nodes) =>
          nodes.map((n) => {
            const r = n.getBoundingClientRect();
            return { w: r.width, h: r.height };
          }),
        );
      assert.ok(Math.abs(mobileRatios[0].w - mobileRatios[0].h) < 0.1);
      assert.ok(mobileRatios[3].h > mobileRatios[3].w);
      await page.screenshot({ path: `${output}/mobile-ratio-previews.png` });
      await page.setViewportSize({ width: 1440, height: 900 });
      await button("EN").click();
      await active()
        .getByRole("radio", { name: "Portrait · 4:5", exact: true })
        .check();
      await send();
    } else if (id === "action") {
      await button("عربي").click();
      await page
        .getByText(
          "نفس الفكرة أو العنصر، بس بشكل مختلف؛ زي تحويل صورة حقيقية لرسم.",
          { exact: true },
        )
        .waitFor();
      await page.screenshot({ path: `${output}/egyptian-image-choices.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: `${output}/mobile-egyptian-choices.png` });
      await page.setViewportSize({ width: 1440, height: 900 });
      await button("EN").click();
      await active()
        .getByRole("radio", { name: "Create a new image", exact: true })
        .check();
      await send();
    } else if (id?.startsWith("topic_")) await answer("Approved brand details");
    else if (id === "goal") await answer("Launch a fictional fragrance");
    else if (id === "output") {
      const radios = active().getByRole("radio");
      if (await radios.count()) {
        await radios.first().check();
        await send();
      } else await answer("A ready to copy image prompt");
    } else throw new Error("Unexpected required question " + id);
  }
  checks.push(
    "Actual image interview shows four proportional shapes and accepts specialized brand details",
  );
  await button("Add optional refinements").click();
  await page
    .getByLabel("Optional refinement", { exact: true })
    .selectOption("source");
  await answer("PRESERVE_LABEL_SENTINEL");
  assert.equal(await active().count(), 0);
  await page.locator(".lai-saved-confirmation").waitFor();
  assert.ok(await button("Generate result").isEnabled());
  assert.equal(
    await page
      .locator(".lai-message--user")
      .filter({ hasText: "PRESERVE_LABEL_SENTINEL" })
      .count(),
    1,
  );
  await button("عربي").click();
  await page
    .getByText(
      "تم حفظ إجابتك. كده الأساسيات خلصت — اضغط «جهّز البرومبت» عشان تشوف البرومبت.",
      { exact: false },
    )
    .waitFor();
  await page.screenshot({ path: `${output}/saved-ready-state.png` });
  await button("EN").click();
  await button("Generate result").click();
  await page.getByLabel("Your prompt", { exact: true }).waitFor();
  assert.ok(
    (
      await page.getByLabel("Your prompt", { exact: true }).inputValue()
    ).includes("PRESERVE_LABEL_SENTINEL"),
  );
  checks.push(
    "Optional answer saves exactly once, closes the active card, confirms completion and exposes the explicit prompt-generation action",
  );
  await button("Improve").click();
  await page
    .getByLabel("AI response (optional)", { exact: true })
    .fill("AI_REPLY_SENTINEL: the bottle is too small in the result.");
  await page
    .getByLabel("What should change or be added?", { exact: true })
    .fill(
      "REVISION_SENTINEL: make the bottle larger and leave room for a headline.",
    );
  await button("Update prompt").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#lai-chat-result")
      ?.value.includes("REVISION_SENTINEL"),
  );
  let revised = await page
    .getByLabel("Your prompt", { exact: true })
    .inputValue();
  assert.ok(
    revised.includes("AI_REPLY_SENTINEL") &&
      revised.includes("PRESERVE_LABEL_SENTINEL") &&
      revised.includes("Amber"),
  );
  await button("Improve").click();
  await page
    .getByLabel("What should change or be added?", { exact: true })
    .fill("SECOND_REVISION_SENTINEL: add soft gold lighting.");
  await button("Update prompt").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#lai-chat-result")
      ?.value.includes("SECOND_REVISION_SENTINEL"),
  );
  revised = await page.getByLabel("Your prompt", { exact: true }).inputValue();
  assert.ok(
    revised.includes("REVISION_SENTINEL") &&
      revised.includes("AI_REPLY_SENTINEL"),
  );
  await page.reload();
  await button("Previous Projects").click();
  await page.locator("[data-project-id]").first().click();
  assert.equal(
    await page.getByLabel("Your prompt", { exact: true }).inputValue(),
    revised,
  );
  await button("عربي").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/mobile-continued-result.png` });
  checks.push(
    "Pasted AI response and user revision travel through the existing canonical generator; original answers survive; revised result restores after reload",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        status: "success",
        checks,
        geometry,
        errors,
        provider:
          "Existing real transport deliberately failed in browser QA; output is the explicitly disclosed compiled local prompt.",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ status: "success", checks, errors }, null, 2));
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
