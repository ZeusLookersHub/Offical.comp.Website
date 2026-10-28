import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { vertexShader, fragmentShader } from "../components/wormhole/shaders";
const path = "source-handoff/lookers-ai-wormhole/";
test("all 34 recovered files retain their handoff SHA-256", () => {
  const lines = readFileSync(path + "MANIFEST.sha256", "utf8")
    .trim()
    .split("\n");
  assert.equal(lines.length, 34);
  for (const line of lines) {
    const [sha, file] = line.split(/\s+/);
    assert.equal(
      createHash("sha256")
        .update(readFileSync(path + file))
        .digest("hex"),
      sha,
      file,
    );
  }
});
test("React renderer uses the final recovered shader verbatim", () => {
  const html = readFileSync(path + "index.html", "utf8");
  assert.equal(vertexShader, html.match(/const VS = '([^']+)';/)?.[1]);
  assert.equal(fragmentShader, html.match(/const FS = `([\s\S]*?)`;/)?.[1]);
});
