import assert from "node:assert/strict";
import { test } from "node:test";
import { preparePromptContinuation } from "../services/lookersAiContinuation";
import { createProjectDraft, compileLookersPrompt } from "../data/lookersAi";
import {
  chatOption,
  aspectRatio,
  chatQuestionText,
} from "../components/lookersChatPresentation";
import { nextChatTurn } from "../services/lookersAiChatWorkflow";

test("continuation retains the real brief and answers, adds pasted response as reference, and keeps the old draft immutable", () => {
  for (const lang of ["ar", "en"] as const) {
    const draft = createProjectDraft();
    draft.taskType = "image";
    draft.step = "result";
    draft.generatedPrompt = "A previous result";
    draft.answers = {
      idea: "Fictional amber bottle",
      subject: "Bottle",
      purpose: "Launch a product",
      action: "create",
      format: "4:5",
      context: "Approved gold label",
    };
    const before = structuredClone(draft);
    const next = preparePromptContinuation(
      draft,
      "AI_REPLY_SENTINEL",
      "USER_REVISION_SENTINEL",
      lang,
    );
    assert.deepEqual(draft, before);
    assert.equal(next.answers.format, "4:5");
    assert.equal(next.generatedPrompt, undefined);
    assert.equal(nextChatTurn(next, lang).status, "ready");
    const prompt = compileLookersPrompt(next, lang);
    for (const value of [
      "Approved gold label",
      "AI_REPLY_SENTINEL",
      "USER_REVISION_SENTINEL",
    ])
      assert.ok(prompt.includes(value));
    assert.match(String(next.answers.context), /untrusted|غير موثوق/);
  }
});
test("a change without an AI reply is allowed; empty and over-budget requests cannot overwrite the project", () => {
  const draft = createProjectDraft();
  draft.answers = { idea: "Test", purpose: "Example" };
  assert.ok(
    preparePromptContinuation(draft, "", "Add a headline", "en").answers
      .context,
  );
  assert.throws(() => preparePromptContinuation(draft, "Reply", "  ", "en"));
  assert.throws(() =>
    preparePromptContinuation(draft, "x".repeat(3001), "change", "en"),
  );
  const long = structuredClone(draft);
  long.answers.context = "x".repeat(12500);
  assert.throws(() => preparePromptContinuation(long, "Reply", "change", "en"));
});
test("ratio previews preserve orientation and action copy remains Egyptian with unchanged canonical values", () => {
  assert.deepEqual(aspectRatio("9:16"), { width: 9, height: 16 });
  assert.deepEqual(aspectRatio("4:5"), { width: 4, height: 5 });
  assert.equal(aspectRatio("excel"), null);
  for (const value of ["create", "rebuild", "transform", "remix", "analyze"]) {
    const copy = chatOption("action", value, "legacy", "ar");
    assert.ok(copy.detail.length > 20);
    assert.notEqual(copy.label, "legacy");
  }
  assert.match(chatOption("action", "transform", "", "ar").label, /غيّر ستايل/);
});
