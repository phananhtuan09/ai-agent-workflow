const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const { SOURCE_ROOT } = require("../lib/config");
const { resolveSkills } = require("../lib/skills");
const { getCliSelectedSkills } = require("../lib/selection");
const { getCliSelectedBundles } = require("../lib/selection");

function runCli(args) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-test-"));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-home-"));
  const result = spawnSync(process.execPath, [path.join(SOURCE_ROOT, "cli.js"), ...args], {
    cwd: workspace,
    env: { ...process.env, HOME: home },
    encoding: "utf8",
  });
  return {
    ...result,
    workspace,
    cleanup() {
      fs.rmSync(workspace, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
}

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
    "review-pr",
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

test("lerning-workflow resolves the coordinator and focused helpers", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "lerning-workflow",
  });
  assert.deepStrictEqual(skillIds, [
    "learning-workflow",
    "learning-case",
    "learning-evidence",
    "learning-review",
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

test("coding-standard installs runtime-adapted skill paths", () => {
  const result = runCli(["--kit", "coding-standard", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skill = fs.readFileSync(
      path.join(result.workspace, ".agents/skills/design-spec/SKILL.md"),
      "utf8"
    );
    assert.ok(skill.includes(".agents/skills/design-spec/scripts/validate_design_plan.py"));
    assert.ok(
      fs.existsSync(
        path.join(result.workspace, ".agents/skills/design-spec/scripts/validate_design_plan.py")
      )
    );
    assert.ok(fs.existsSync(path.join(result.workspace, ".agents/skills/review-pr/SKILL.md")));
    assert.ok(
      fs
        .readFileSync(path.join(result.workspace, ".agents/roles/review-pr.md"), "utf8")
        .includes(".agents/skills/review-pr/SKILL.md")
    );
  } finally {
    result.cleanup();
  }
});

test("workflow-eval installs all declared files", () => {
  const result = runCli(["--kit", "workflow-eval", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(
      fs.existsSync(path.join(result.workspace, "docs/ai/evaluation/reports/README.md"))
    );
    const skill = fs.readFileSync(
      path.join(result.workspace, ".agents/skills/workflow-evaluation/SKILL.md"),
      "utf8"
    );
    assert.ok(skill.includes(".agents/skills/workflow-evaluation/extract_session_trace.py"));
  } finally {
    result.cleanup();
  }
});

test("lerning-workflow installs an executable validated case workflow", () => {
  const result = runCli(["--kit", "lerning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skillRoot = path.join(result.workspace, ".agents/skills/learning-workflow");
    const skillsRoot = path.join(result.workspace, ".agents/skills");
    const casePath = path.join(skillRoot, "assets/cases/inventory-reservation.json");
    const initPath = path.join(skillRoot, "scripts/init_learning_session.py");
    const validatePath = path.join(skillRoot, "scripts/validate_learning_state.py");
    const profilePath = path.join(result.workspace, "docs/ai/learning/profile.json");
    const sessionPath = path.join(
      result.workspace,
      "docs/ai/learning/sessions/inventory-reservation-001.json"
    );

    assert.ok(fs.existsSync(casePath));
    assert.ok(fs.existsSync(initPath));
    assert.ok(fs.existsSync(validatePath));
    assert.ok(fs.existsSync(path.join(result.workspace, "docs/ai/learning/cases")));
    assert.ok(fs.existsSync(path.join(skillsRoot, "learning-case/SKILL.md")));
    assert.ok(fs.existsSync(path.join(skillsRoot, "learning-evidence/SKILL.md")));
    assert.ok(fs.existsSync(path.join(skillsRoot, "learning-review/SKILL.md")));

    const coordinator = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
    assert.ok(coordinator.includes("Explore -> Decide -> Reflect"));
    assert.ok(coordinator.includes("Do not announce helper invocation"));

    const initialized = spawnSync(
      "python3",
      [
        initPath,
        "--case",
        casePath,
        "--profile",
        profilePath,
        "--session",
        sessionPath,
        "--goal",
        "Develop senior system-design judgment",
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(initialized.status, 0, initialized.stderr || initialized.stdout);

    const validated = spawnSync(
      "python3",
      [validatePath, sessionPath, "--case", casePath, "--profile", profilePath],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(validated.status, 0, validated.stderr || validated.stdout);

    const invalidSession = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    invalidSession.boundary = { ...invalidSession.boundary, accepted: true, accepted_at: "2026-08-19T00:00:00Z" };
    invalidSession.status = "assessment";
    invalidSession.protected_judgments = invalidSession.protected_judgments.map(
      (judgment, index) => ({
        ...judgment,
        status: index === 0 ? "assisted" : "assessment-closed",
        first_attempt: {
          summary: `Independent attempt for ${judgment.id}`,
          independent: true,
          recorded_at: "2026-08-19T00:01:00Z",
        },
      })
    );
    invalidSession.assistance = [
      {
        id: "AS-001",
        judgment_id: "PJ-001",
        level: 4,
        kind: "scoped-hint",
        content: "Material hint",
        material: true,
        before_first_attempt: false,
        impact: "Narrowed the invariant space",
        recorded_at: "2026-08-19T00:02:00Z",
      },
    ];
    invalidSession.assessment = {
      dimensions: ["RUB-001", "RUB-002", "RUB-003", "RUB-004"].map((id) => ({
        id,
        rating: "demonstrated",
        independence: "independent",
        limitation: "Synthetic validator test",
      })),
      outcome: "independent-success",
      limitations: [],
      disputes: [],
      next_action: null,
    };
    fs.writeFileSync(sessionPath, `${JSON.stringify(invalidSession, null, 2)}\n`);

    const rejected = spawnSync(
      "python3",
      [validatePath, sessionPath, "--case", casePath, "--profile", profilePath],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.notStrictEqual(rejected.status, 0);
    assert.ok(rejected.stderr.includes("independent-success is impossible after material assistance"));
  } finally {
    result.cleanup();
  }
});

test("temporary package workspace can be created", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-test-"));
  assert.ok(fs.existsSync(workspace));
  fs.rmSync(workspace, { recursive: true, force: true });
});
