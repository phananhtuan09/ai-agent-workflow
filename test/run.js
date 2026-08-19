const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { SOURCE_ROOT } = require("../lib/config");
const { resolveSkills } = require("../lib/skills");
const { getCliSelectedSkills } = require("../lib/selection");
const { getCliSelectedBundles } = require("../lib/selection");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("coding-standard resolves only the core bundle", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "coding-standard",
  });
  assert.deepStrictEqual(skillIds, [
    "orchestrator",
    "idea-review",
    "design-spec",
    "create-spec",
    "execute-spec",
    "manual-checklist",
    "verify-feature",
    "verify-runtime",
    "execute-task",
  ]);
});

test("extra skills are deduplicated and appended", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "coding-standard",
    extraSkills: ["refactor", "refactor", "quality-code-check"],
  });
  assert.strictEqual(skillIds.filter((id) => id === "refactor").length, 1);
  assert.strictEqual(skillIds[skillIds.length - 1], "quality-code-check");
});

test("workflow-eval resolves both evaluation skills", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "workflow-eval",
  });
  assert.deepStrictEqual(skillIds, [
    "workflow-evaluation",
    "record-workflow-friction",
  ]);
});

test("repeatable --skill flags are parsed", () => {
  assert.deepStrictEqual(
    getCliSelectedSkills(["--skill", "refactor", "--skill", "frontend-design-fundamentals"]),
    ["refactor", "frontend-design-fundamentals"]
  );
});

test("repeatable --bundle flags are parsed", () => {
  assert.deepStrictEqual(
    getCliSelectedBundles(["--bundle", "frontend", "--bundle", "backend", "--bundle", "frontend"]),
    ["frontend", "backend"]
  );
});

test("bundle skills are expanded and deduplicated", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "coding-standard",
    extraBundles: ["frontend"],
  });
  assert.ok(skillIds.includes("frontend-design-fundamentals"));
  assert.ok(skillIds.includes("react-best-practices"));
  assert.strictEqual(new Set(skillIds).size, skillIds.length);
});

test("canonical skills have required entrypoints", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, "skills/manifest.json"), "utf8"));
  const ids = Object.values(manifest.bundles).flat();
  ids.filter((id) => !manifest.bundles[id]).forEach((id) => {
    assert.ok(fs.existsSync(path.join(SOURCE_ROOT, "skills", id, "SKILL.md")), id);
  });
});

test("temporary package workspace can be created", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-test-"));
  assert.ok(fs.existsSync(workspace));
  fs.rmSync(workspace, { recursive: true, force: true });
});
