const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const { SOURCE_ROOT } = require("../lib/config");
const { resolveSkills } = require("../lib/skills");
const { getCliSelectedSkills } = require("../lib/selection");
const { getCliSelectedBundles } = require("../lib/selection");

const PROTOCOL_FILES = [
  "AGENTS.md",
  "docs/README.md",
  "docs/WORKFLOW.md",
  "docs/product/README.md",
  "docs/decisions/README.md",
  "docs/plans/active/README.md",
  "docs/plans/completed/README.md",
  "docs/patterns/README.md",
  "docs/runbooks/README.md",
  "docs/observed/README.md",
];

function runCli(args, setup) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-test-"));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-home-"));
  if (setup) {
    setup({ workspace, home });
  }
  const result = spawnSync(process.execPath, [path.join(SOURCE_ROOT, "cli.js"), ...args], {
    cwd: workspace,
    env: { ...process.env, HOME: home },
    encoding: "utf8",
  });
  return {
    ...result,
    workspace,
    home,
    cleanup() {
      fs.rmSync(workspace, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
}
function copyFixturePath(sourcePath, destinationPath) {
  const stat = fs.statSync(sourcePath);
  if (stat.isDirectory()) {
    fs.mkdirSync(destinationPath, { recursive: true });
    fs.readdirSync(sourcePath).forEach((name) => {
      copyFixturePath(path.join(sourcePath, name), path.join(destinationPath, name));
    });
    return;
  }
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
  fs.chmodSync(destinationPath, stat.mode);
}

function createUpdateFixture(tool = "opencode") {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-update-"));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-update-home-"));
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-update-source-"));
  [
    "package.json",
    ...PROTOCOL_FILES,
    "skills",
    "docs/evaluation",
    "docs/learning",
    "docs/testing",
    ".agents",
    ".claude",
    ".codex",
    ".opencode",
  ].forEach((relativePath) => {
    const sourcePath = path.join(SOURCE_ROOT, relativePath);
    if (fs.existsSync(sourcePath)) {
      copyFixturePath(sourcePath, path.join(sourceRoot, relativePath));
    }
  });
  const env = { ...process.env, HOME: home, AI_WORKFLOW_SOURCE_ROOT: sourceRoot };
  const run = (args) => spawnSync(
    process.execPath,
    [path.join(SOURCE_ROOT, "cli.js"), ...args],
    { cwd: workspace, env, encoding: "utf8" }
  );
  const install = run(["--kit", "coding-standard", "--tool", tool]);
  assert.strictEqual(install.status, 0, install.stderr || install.stdout);
  return {
    workspace,
    home,
    sourceRoot,
    run,
    statePath: path.join(workspace, ".ai-workflow/installed.json"),
    cleanup() {
      fs.rmSync(workspace, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
      fs.rmSync(sourceRoot, { recursive: true, force: true });
    },
  };
}

function createCliFixture(setup) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-cli-"));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-cli-home-"));
  const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-cli-source-"));
  [
    "package.json",
    ...PROTOCOL_FILES,
    "skills",
    "docs/evaluation",
    "docs/learning",
    "docs/testing",
    ".agents",
    ".claude",
    ".codex",
    ".opencode",
  ].forEach((relativePath) => {
    const sourcePath = path.join(SOURCE_ROOT, relativePath);
    if (fs.existsSync(sourcePath)) {
      copyFixturePath(sourcePath, path.join(sourceRoot, relativePath));
    }
  });
  const env = { ...process.env, HOME: home, AI_WORKFLOW_SOURCE_ROOT: sourceRoot };
  if (setup) setup({ workspace, home, sourceRoot });
  return {
    workspace,
    home,
    sourceRoot,
    run(args) {
      return spawnSync(
        process.execPath,
        [path.join(SOURCE_ROOT, "cli.js"), ...args],
        { cwd: workspace, env, encoding: "utf8" }
      );
    },
    statePath: path.join(workspace, ".ai-workflow/installed.json"),
    cleanup() {
      fs.rmSync(workspace, { recursive: true, force: true });
      fs.rmSync(home, { recursive: true, force: true });
      fs.rmSync(sourceRoot, { recursive: true, force: true });
    },
  };
}

function snapshotFiles(root) {
  const snapshot = {};
  const visit = (directory, prefix = "") => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(target, relativePath);
      } else {
        snapshot[relativePath] = fs.readFileSync(target).toString("base64");
      }
    });
  };
  visit(root);
  return snapshot;
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

test("coding-standard defaults to direct execution without skills", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "coding-standard",
  });
  assert.deepStrictEqual(skillIds, []);
});


test("extra skills are deduplicated and appended", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "coding-standard",
    extraSkills: ["quality-code-check", "quality-code-check", "proposal-designer"],
  });
  assert.strictEqual(skillIds.filter((id) => id === "quality-code-check").length, 1);
  assert.strictEqual(skillIds[skillIds.length - 1], "proposal-designer");
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

test("learning-workflow resolves the coordinator and focused helpers", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "learning-workflow",
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
    getCliSelectedSkills(["--skill", "quality-code-check", "--skill", "proposal-designer"]),
    ["quality-code-check", "proposal-designer"]
  );
});

test("repeatable --bundle flags are parsed", () => {
  assert.deepStrictEqual(
    getCliSelectedBundles(["--bundle", "core", "--bundle", "testing", "--bundle", "core"]),
    ["core", "testing"]
  );
});

test("CLI help describes direct protocol and optional kits", () => {
  const result = runCli(["--help"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(result.stdout.includes("no skills"));
    assert.ok(result.stdout.includes("docs/evaluation/"));
    assert.ok(result.stdout.includes("docs/learning/"));
    assert.ok(!result.stdout.includes("strict-workflows"));
    assert.ok(!result.stdout.includes("orchestrator"));
  } finally {
    result.cleanup();
  }
});

test("testing bundle registers the runtime E2E skill", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "coding-standard",
    extraBundles: ["testing"],
  });
  assert.deepStrictEqual(skillIds, ["runtime-e2e-test"]);
});

test("canonical skills have required entrypoints", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(SOURCE_ROOT, "skills/manifest.json"), "utf8"));
  const ids = Object.values(manifest.bundles).flat();
  ids.filter((id) => !manifest.bundles[id]).forEach((id) => {
    assert.ok(fs.existsSync(path.join(SOURCE_ROOT, "skills", id, "SKILL.md")), id);
  });
});

test("review-pr installs its canonical skill and runtime reviewer", () => {
  const cases = [
    {
      tool: "codex",
      skillPath: ".agents/skills/review-pr/SKILL.md",
      reviewerPath: ".codex/agents/review-pr.toml",
      reviewerSource: ".codex/agents/review-pr.toml",
      rolePath: ".agents/roles/review-pr.md",
      roleSource: ".agents/roles/review-pr.md",
    },
    {
      tool: "claude",
      skillPath: ".claude/skills/review-pr/SKILL.md",
      reviewerPath: ".claude/agents/review-pr.md",
      reviewerSource: ".claude/agents/review-pr.md",
    },
  ];

  cases.forEach(({ tool, skillPath, reviewerPath, reviewerSource, rolePath, roleSource }) => {
    const result = runCli([
      "--kit",
      "coding-standard",
      "--tool",
      tool,
      "--skill",
      "review-pr",
    ]);
    try {
      assert.strictEqual(result.status, 0, result.stderr || result.stdout);
      assert.ok(
        fs.readFileSync(path.join(result.workspace, skillPath)).equals(
          fs.readFileSync(path.join(SOURCE_ROOT, "skills/review-pr/SKILL.md"))
        )
      );
      assert.ok(
        fs.readFileSync(path.join(result.workspace, reviewerPath)).equals(
          fs.readFileSync(path.join(SOURCE_ROOT, reviewerSource))
        )
      );
      if (rolePath) {
        assert.ok(
          fs.readFileSync(path.join(result.workspace, rolePath)).equals(
            fs.readFileSync(path.join(SOURCE_ROOT, roleSource))
          )
        );
      }
    } finally {
      result.cleanup();
    }
  });
});

[
  ["claude", ".claude/skills"],
  ["codex", ".agents/skills"],
  ["antigravity", ".agents/skills"],
  ["opencode", ".agents/skills"],
  ["pi", ".agents/skills"],
].forEach(([tool, root]) => {
  test(`planner-mode bundle installs the manual planner mode for ${tool}`, () => {
    const result = runCli(["--kit", "coding-standard", "--tool", tool, "--bundle", "planner-mode"]);
    try {
      assert.strictEqual(result.status, 0, result.stderr || result.stdout);
      ["planner", "quality-code-check", "manage-project-knowledge"].forEach((skillId) => {
        assert.ok(fs.existsSync(path.join(result.workspace, root, skillId, "SKILL.md")), skillId);
      });
      const planner = fs.readFileSync(path.join(result.workspace, root, "planner/SKILL.md"), "utf8");
      assert.ok(planner.includes("disable-model-invocation: true"));
      assert.ok(!fs.existsSync(path.join(result.workspace, root, "coder")));

      // Planner is plain instructions, so Claude settings carry no hooks for it.
      if (tool === "claude") {
        assert.ok(
          fs.readFileSync(path.join(result.workspace, ".claude/settings.json")).equals(
            fs.readFileSync(path.join(SOURCE_ROOT, ".claude/settings.json"))
          )
        );
      }
    } finally {
      result.cleanup();
    }
  });
});

test("Claude project instructions use the root protocol as their source", () => {
  assert.ok(!fs.existsSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.md")));
  assert.strictEqual(
    fs.readFileSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.project.md"), "utf8"),
    "@../AGENTS.md\n"
  );
});

test("Claude install imports AGENTS.md instead of copying it", () => {
  const result = runCli(["--kit", "coding-standard", "--tool", "claude"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(result.workspace, ".claude/CLAUDE.md"), "utf8"),
      "@../AGENTS.md\n"
    );
  } finally {
    result.cleanup();
  }
});

test("installing a skill that already exists in .claude/skills warns about the duplicate", () => {
  const result = runCli(
    ["--kit", "coding-standard", "--tool", "codex", "--bundle", "planner-mode"],
    ({ workspace }) => {
      fs.mkdirSync(path.join(workspace, ".claude/skills/planner"), { recursive: true });
      fs.mkdirSync(path.join(workspace, ".claude/skills/consumer-only"), { recursive: true });
    }
  );
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const warning = result.stdout.split("\n").find((line) => line.includes("list each skill twice"));
    assert.ok(warning, result.stdout);
    assert.ok(warning.includes("planner"));
    assert.ok(!warning.includes("consumer-only"));
  } finally {
    result.cleanup();
  }
});

test("skill roots without a shared skill do not warn about duplicates", () => {
  const result = runCli(
    ["--kit", "coding-standard", "--tool", "codex", "--bundle", "planner-mode"],
    ({ workspace }) => fs.mkdirSync(path.join(workspace, ".claude/skills"), { recursive: true })
  );
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(path.join(result.workspace, ".agents/skills/planner/SKILL.md")));
    assert.ok(!result.stdout.includes("list each skill twice"), result.stdout);
  } finally {
    result.cleanup();
  }
});

for (const kitArgs of [["--kit", "workflow-eval"], ["--kit", "design", "--skill", "planner"]]) {
  test(`${kitArgs[1]} warns when its skills exist for both Claude and shared runtimes`, () => {
    const result = runCli([...kitArgs, "--tool", "codex"]);
    try {
      assert.strictEqual(result.status, 0, result.stderr || result.stdout);
      assert.ok(!result.stdout.includes("list each skill twice"), result.stdout);
      const claude = spawnSync(
        process.execPath,
        [path.join(SOURCE_ROOT, "cli.js"), ...kitArgs, "--tool", "claude"],
        { cwd: result.workspace, env: { ...process.env, HOME: result.home }, encoding: "utf8" }
      );
      assert.strictEqual(claude.status, 0, claude.stderr || claude.stdout);
      assert.ok(claude.stdout.includes("list each skill twice"), claude.stdout);
    } finally {
      result.cleanup();
    }
  });
}

test("shared skills installed for several runtimes stay managed", () => {
  const fixture = createCliFixture();
  try {
    const install = fixture.run([
      "--kit", "coding-standard", "--all", "--skill", "record-workflow-friction",
    ]);
    assert.strictEqual(install.status, 0, install.stderr || install.stdout);
    const skillPath = ".agents/skills/record-workflow-friction/SKILL.md";
    // Codex comes first among the selected shared runtimes, so the shared copy is adapted for it.
    assert.ok(
      fs.readFileSync(path.join(fixture.workspace, skillPath), "utf8").includes("runtime: codex")
    );
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(state.files.some((file) => file.path === skillPath));

    const dryRun = fixture.run(["update"]);
    assert.strictEqual(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
    assert.ok(dryRun.stdout.includes(`UNCHANGED repository:${skillPath}`), dryRun.stdout);
  } finally {
    fixture.cleanup();
  }
});

test("update without installed state recognizes a legacy Claude protocol copy and keeps it", () => {
  const fixture = createCliFixture(({ workspace, sourceRoot }) => {
    // Earlier installers copied AGENTS.md into .claude/CLAUDE.md; nothing else from Claude remains.
    const legacyProtocol = "# Protocol from an earlier installer\n";
    fs.writeFileSync(path.join(workspace, "AGENTS.md"), legacyProtocol);
    fs.mkdirSync(path.join(workspace, ".claude"), { recursive: true });
    fs.writeFileSync(path.join(workspace, ".claude/CLAUDE.md"), legacyProtocol);
    assert.ok(fs.existsSync(path.join(sourceRoot, ".claude/CLAUDE.project.md")));
  });
  try {
    const apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.ok(apply.stdout.includes("SKIP UNKNOWN repository:.claude/CLAUDE.md"), apply.stdout);
    assert.ok(apply.stdout.includes("is a copy of AGENTS.md from an earlier installer"), apply.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, ".claude/CLAUDE.md"), "utf8"),
      "# Protocol from an earlier installer\n"
    );
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(state.core.runtimes.includes("claude"));
  } finally {
    fixture.cleanup();
  }
});

test("update does not report an edited Claude project file as a legacy copy", () => {
  const fixture = createUpdateFixture("claude");
  try {
    fs.unlinkSync(fixture.statePath);
    fs.writeFileSync(path.join(fixture.workspace, ".claude/CLAUDE.md"), "# Project-owned Claude notes\n");
    const dryRun = fixture.run(["update"]);
    assert.strictEqual(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
    assert.ok(dryRun.stdout.includes("SKIP UNKNOWN repository:.claude/CLAUDE.md"), dryRun.stdout);
    assert.ok(!dryRun.stdout.includes("earlier installer"), dryRun.stdout);
  } finally {
    fixture.cleanup();
  }
});

test("clean coding-standard install includes protocol without legacy artifacts", () => {
  const result = runCli(["--kit", "coding-standard", "--tool", "opencode"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    PROTOCOL_FILES.forEach((relativePath) => {
      assert.ok(
        fs.readFileSync(path.join(result.workspace, relativePath)).equals(
          fs.readFileSync(path.join(SOURCE_ROOT, relativePath))
        ),
        relativePath
      );
    });
    assert.ok(!fs.existsSync(path.join(result.workspace, "docs/ai")));
    assert.ok(!fs.existsSync(path.join(result.workspace, ".pi")));
    assert.ok(!fs.existsSync(path.join(result.workspace, ".claude/commands")));
  } finally {
    result.cleanup();
  }
});

test("coding-standard preserves an existing project protocol file", () => {
  const existingContent = "# Project-owned protocol\n";
  const result = runCli(
    ["--kit", "coding-standard", "--tool", "opencode"],
    ({ workspace }) => {
      fs.writeFileSync(path.join(workspace, "AGENTS.md"), existingContent);
    }
  );
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(result.workspace, "AGENTS.md"), "utf8"),
      existingContent
    );
    assert.ok(result.stdout.includes("Preserving existing project file: AGENTS.md"));
  } finally {
    result.cleanup();
  }
});
test("installer preserves an existing selected skill directory", () => {
  const customSkill = "# Consumer-owned quality-code-check skill\n";
  const result = runCli(
    ["--kit", "coding-standard", "--tool", "codex", "--skill", "quality-code-check"],
    ({ workspace }) => {
      const skillPath = path.join(workspace, ".agents/skills/quality-code-check/SKILL.md");
      fs.mkdirSync(path.dirname(skillPath), { recursive: true });
      fs.writeFileSync(skillPath, customSkill);
    }
  );
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(result.workspace, ".agents/skills/quality-code-check/SKILL.md"), "utf8"),
      customSkill
    );
    assert.ok(result.stdout.includes("Preserving existing skill directory"));
  } finally {
    result.cleanup();
  }
});

test("installer refuses dangling destination symlinks without touching their targets", () => {
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-installer-outside-"));
  const result = runCli(
    ["--kit", "coding-standard", "--tool", "claude"],
    ({ workspace }) => {
      fs.mkdirSync(path.join(workspace, ".claude"), { recursive: true });
      fs.symlinkSync(
        path.join(outside, "missing-statusline.sh"),
        path.join(workspace, ".claude/statusline.sh")
      );
    }
    );
  try {
    assert.notStrictEqual(result.status, 0);
    assert.ok(result.stdout.includes("dangling symlink"));
    assert.ok(fs.lstatSync(path.join(result.workspace, ".claude/statusline.sh")).isSymbolicLink());
    assert.ok(!fs.existsSync(path.join(outside, "missing-statusline.sh")));
  } finally {
    result.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("Claude install does not mutate global settings or statusline", () => {
  const settings = "{\"statusLine\":{\"type\":\"command\",\"command\":\"custom\"}}\\n";
  const statusline = "#!/usr/bin/env bash\\necho custom\\n";
  const result = runCli(
    ["--kit", "coding-standard", "--tool", "claude"],
    ({ home }) => {
      fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
      fs.writeFileSync(path.join(home, ".claude/settings.json"), settings);
      fs.writeFileSync(path.join(home, ".claude/statusline.sh"), statusline);
    }
  );
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.strictEqual(fs.readFileSync(path.join(result.home, ".claude/settings.json"), "utf8"), settings);
    assert.strictEqual(fs.readFileSync(path.join(result.home, ".claude/statusline.sh"), "utf8"), statusline);
  } finally {
    result.cleanup();
  }
});


test("Codex default installs direct instructions without optional skills", () => {
  const result = runCli(["--kit", "coding-standard", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(
      fs.readFileSync(path.join(result.home, ".codex/AGENTS.md")).equals(
        fs.readFileSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.global.md"))
      )
    );
    assert.ok(!fs.existsSync(path.join(result.home, ".claude/CLAUDE.md")));
    assert.ok(!fs.existsSync(path.join(result.workspace, ".agents/skills")));
    assert.ok(!result.stdout.includes("✓ .agents/skills"));
    assert.ok(!fs.existsSync(path.join(result.workspace, ".agents/roles")));
    assert.ok(!fs.existsSync(path.join(result.workspace, ".codex/agents")));
  } finally {
    result.cleanup();
  }
});

test("Codex installs the testing bundle and runtime E2E namespace", () => {
  const result = runCli([
    "--kit",
    "coding-standard",
    "--tool",
    "codex",
    "--bundle",
    "testing",
  ]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const runtimeRoot = path.join(
      result.workspace,
      ".agents/skills/runtime-e2e-test"
    );
    const installedRuntimeSkill = fs.readFileSync(
      path.join(runtimeRoot, "SKILL.md"),
      "utf8"
    );
    assert.ok(
      installedRuntimeSkill.includes(
        ".agents/skills/runtime-e2e-test/references/project-runtime.md"
      )
    );
    assert.ok(fs.existsSync(path.join(runtimeRoot, "validate_test_plan.py")));
    assert.ok(fs.existsSync(path.join(runtimeRoot, "scripts/evidence.py")));
    assert.ok(fs.existsSync(path.join(runtimeRoot, "references/playwright-contract.md")));
    const runtimeReference = path.join(runtimeRoot, "references/project-runtime.md");
    assert.ok(fs.existsSync(runtimeReference));
    assert.ok(fs.readFileSync(runtimeReference, "utf8").includes("- Status: UNCONFIGURED"));
    assert.ok(fs.existsSync(path.join(result.workspace, "docs/testing/README.md")));
    assert.ok(fs.existsSync(path.join(result.workspace, "docs/testing/active/README.md")));
    assert.ok(fs.existsSync(path.join(result.workspace, "docs/testing/completed/README.md")));
  } finally {
    result.cleanup();
  }
});

test("runtime E2E validator rejects a wrong-path PASS and does not count non-proving PASS", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-e2e-plan-"));
  const planPath = path.join(directory, "settled-order.md");
  const validator = path.join(
    SOURCE_ROOT,
    "skills/runtime-e2e-test/validate_test_plan.py"
  );
  const validPlan = `# Runtime E2E Test Plan: Settled order

- Status: COMPLETED
- Run ID: run-2026-01
- Environment: local browser and API
- Tested revisions: web@abc api@def
- Last updated: 2026-01-01T00:00:00Z

## Run summary

- Total: 1
- PASS: 1
- FAIL: 0
- BLOCKED: 0
- NOT_RUN: 0
- INVALIDATED: 0
- Release-blocking PASS: 1/1

## Human sign-off

- Decision: ACCEPTED
- Reviewer: owner
- Date: 2026-01-01
- Notes: Reviewed.

## Case D2 — Assign staff while editing a settled order

- Priority: RELEASE_BLOCKING
- Human judgment: NO

### Runtime path

Order List → Edit → select staff → Save adjustment; observe POST /settled-corrections.

### Expected

The allocation persists after reload without changing totals.

### Execution

- Result: PASS
- Actual path: Order List → Edit → Save adjustment; POST /settled-corrections returned 200.
- Path match: YES
- Observed: Allocation persisted after browser reload; totals were unchanged.
- Evidence: artifacts/d2-after-reload.png; request POST /settled-corrections 200.
- Cleanup: NOT_REQUIRED
- Can-fail: PROVEN
`;

  try {
    fs.writeFileSync(planPath, validPlan);
    const valid = spawnSync(
      "python3",
      [validator, planPath, "--mode", "completion"],
      { encoding: "utf8" }
    );
    assert.strictEqual(valid.status, 0, valid.stderr || valid.stdout);

    fs.writeFileSync(
      planPath,
      validPlan
        .replace(
          "Order List → Edit → Save adjustment; POST /settled-corrections returned 200.",
          "Direct PUT /lines/123/staff-allocations returned 200."
        )
        .replace("- Path match: YES", "- Path match: NO")
    );
    const invalid = spawnSync(
      "python3",
      [validator, planPath, "--mode", "completion"],
      { encoding: "utf8" }
    );
    assert.strictEqual(invalid.status, 1, invalid.stderr || invalid.stdout);
    assert.ok(invalid.stderr.includes("PASS requires Path match: YES"));

    const nonProving = validPlan
      .replace("- Can-fail: PROVEN", "- Can-fail: NON_PROVING")
      .replace("- PASS: 1", "- PASS: 0\n- Non-proving: 1")
      .replace("- Release-blocking PASS: 1/1", "- Release-blocking PASS: 0/1");
    fs.writeFileSync(planPath, nonProving);
    const counted = spawnSync("python3", [validator, planPath, "--mode", "plan"], {
      encoding: "utf8",
    });
    assert.strictEqual(counted.status, 0, counted.stderr || counted.stdout);
    const blocked = spawnSync("python3", [validator, planPath, "--mode", "completion"], {
      encoding: "utf8",
    });
    assert.strictEqual(blocked.status, 1, blocked.stderr || blocked.stdout);
    assert.ok(blocked.stderr.includes("Every release-blocking case must PASS"));
    fs.writeFileSync(planPath, nonProving.replace("- PASS: 0\n- Non-proving: 1", "- PASS: 1"));
    const miscounted = spawnSync("python3", [validator, planPath, "--mode", "plan"], {
      encoding: "utf8",
    });
    assert.strictEqual(miscounted.status, 1, miscounted.stderr || miscounted.stdout);
    assert.ok(miscounted.stderr.includes("Run summary PASS is 1"));
    fs.writeFileSync(planPath, validPlan.replace("- Can-fail: PROVEN\n", ""));
    const unlabeled = spawnSync("python3", [validator, planPath, "--mode", "completion"], {
      encoding: "utf8",
    });
    assert.strictEqual(unlabeled.status, 1, unlabeled.stderr || unlabeled.stdout);
    assert.ok(unlabeled.stderr.includes("PASS requires the generated Can-fail value"));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

const FAKE_PLAYWRIGHT = `import base64, json, os, sys
from pathlib import Path
# Stand-in for Playwright Test: each declared test passes when the app text matches.
app = Path("app.txt").read_text().strip()
tests = json.loads(Path(sys.argv[1]).read_text())
specs = []
for item in tests:
    passed = item["expect"] in ("*", app) and os.environ.get("WEB_PORT") != "dead"
    actual = item["expect"] if passed else app
    if "actual" in item:
        # Per-revision observed values, e.g. a generated ID that differs between the two instances.
        actual = item["actual"]["base" if os.environ.get("WEB_PORT") else "head"]
        passed = actual == item["expect"] and os.environ.get("WEB_PORT") != "dead"
    observed = {"actualPath": "GET /label", "cleanup": "NOT_REQUIRED", "port": os.environ.get("WEB_PORT", ""),
                "now": os.environ.get("FIXED_NOW", ""), "spec": Path("e2e/label.spec.ts").read_text().strip(),
                "checks": [{"id": "label", "source": "fresh API read", "expected": item["expect"], "actual": actual}]}
    attachments = [] if item.get("existing") else [{"name": "runtime-observations", "contentType": "application/json",
                    "body": base64.b64encode(json.dumps(observed).encode()).decode()}]
    results = [{"status": "passed" if passed else "failed", "attachments": attachments,
                **({} if passed else {"error": {"message": f"expected {item['expect']}, got {app}"}})}]
    if item.get("flaky") and not passed:
        results.append({"status": "passed", "attachments": attachments})
    specs.append({"title": item["title"], "file": item.get("file", "case.spec.ts"),
                  "tests": [{"expectedStatus": "passed", "results": results}]})
Path(os.environ["PLAYWRIGHT_JSON_OUTPUT_NAME"]).write_text(json.dumps({"suites": [{"title": "", "specs": specs}], "errors": []}))
sys.exit(0 if all(r["status"] == "passed" for s in specs for t in s["tests"] for r in t["results"]) else 1)
`;

function runtimePlan(ids) {
  const cases = ids
    .map(
      (id) => `## Case ${id} — Label behavior

- Priority: NORMAL
- Human judgment: NO

### Runtime path

GET /label through the running app.

### Expected

The label matches the requested behavior.

### Execution

- Result: NOT_RUN
- Actual path: NOT_RUN
- Path match: NOT_RUN
- Observed: NOT_RUN
- Evidence: NOT_RUN
- Cleanup: NOT_RUN
`
    )
    .join("\n");
  return `# Runtime E2E Test Plan: Label

- Status: READY
- Run ID: NOT_STARTED
- Environment: isolated-local
- Tested revisions: NOT_STARTED
- Last updated: 2026-01-01T00:00:00Z

## Run summary

- Total: ${ids.length}
- PASS: 0
- FAIL: 0
- BLOCKED: 0
- NOT_RUN: ${ids.length}
- INVALIDATED: 0
- Release-blocking PASS: 0/0

## Human sign-off

- Decision: PENDING
- Reviewer: —
- Date: —
- Notes: —

${cases}`;
}

function createBaseHeadFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-e2e-base-head-"));
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.strictEqual(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git("init", "-q");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  fs.writeFileSync(path.join(root, "app.txt"), "old\n");
  fs.mkdirSync(path.join(root, "e2e"));
  fs.writeFileSync(path.join(root, "e2e/label.spec.ts"), "base spec\n");
  git("add", ".");
  git("commit", "-qm", "base");
  const base = git("rev-parse", "HEAD");
  fs.writeFileSync(path.join(root, "app.txt"), "new\n");
  fs.writeFileSync(path.join(root, "e2e/label.spec.ts"), "head spec\n");
  git("commit", "-qam", "head");
  fs.mkdirSync(path.join(root, "tests"));
  fs.writeFileSync(path.join(root, "tests/runner.py"), FAKE_PLAYWRIGHT);
  fs.writeFileSync(
    path.join(root, "tests/cases.json"),
    JSON.stringify([
      { title: "[E2E-01] shows the new label", expect: "new" },
      { title: "[E2E-02] label endpoint responds", expect: "*" },
      { title: "renders a label", file: "e2e/label.spec.ts", expect: "*", existing: true },
    ])
  );
  fs.mkdirSync(path.join(root, "docs/testing/active"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs/testing/active/label.md"),
    runtimePlan(["E2E-01", "E2E-02", "PR-01"])
  );
  const check = { id: "label", expected: "label", source: "fresh API read" };
  const suite = {
    plan: "docs/testing/active/label.md",
    files: ["tests/runner.py", "tests/cases.json", "e2e/label.spec.ts"],
    command: ["python3", "tests/runner.py", "tests/cases.json"],
    environment: "isolated-local",
    revision: "head",
    base: { revision: base, env: { WEB_PORT: "5301" } },
    cases: [
      { id: "E2E-01", kind: "api", classification: "new-behavior", checks: [check] },
      { id: "E2E-02", kind: "api", classification: "invariant", checks: [check] },
      { id: "PR-01", kind: "pr-test", test: { file: "e2e/label.spec.ts", title: "renders a label" } },
    ],
  };
  const suitePath = path.join(root, "docs/testing/active/label.suite.json");
  const evidence = path.join(SOURCE_ROOT, "skills/runtime-e2e-test/scripts/evidence.py");
  const run = (args) => spawnSync("python3", [evidence, ...args, "--root", root], { cwd: root, encoding: "utf8" });
  return {
    root,
    base,
    validate(mutate) {
      const data = JSON.parse(JSON.stringify(suite));
      mutate(data);
      fs.writeFileSync(suitePath, JSON.stringify(data, null, 2));
      return run(["validate", suitePath]);
    },
    writeCases(cases) {
      fs.writeFileSync(path.join(root, "tests/cases.json"), JSON.stringify(cases));
    },
    run(mutate, name) {
      const data = JSON.parse(JSON.stringify(suite));
      if (mutate) mutate(data);
      fs.writeFileSync(suitePath, JSON.stringify(data, null, 2));
      const approved = run(["approve", suitePath, "--reviewer", "owner"]);
      assert.strictEqual(approved.status, 0, approved.stderr);
      const out = path.join(root, ".runtime-e2e", name);
      const result = run(["run", suitePath, "--out", out]);
      const results = fs.existsSync(path.join(out, "results.json"))
        ? JSON.parse(fs.readFileSync(path.join(out, "results.json"), "utf8"))
        : null;
      return { ...result, out, results };
    },
    audit(out) {
      return spawnSync("python3", [evidence, "audit", out], { encoding: "utf8" });
    },
    cleanup() {
      fs.rmSync(root, { recursive: true, force: true });
    },
  };
}

function proofs(results) {
  return Object.fromEntries(results.cases.map((row) => [row.caseId, row.proof]));
}

test("runtime E2E base run proves new-behavior cases can fail", () => {
  const fixture = createBaseHeadFixture();
  try {
    const run = fixture.run(null, "with-base");
    assert.strictEqual(run.status, 1, run.stderr || run.stdout);
    // Exit 1 is consistent evidence with an unresolved case, not a failed audit.
    assert.ok(run.stdout.includes("Audit: evidence consistent; unresolved: PR-01"), run.stdout);
    assert.deepStrictEqual(proofs(run.results), {
      "E2E-01": "PROVEN",
      "E2E-02": "NOT_REQUIRED",
      "PR-01": "NON_PROVING",
    });
    assert.deepStrictEqual(
      run.results.cases.map((row) => [row.result, row.baseResult]),
      [["PASS", "FAIL"], ["PASS", "PASS"], ["PASS", "PASS"]]
    );
    assert.strictEqual(run.results.base.gitHead, fixture.base);
    assert.strictEqual(run.results.base.degraded, null);
    assert.ok(run.stdout.includes("Non-proving PASS: PR-01"));

    const observed = (out, file) => {
      const native = JSON.parse(fs.readFileSync(path.join(out, file), "utf8"));
      const body = native.suites[0].specs[0].tests[0].results[0].attachments[0].body;
      return JSON.parse(Buffer.from(body, "base64").toString("utf8"));
    };
    assert.strictEqual(observed(run.out, "base/native.json").port, "5301");
    assert.strictEqual(observed(run.out, "native.json").port, "");
    assert.strictEqual(observed(run.out, "base/native.json").spec, "head spec");
    const baseManifest = JSON.parse(fs.readFileSync(path.join(run.out, "base/run-manifest.json"), "utf8"));
    assert.notStrictEqual(baseManifest.projectRoot, fixture.root);
    assert.ok(!fs.existsSync(baseManifest.projectRoot), "base worktree is removed after the run");
    assert.strictEqual(baseManifest.worktreeCleanup, "COMPLETE");
    assert.ok(run.results.cases[0].proofReason.includes("expected new, got old"));

    const kept = fixture.run((suite) => {
      suite.base.keep = ["e2e/label.spec.ts"];
    }, "base-keeps-file");
    assert.strictEqual(kept.status, 1, kept.stderr || kept.stdout);
    assert.strictEqual(observed(kept.out, "base/native.json").spec, "base spec");

    const resultsPath = path.join(run.out, "results.json");
    const tampered = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    tampered.cases[2].proof = "PROVEN";
    fs.writeFileSync(resultsPath, JSON.stringify(tampered, null, 2) + "\n");
    const integrityPath = path.join(run.out, "integrity.json");
    const integrity = JSON.parse(fs.readFileSync(integrityPath, "utf8"));
    integrity["results.json"] = require("crypto")
      .createHash("sha256")
      .update(fs.readFileSync(resultsPath))
      .digest("hex");
    fs.writeFileSync(integrityPath, JSON.stringify(integrity, null, 2) + "\n");
    const audit = fixture.audit(run.out);
    assert.strictEqual(audit.status, 2, audit.stderr || audit.stdout);
    assert.ok(audit.stderr.includes("Generated report disagrees"));
  } finally {
    fixture.cleanup();
  }
});

test("runtime E2E validator checks the ledger's run identity and time against the bundle", () => {
  const fixture = createBaseHeadFixture();
  const validator = path.join(SOURCE_ROOT, "skills/runtime-e2e-test/validate_test_plan.py");
  const planPath = path.join(fixture.root, "docs/testing/active/ledger.md");
  try {
    const run = fixture.run(null, "ledger-identity");
    const manifest = JSON.parse(fs.readFileSync(path.join(run.out, "run-manifest.json"), "utf8"));
    const ledger = (fields) => {
      const values = {
        runId: manifest.runId,
        revisions: `head ${manifest.gitHead.slice(0, 7)}; base ${fixture.base.slice(0, 7)}`,
        updated: new Date().toISOString(),
        result: "PASS",
        actualPath: "GET /label",
        canFail: "PROVEN",
        supporting: "",
        ...fields,
      };
      fs.writeFileSync(
        planPath,
        runtimePlan(["E2E-01"])
          .replace("- Run ID: NOT_STARTED", `- Run ID: ${values.runId}`)
          .replace("- Tested revisions: NOT_STARTED", `- Tested revisions: ${values.revisions}`)
          .replace("- Last updated: 2026-01-01T00:00:00Z", `- Last updated: ${values.updated}`)
          .replace(`- PASS: 0\n`, `- ${values.result}: 1\n`)
          .replace(`- NOT_RUN: 1\n`, `- NOT_RUN: 0\n`)
          .replace("## Human sign-off", `${values.supporting}## Human sign-off`)
          .replace("- Result: NOT_RUN", `- Result: ${values.result}`)
          .replace("- Actual path: NOT_RUN", `- Actual path: ${values.actualPath}`)
          .replace("- Path match: NOT_RUN", "- Path match: YES")
          .replace("- Observed: NOT_RUN", "- Observed: label=new")
          .replace("- Evidence: NOT_RUN", "- Evidence: results.json")
          .replace("- Cleanup: NOT_RUN", `- Cleanup: NOT_REQUIRED\n- Can-fail: ${values.canFail}`)
      );
      return spawnSync("python3", [validator, planPath, "--bundle", run.out], { encoding: "utf8" });
    };

    const valid = ledger({});
    assert.strictEqual(valid.status, 0, valid.stderr || valid.stdout);

    const wrongId = ledger({ runId: "03ab87b8" });
    assert.strictEqual(wrongId.status, 1);
    assert.ok(wrongId.stderr.includes(`the bundle recorded '${manifest.runId}'`));

    const noBase = ledger({ revisions: `head ${manifest.gitHead.slice(0, 7)}` });
    assert.strictEqual(noBase.status, 1);
    assert.ok(noBase.stderr.includes(`recorded base commit ${fixture.base.slice(0, 7)}`));

    const beforeRun = ledger({ updated: manifest.startedAt.replace(/^\d{4}/, "2020") });
    assert.strictEqual(beforeRun.status, 1);
    assert.ok(beforeRun.stderr.includes("is before the run finished"));

    const unzoned = ledger({ updated: "2026-10-28 02:00" });
    assert.strictEqual(unzoned.status, 1);
    assert.ok(unzoned.stderr.includes("must be an ISO 8601 time with a zone"));

    const manifestPath = path.join(run.out, "run-manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, finishedAt: undefined }));
    const unfinished = ledger({});
    assert.strictEqual(unfinished.status, 1);
    assert.ok(unfinished.stderr.includes("the run did not complete"));
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));

    const partialSha = ledger({ revisions: `head x${manifest.gitHead.slice(0, 7)}; base ${fixture.base.slice(0, 7)}` });
    assert.strictEqual(partialSha.status, 1);
    assert.ok(partialSha.stderr.includes("recorded head commit"));

    const wrongResult = ledger({ result: "FAIL" });
    assert.strictEqual(wrongResult.status, 1);
    assert.ok(wrongResult.stderr.includes("Result is FAIL, but the bundle recorded PASS"));

    const wrongProof = ledger({ canFail: "NOT_PROVEN" });
    assert.strictEqual(wrongProof.status, 1);
    assert.ok(wrongProof.stderr.includes("Can-fail is NOT_PROVEN, but the bundle recorded PROVEN"));

    const templatedPath = ledger({ actualPath: "GET /label through the running app" });
    assert.strictEqual(templatedPath.status, 1);
    assert.ok(templatedPath.stderr.includes("must be the recorded path 'GET /label'"));

    const supported = ledger({ supporting: "## Supporting checks\n\n- `npm test`: PASS — 12 passed\n- `npm run lint`: NOT_RUN — no lint config\n\n" });
    assert.strictEqual(supported.status, 0, supported.stderr || supported.stdout);

    const unrun = ledger({ supporting: "## Supporting checks\n\n- `npm test`: NOT_RUN\n\n" });
    assert.strictEqual(unrun.status, 1);
    assert.ok(unrun.stderr.includes("'`npm test`' was not run; state why"));

    const prose = ledger({ supporting: "## Supporting checks\n\n- `npm test` supports the PR's unit tests\n\n" });
    assert.strictEqual(prose.status, 1);
    assert.ok(prose.stderr.includes("must read '- <check>: PASS|FAIL|NOT_RUN"));

    // The future check needs no bundle: an estimated, rounded-up time is rejected on its own.
    const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    fs.writeFileSync(planPath, runtimePlan(["E2E-01"]).replace("2026-01-01T00:00:00Z", future));
    const ahead = spawnSync("python3", [validator, planPath], { encoding: "utf8" });
    assert.strictEqual(ahead.status, 1);
    assert.ok(ahead.stderr.includes("is in the future"));
  } finally {
    fixture.cleanup();
  }
});

test("runtime E2E labels cases without a usable base as not proven", () => {
  const fixture = createBaseHeadFixture();
  try {
    const none = fixture.run((suite) => delete suite.base, "no-base");
    assert.strictEqual(none.status, 0, none.stderr || none.stdout);
    assert.strictEqual(none.results.base, null);
    assert.strictEqual(proofs(none.results)["E2E-01"], "NOT_PROVEN");
    assert.strictEqual(proofs(none.results)["PR-01"], "NOT_PROVEN");

    const failedSetup = fixture.run((suite) => {
      suite.base.setup = [["python3", "-c", "import sys; sys.exit(3)"]];
    }, "base-setup-fails");
    assert.strictEqual(failedSetup.status, 0, failedSetup.stderr || failedSetup.stdout);
    assert.ok(failedSetup.results.base.degraded.includes("exited 3"));
    assert.strictEqual(proofs(failedSetup.results)["E2E-01"], "NOT_PROVEN");
    assert.ok(failedSetup.stdout.includes("Base run: DEGRADED"));

    const noEnv = fixture.validate((suite) => delete suite.base.env);
    assert.strictEqual(noEnv.status, 2);
    assert.ok(noEnv.stderr.includes("base env must give the base instance its own ports and data"));
    const onlyPrTests = fixture.validate((suite) => {
      suite.cases = suite.cases.filter((item) => item.kind === "pr-test");
    });
    assert.strictEqual(onlyPrTests.status, 2);
    assert.ok(onlyPrTests.stderr.includes("at least one runtime case"));
    const unlistedPrTest = fixture.validate((suite) => {
      suite.files = suite.files.filter((name) => name !== "e2e/label.spec.ts");
    });
    assert.strictEqual(unlistedPrTest.status, 2);
    assert.ok(unlistedPrTest.stderr.includes("pr-test files must be listed in files"));

    fixture.writeCases([
      { title: "[E2E-01] shows the new label", expect: "new", flaky: true },
      { title: "[E2E-02] label endpoint responds", expect: "*" },
      { title: "renders a label", file: "e2e/label.spec.ts", expect: "*", existing: true },
    ]);
    const flaky = fixture.run((suite) => {
      suite.cases[2].classification = "invariant";
    }, "flaky-base");
    assert.strictEqual(flaky.status, 0, flaky.stderr || flaky.stdout);
    assert.strictEqual(proofs(flaky.results)["E2E-01"], "NOT_PROVEN");
    assert.ok(flaky.results.cases[0].proofReason.includes("flaky on base"));

    const deadBase = fixture.run((suite) => {
      suite.base.env.WEB_PORT = "dead";
      suite.base.setup = [["python3", "-c", "import os, sys; sys.exit(os.environ['WEB_PORT'] != 'dead')"]];
    }, "base-not-running");
    assert.strictEqual(deadBase.status, 0, deadBase.stderr || deadBase.stdout);
    assert.deepStrictEqual(deadBase.results.base.degraded, "No invariant case passed on base; the base runtime may not have run");
    assert.strictEqual(proofs(deadBase.results)["E2E-01"], "NOT_PROVEN");

    const invariantOnly = fixture.run((suite) => {
      suite.cases.forEach((item) => (item.classification = "invariant"));
    }, "invariant-only");
    assert.strictEqual(invariantOnly.status, 0, invariantOnly.stderr || invariantOnly.stdout);

    const missing = fixture.run((suite) => {
      suite.base.revision = "does-not-exist";
    }, "base-missing");
    assert.strictEqual(missing.status, 0, missing.stderr || missing.stdout);
    assert.ok(missing.results.base.degraded.includes("cannot be resolved"));
    assert.strictEqual(fixture.audit(missing.out).status, 0);
  } finally {
    fixture.cleanup();
  }
});

test("runtime E2E applies determinism settings and normalizes base comparisons", () => {
  const fixture = createBaseHeadFixture();
  const observed = (out, file, index = 0) => {
    const native = JSON.parse(fs.readFileSync(path.join(out, file), "utf8"));
    const body = native.suites[0].specs[index].tests[0].results[0].attachments[0].body;
    return JSON.parse(Buffer.from(body, "base64").toString("utf8"));
  };
  const determinism = {
    env: { FIXED_NOW: "2026-01-01T00:00:00Z" },
    normalize: [{ pattern: "order-[0-9]+", replacement: "order-<ID>" }],
    limits: ["Browser randomness is not stubbed"],
  };
  try {
    const undeclared = fixture.run(null, "no-determinism");
    assert.ok(undeclared.stdout.includes("Determinism: not declared"));
    assert.deepStrictEqual(undeclared.results.cases[0].baseDiff, [{ id: "label", base: "old", head: "new" }]);
    assert.ok(undeclared.stdout.includes('Base diff after normalization: label: base "old" vs head "new"'));
    assert.deepStrictEqual(undeclared.results.cases[1].baseDiff, []);
    assert.ok(!("baseDiff" in undeclared.results.cases[2]), "pr-test cases have no observations to diff");

    fixture.writeCases([
      { title: "[E2E-01] shows the new label", expect: "order-7", actual: { head: "order-7", base: "order-9" } },
      { title: "[E2E-02] label endpoint responds", expect: "*" },
      { title: "renders a label", file: "e2e/label.spec.ts", expect: "*", existing: true },
    ]);
    const noisy = fixture.run((suite) => {
      suite.cases[2].classification = "invariant";
    }, "id-noise-only");
    assert.strictEqual(proofs(noisy.results)["E2E-01"], "PROVEN", "without normalization the raw ID difference counts");

    const normalized = fixture.run((suite) => {
      suite.cases[2].classification = "invariant";
      suite.determinism = determinism;
    }, "id-noise-normalized");
    assert.strictEqual(normalized.status, 0, normalized.stderr || normalized.stdout);
    assert.strictEqual(proofs(normalized.results)["E2E-01"], "NOT_PROVEN");
    assert.ok(normalized.results.cases[0].proofReason.includes("base differs only in normalized values (label)"));
    assert.deepStrictEqual(normalized.results.cases[0].baseDiff, []);
    assert.strictEqual(observed(normalized.out, "native.json").now, "2026-01-01T00:00:00Z");
    assert.strictEqual(observed(normalized.out, "base/native.json").now, "2026-01-01T00:00:00Z");
    assert.ok(normalized.stdout.includes("Determinism env: FIXED_NOW; normalization rules: 1"));
    assert.ok(normalized.stdout.includes("Determinism limits: Browser randomness is not stubbed"));
    assert.strictEqual(fixture.audit(normalized.out).status, 0);

    const overridden = fixture.validate((suite) => {
      suite.determinism = { env: { WEB_PORT: "5301" } };
    });
    assert.strictEqual(overridden.status, 2);
    assert.ok(overridden.stderr.includes("base env must not override determinism env"));
    const badPattern = fixture.validate((suite) => {
      suite.determinism = { normalize: [{ pattern: "(", replacement: "" }] };
    });
    assert.strictEqual(badPattern.status, 2);
    assert.ok(badPattern.stderr.includes("Invalid normalize rule"));
    const badReplacement = fixture.validate((suite) => {
      suite.determinism = { normalize: [{ pattern: "order-[0-9]+", replacement: "\\9" }] };
    });
    assert.strictEqual(badReplacement.status, 2);
    assert.ok(badReplacement.stderr.includes("Invalid normalize rule"), badReplacement.stderr);
  } finally {
    fixture.cleanup();
  }
});

test("Claude selection installs only missing Claude global instructions", () => {
  const result = runCli(["--kit", "coding-standard", "--tool", "claude"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(
      fs.readFileSync(path.join(result.home, ".claude/CLAUDE.md")).equals(
        fs.readFileSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.global.md"))
      )
    );
    assert.ok(
      fs.readFileSync(path.join(result.workspace, ".claude/CLAUDE.md")).equals(
        fs.readFileSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.project.md"))
      )
    );
    assert.ok(!fs.existsSync(path.join(result.home, ".codex/AGENTS.md")));
  } finally {
    result.cleanup();
  }
});

test("coding-standard preserves divergent global instructions", () => {
  const codexContent = "# Existing Codex instructions\n";
  const claudeContent = "# Existing Claude instructions\n";
  const result = runCli(
    ["--kit", "coding-standard", "--all"],
    ({ home }) => {
      fs.mkdirSync(path.join(home, ".codex"), { recursive: true });
      fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
      fs.writeFileSync(path.join(home, ".codex/AGENTS.md"), codexContent);
      fs.writeFileSync(path.join(home, ".claude/CLAUDE.md"), claudeContent);
    }
  );
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(result.home, ".codex/AGENTS.md"), "utf8"),
      codexContent
    );
    assert.strictEqual(
      fs.readFileSync(path.join(result.home, ".claude/CLAUDE.md"), "utf8"),
      claudeContent
    );
    assert.ok(
      result.stdout.includes("Preserving existing global instructions: ~/.codex/AGENTS.md")
    );
    assert.ok(
      result.stdout.includes("Preserving existing global instructions: ~/.claude/CLAUDE.md")
    );
  } finally {
    result.cleanup();
  }
});

test("global instructions keep the legacy context while Claude project scope uses the current protocol", () => {
  const result = runCli(["--kit", "coding-standard", "--all"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const legacyGlobal = fs.readFileSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.global.md"));
    const currentProject = fs.readFileSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.project.md"));
    assert.ok(fs.readFileSync(path.join(result.home, ".codex/AGENTS.md")).equals(legacyGlobal));
    assert.ok(fs.readFileSync(path.join(result.home, ".claude/CLAUDE.md")).equals(legacyGlobal));
    assert.ok(fs.readFileSync(path.join(result.workspace, ".claude/CLAUDE.md")).equals(currentProject));
  } finally {
    result.cleanup();
  }
});

test("install records managed hashes and update dry-run writes nothing", () => {
  const fixture = createUpdateFixture();
  try {
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.strictEqual(state.schemaVersion, 2);
    assert.strictEqual(state.packageVersion, require("../package.json").version);
    assert.strictEqual(state.core.id, "repository-driven-protocol");
    assert.deepStrictEqual(state.core.runtimes, ["opencode"]);
    assert.deepStrictEqual(state.core.skills, []);
    assert.deepStrictEqual(state.addons, []);
    assert.deepStrictEqual(state.kits, ["coding-standard"]);
    assert.deepStrictEqual(state.runtimes, ["opencode"]);
    assert.deepStrictEqual(state.skills, []);
    assert.ok(state.files.length > 0);
    state.files.forEach((file) => {
      assert.ok(["repository", "codex-global", "claude-global"].includes(file.scope));
      assert.match(file.hash, /^sha256:[a-f0-9]{64}$/);
    });

    const workspaceBefore = snapshotFiles(fixture.workspace);
    const homeBefore = snapshotFiles(fixture.home);
    const dryRun = fixture.run(["update"]);
    assert.strictEqual(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
    assert.ok(dryRun.stdout.includes("Dry run:"));
    assert.deepStrictEqual(snapshotFiles(fixture.workspace), workspaceBefore);
    assert.deepStrictEqual(snapshotFiles(fixture.home), homeBefore);
  } finally {
    fixture.cleanup();
  }
});

test("update applies safe changes and preserves local collisions", () => {
  const fixture = createUpdateFixture();
  try {
    const upstreamAgents = "# Updated upstream protocol\n";
    const localWorkflow = "# Locally customized workflow\n";
    fs.writeFileSync(path.join(fixture.sourceRoot, "AGENTS.md"), upstreamAgents);
    fs.writeFileSync(path.join(fixture.sourceRoot, "docs/WORKFLOW.md"), "# New upstream workflow\n");
    fs.writeFileSync(path.join(fixture.workspace, "docs/WORKFLOW.md"), localWorkflow);

    const beforeDryRun = snapshotFiles(fixture.workspace);
    const dryRun = fixture.run(["update"]);
    assert.strictEqual(dryRun.status, 0, dryRun.stderr || dryRun.stdout);
    assert.ok(dryRun.stdout.includes("UPDATE repository:AGENTS.md"));
    assert.ok(dryRun.stdout.includes("SKIP LOCAL repository:docs/WORKFLOW.md"));
    assert.deepStrictEqual(snapshotFiles(fixture.workspace), beforeDryRun);

    const apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.strictEqual(fs.readFileSync(path.join(fixture.workspace, "AGENTS.md"), "utf8"), upstreamAgents);
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "docs/WORKFLOW.md"), "utf8"),
      localWorkflow
    );
  } finally {
    fixture.cleanup();
  }
});

test("update retires coder files and warns when locally merged coder hooks remain", () => {
  const fixture = createUpdateFixture("claude");
  try {
    const hash = require("../lib/update").hashBytes;
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    ["SKILL.md", "scripts/stop-gate.js"].forEach((name) => {
      const target = path.join(fixture.workspace, ".claude/skills/coder", name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, `legacy ${name}\n`);
      state.files.push({
        scope: "repository",
        path: `.claude/skills/coder/${name}`,
        hash: hash(Buffer.from(`legacy ${name}\n`)),
      });
    });
    fs.writeFileSync(fixture.statePath, `${JSON.stringify(state, null, 2)}\n`);
    const settingsPath = path.join(fixture.workspace, ".claude/settings.json");
    const merged = `${fs.readFileSync(settingsPath, "utf8")}\n`;
    fs.writeFileSync(settingsPath, merged);

    const apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.ok(apply.stdout.includes("RETIRE repository:.claude/skills/coder/SKILL.md"));
    assert.ok(!fs.existsSync(path.join(fixture.workspace, ".claude/skills/coder/scripts/stop-gate.js")));
    assert.strictEqual(fs.readFileSync(settingsPath, "utf8"), merged);
    assert.ok(apply.stdout.includes("WARNING: the coder skill was retired"), apply.stdout);
  } finally {
    fixture.cleanup();
  }
});

test("update retires coder files and leaves unmodified Claude settings without coder hooks", () => {
  const fixture = createUpdateFixture("claude");
  try {
    const hash = require("../lib/update").hashBytes;
    const settingsPath = path.join(fixture.workspace, ".claude/settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    const coderHooks = {
      SessionStart: [{ hooks: [{ type: "command", command: 'node "$CLAUDE_PROJECT_DIR/.claude/skills/coder/scripts/session-start.js"' }] }],
    };
    const installedBytes = Buffer.from(`${JSON.stringify({ ...settings, hooks: coderHooks }, null, 2)}\n`);
    fs.writeFileSync(settingsPath, installedBytes);
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    state.files.find((file) => file.path === ".claude/settings.json").hash = hash(installedBytes);
    const scriptPath = path.join(fixture.workspace, ".claude/skills/coder/scripts/session-start.js");
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
    fs.writeFileSync(scriptPath, "legacy\n");
    state.files.push({ scope: "repository", path: ".claude/skills/coder/scripts/session-start.js", hash: hash(Buffer.from("legacy\n")) });
    fs.writeFileSync(fixture.statePath, `${JSON.stringify(state, null, 2)}\n`);

    const apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.ok(apply.stdout.includes("UPDATE repository:.claude/settings.json"), apply.stdout);
    assert.ok(apply.stdout.includes("RETIRE repository:.claude/skills/coder/scripts/session-start.js"));
    assert.ok(!fs.existsSync(scriptPath));
    assert.ok(!fs.readFileSync(settingsPath, "utf8").includes("coder"));
    assert.ok(!apply.stdout.includes("WARNING: the coder skill was retired"));
  } finally {
    fixture.cleanup();
  }
});

test("update preserves pre-hard-cut legacy files", () => {
  const fixture = createUpdateFixture();
  try {
    const legacyPath = "docs/ai/workflows/feature-standard.json";
    const legacyTarget = path.join(fixture.workspace, legacyPath);
    const legacyBytes = "{\"legacy\":true}\n";
    fs.mkdirSync(path.dirname(legacyTarget), { recursive: true });
    fs.writeFileSync(legacyTarget, legacyBytes);
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    state.files.push({
      scope: "repository",
      path: legacyPath,
      hash: require("../lib/update").hashBytes(Buffer.from(legacyBytes)),
    });
    fs.writeFileSync(fixture.statePath, `${JSON.stringify(state, null, 2)}\n`);

    const apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.ok(apply.stdout.includes(`PRESERVE LEGACY repository:${legacyPath}`));
    assert.strictEqual(fs.readFileSync(legacyTarget, "utf8"), legacyBytes);
    const nextState = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(nextState.files.some((file) => file.path === legacyPath));
  } finally {
    fixture.cleanup();
  }
});

test("update without installed state does not adopt pre-existing exact files", () => {
  const fixture = createUpdateFixture();
  try {
    const divergent = "# Consumer-owned workflow\n";
    fs.unlinkSync(fixture.statePath);
    fs.unlinkSync(path.join(fixture.workspace, "docs/README.md"));
    fs.writeFileSync(path.join(fixture.workspace, "docs/WORKFLOW.md"), divergent);

    const apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.ok(apply.stdout.includes("SKIP UNKNOWN repository:AGENTS.md"));
    assert.ok(apply.stdout.includes("ADD repository:docs/README.md"));
    assert.ok(apply.stdout.includes("SKIP UNKNOWN repository:docs/WORKFLOW.md"));
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "docs/WORKFLOW.md"), "utf8"),
      divergent
    );
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(state.files.some((file) => file.path === "docs/README.md"));
    assert.ok(!state.files.some((file) => file.path === "AGENTS.md"));
    assert.ok(!state.files.some((file) => file.path === "docs/WORKFLOW.md"));
  } finally {
    fixture.cleanup();
  }
});

test("update rerun completes safely after file operations outpace installed state", () => {
  const fixture = createUpdateFixture();
  try {
    const upstreamAgents = "# Interrupted update agents\n";
    const upstreamDocsReadme = "# Interrupted update docs\n";
    fs.writeFileSync(path.join(fixture.sourceRoot, "AGENTS.md"), upstreamAgents);
    fs.writeFileSync(path.join(fixture.sourceRoot, "docs/README.md"), upstreamDocsReadme);

    // This is the observable state left when a file rename succeeds before state is replaced.
    fs.writeFileSync(path.join(fixture.workspace, "AGENTS.md"), upstreamAgents);
    const apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.ok(apply.stdout.includes("UNCHANGED repository:AGENTS.md"));
    assert.ok(apply.stdout.includes("UPDATE repository:docs/README.md"));
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "docs/README.md"), "utf8"),
      upstreamDocsReadme
    );

    const rerun = fixture.run(["update", "--apply"]);
    assert.strictEqual(rerun.status, 0, rerun.stderr || rerun.stdout);
    assert.ok(!rerun.stdout.includes("UPDATE repository:"));
    assert.ok(!rerun.stdout.includes("ADD repository:"));
    assert.ok(!rerun.stdout.includes("RETIRE repository:"));
  } finally {
    fixture.cleanup();
  }
});
test("update rejects dangling managed-path symlinks", () => {
  const fixture = createUpdateFixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-dangling-outside-"));
  try {
    const target = path.join(fixture.workspace, "docs/WORKFLOW.md");
    fs.unlinkSync(target);
    fs.symlinkSync(path.join(outside, "missing-workflow.md"), target);

    const result = fixture.run(["update", "--apply"]);
    assert.notStrictEqual(result.status, 0);
    assert.ok(result.stdout.includes("dangling symlink"));
    assert.ok(fs.lstatSync(target).isSymbolicLink());
  } finally {
    fixture.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("update rejects invalid, absolute, traversal, and symlink-escape state paths", () => {
  const fixture = createUpdateFixture();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-outside-"));
  try {
    const original = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    const writeState = (state) => {
      fs.writeFileSync(fixture.statePath, `${JSON.stringify(state, null, 2)}\n`);
    };
    const withFirstPath = (filePath) => ({
      ...original,
      files: [{ ...original.files[0], path: filePath }, ...original.files.slice(1)],
    });

    writeState(withFirstPath("/tmp/absolute"));
    let result = fixture.run(["update"]);
    assert.notStrictEqual(result.status, 0);
    assert.ok(result.stdout.includes("Unsafe managed path"));

    writeState(withFirstPath("../traversal"));
    result = fixture.run(["update"]);
    assert.notStrictEqual(result.status, 0);
    assert.ok(result.stdout.includes("Unsafe managed path"));

    writeState({
      ...original,
      files: [{ ...original.files[0], hash: "not-a-hash" }, ...original.files.slice(1)],
    });
    result = fixture.run(["update"]);
    assert.notStrictEqual(result.status, 0);
    assert.ok(result.stdout.includes("Invalid installed hash"));

    fs.writeFileSync(path.join(outside, "owned.txt"), "outside\n");
    writeState(original);
    const docsReal = path.join(fixture.workspace, "docs");
    fs.renameSync(docsReal, `${docsReal}-real`);
    fs.symlinkSync(outside, docsReal);
    fs.writeFileSync(path.join(outside, "WORKFLOW.md"), "outside\n");
    result = fixture.run(["update"]);
    assert.notStrictEqual(result.status, 0);
    assert.ok(result.stdout.includes("through a symlink"));
    assert.strictEqual(fs.readFileSync(path.join(outside, "WORKFLOW.md"), "utf8"), "outside\n");
  } finally {
    fixture.cleanup();
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("update touches global instructions only for selected tracked runtimes", () => {
  const fixture = createUpdateFixture("claude");
  try {
    const claudePath = path.join(fixture.home, ".claude/CLAUDE.md");
    const codexPath = path.join(fixture.home, ".codex/AGENTS.md");
    const unselectedBytes = "# Unselected Codex instructions\n";
    const statuslineSource = path.join(fixture.sourceRoot, ".claude/statusline.sh");
    const statuslineTarget = path.join(fixture.workspace, ".claude/statusline.sh");
    fs.mkdirSync(path.dirname(codexPath), { recursive: true });
    fs.writeFileSync(codexPath, unselectedBytes);
    fs.writeFileSync(
      path.join(fixture.sourceRoot, ".claude/CLAUDE.global.md"),
      "# Selected update\n"
    );
    fs.writeFileSync(statuslineSource, "#!/usr/bin/env bash\nexit 0\n");
    fs.chmodSync(statuslineSource, 0o755);

    let apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.strictEqual(fs.readFileSync(claudePath, "utf8"), "# Selected update\n");
    assert.strictEqual(fs.readFileSync(codexPath, "utf8"), unselectedBytes);
    assert.ok(!apply.stdout.includes("codex-global"));
    assert.strictEqual(
      fs.readFileSync(statuslineTarget, "utf8"),
      "#!/usr/bin/env bash\nexit 0\n"
    );
    assert.strictEqual(fs.statSync(statuslineTarget).mode & 0o111, 0o111);

    const localClaudeBytes = "# Locally changed Claude instructions\n";
    fs.writeFileSync(claudePath, localClaudeBytes);
    fs.writeFileSync(
      path.join(fixture.sourceRoot, ".claude/CLAUDE.global.md"),
      "# Another update\n"
    );
    apply = fixture.run(["update", "--apply"]);
    assert.strictEqual(apply.status, 0, apply.stderr || apply.stdout);
    assert.ok(apply.stdout.includes("SKIP LOCAL claude-global:CLAUDE.md"));
    assert.strictEqual(fs.readFileSync(claudePath, "utf8"), localClaudeBytes);
    assert.strictEqual(fs.readFileSync(codexPath, "utf8"), unselectedBytes);
  } finally {
    fixture.cleanup();
  }
});

test("workflow-eval composes with an existing protocol install", () => {
  const fixture = createUpdateFixture("opencode");
  try {
    const installEval = fixture.run(["--kit", "workflow-eval", "--tool", "codex"]);
    assert.strictEqual(installEval.status, 0, installEval.stderr || installEval.stdout);
    let state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.deepStrictEqual(state.kits, ["coding-standard", "workflow-eval"]);
    assert.deepStrictEqual(state.core.runtimes, ["codex", "opencode"]);
    assert.deepStrictEqual(state.addons.map((addon) => addon.id), ["evaluation"]);
    assert.deepStrictEqual(state.addons[0].runtimes, ["codex"]);
    assert.ok(state.files.some((file) => file.path === "docs/evaluation/STANDARD.md"));
    assert.ok(state.files.some((file) => file.path === ".codex/config.toml"));

    fs.writeFileSync(path.join(fixture.sourceRoot, "AGENTS.md"), "# Composed protocol update\n");
    fs.writeFileSync(
      path.join(fixture.sourceRoot, "docs/evaluation/STANDARD.md"),
      "# Composed evaluation update\n"
    );
    const update = fixture.run(["update", "--apply"]);
    assert.strictEqual(update.status, 0, update.stderr || update.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "AGENTS.md"), "utf8"),
      "# Composed protocol update\n"
    );
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "docs/evaluation/STANDARD.md"), "utf8"),
      "# Composed evaluation update\n"
    );
    state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.deepStrictEqual(state.kits, ["coding-standard", "workflow-eval"]);
  } finally {
    fixture.cleanup();
  }
});

test("learning-workflow composes with an existing protocol install", () => {
  const fixture = createUpdateFixture("opencode");
  try {
    const installLearning = fixture.run(["--kit", "learning-workflow", "--tool", "codex"]);
    assert.strictEqual(installLearning.status, 0, installLearning.stderr || installLearning.stdout);
    let state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.deepStrictEqual(state.kits, ["coding-standard", "learning-workflow"]);
    assert.deepStrictEqual(state.core.runtimes, ["codex", "opencode"]);
    assert.deepStrictEqual(state.addons.map((addon) => addon.id), ["learning"]);
    assert.deepStrictEqual(state.addons[0].runtimes, ["codex"]);
    assert.ok(state.files.some((file) => file.path === "docs/learning/STANDARD.md"));

    fs.writeFileSync(path.join(fixture.sourceRoot, "AGENTS.md"), "# Learning composed protocol update\n");
    fs.writeFileSync(
      path.join(fixture.sourceRoot, "docs/learning/STANDARD.md"),
      "# Learning composed standard update\n"
    );
    const update = fixture.run(["update", "--apply"]);
    assert.strictEqual(update.status, 0, update.stderr || update.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "AGENTS.md"), "utf8"),
      "# Learning composed protocol update\n"
    );
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "docs/learning/STANDARD.md"), "utf8"),
      "# Learning composed standard update\n"
    );
    state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.deepStrictEqual(state.kits, ["coding-standard", "learning-workflow"]);
  } finally {
    fixture.cleanup();
  }
});

test("workflow-eval on a clean repository installs the core protocol", () => {
  const result = runCli(["--kit", "workflow-eval", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(path.join(result.workspace, "AGENTS.md")));
    assert.ok(fs.existsSync(path.join(result.workspace, "docs/WORKFLOW.md")));
    assert.ok(fs.existsSync(path.join(result.workspace, "docs/evaluation/STANDARD.md")));
    const state = JSON.parse(fs.readFileSync(path.join(result.workspace, ".ai-workflow/installed.json"), "utf8"));
    assert.deepStrictEqual(state.kits, ["workflow-eval"]);
    assert.deepStrictEqual(state.core.runtimes, ["codex"]);
    assert.deepStrictEqual(state.addons.map((addon) => addon.id), ["evaluation"]);
  } finally {
    result.cleanup();
  }
});

test("pre-existing matching protocol files remain consumer-owned across update", () => {
  const fixture = createCliFixture(({ workspace, sourceRoot }) => {
    fs.mkdirSync(path.join(workspace, "docs"), { recursive: true });
    fs.writeFileSync(
      path.join(workspace, "AGENTS.md"),
      fs.readFileSync(path.join(sourceRoot, "AGENTS.md"))
    );
    fs.writeFileSync(
      path.join(workspace, "docs/WORKFLOW.md"),
      fs.readFileSync(path.join(sourceRoot, "docs/WORKFLOW.md"))
    );
  });
  try {
    const install = fixture.run(["--kit", "coding-standard", "--tool", "opencode"]);
    assert.strictEqual(install.status, 0, install.stderr || install.stdout);
    let state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(!state.files.some((file) => file.scope === "repository" && file.path === "AGENTS.md"));
    assert.ok(!state.files.some((file) => file.scope === "repository" && file.path === "docs/WORKFLOW.md"));

    const originalAgents = fs.readFileSync(path.join(fixture.workspace, "AGENTS.md"), "utf8");
    const originalWorkflow = fs.readFileSync(path.join(fixture.workspace, "docs/WORKFLOW.md"), "utf8");
    fs.writeFileSync(path.join(fixture.sourceRoot, "AGENTS.md"), "# Upstream changed AGENTS\n");
    fs.writeFileSync(path.join(fixture.sourceRoot, "docs/WORKFLOW.md"), "# Upstream changed workflow\n");
    const update = fixture.run(["update", "--apply"]);
    assert.strictEqual(update.status, 0, update.stderr || update.stdout);
    assert.ok(update.stdout.includes("SKIP UNKNOWN repository:AGENTS.md"));
    assert.ok(update.stdout.includes("SKIP UNKNOWN repository:docs/WORKFLOW.md"));
    assert.strictEqual(fs.readFileSync(path.join(fixture.workspace, "AGENTS.md"), "utf8"), originalAgents);
    assert.strictEqual(fs.readFileSync(path.join(fixture.workspace, "docs/WORKFLOW.md"), "utf8"), originalWorkflow);
    state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(!state.files.some((file) => file.scope === "repository" && file.path === "AGENTS.md"));
    assert.ok(!state.files.some((file) => file.scope === "repository" && file.path === "docs/WORKFLOW.md"));
  } finally {
    fixture.cleanup();
  }
});

test("pre-existing matching global instructions remain consumer-owned across update", () => {
  const fixture = createCliFixture(({ home, sourceRoot }) => {
    fs.mkdirSync(path.join(home, ".codex"), { recursive: true });
    fs.writeFileSync(
      path.join(home, ".codex/AGENTS.md"),
      fs.readFileSync(path.join(sourceRoot, ".claude/CLAUDE.global.md"))
    );
  });
  try {
    const install = fixture.run(["--kit", "coding-standard", "--tool", "codex"]);
    assert.strictEqual(install.status, 0, install.stderr || install.stdout);
    let state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(!state.files.some((file) => file.scope === "codex-global" && file.path === "AGENTS.md"));

    const originalGlobal = fs.readFileSync(path.join(fixture.home, ".codex/AGENTS.md"), "utf8");
    fs.writeFileSync(
      path.join(fixture.sourceRoot, ".claude/CLAUDE.global.md"),
      "# Upstream changed global instructions\n"
    );
    const update = fixture.run(["update", "--apply"]);
    assert.strictEqual(update.status, 0, update.stderr || update.stdout);
    assert.ok(update.stdout.includes("SKIP UNKNOWN codex-global:AGENTS.md"));
    assert.strictEqual(fs.readFileSync(path.join(fixture.home, ".codex/AGENTS.md"), "utf8"), originalGlobal);
    state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(!state.files.some((file) => file.scope === "codex-global" && file.path === "AGENTS.md"));
  } finally {
    fixture.cleanup();
  }
});

test("pre-existing divergent protocol files remain consumer-owned across update", () => {
  const fixture = createCliFixture(({ workspace }) => {
    fs.writeFileSync(path.join(workspace, "AGENTS.md"), "# Consumer-owned protocol\n");
  });
  try {
    const install = fixture.run(["--kit", "coding-standard", "--tool", "opencode"]);
    assert.strictEqual(install.status, 0, install.stderr || install.stdout);
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.ok(!state.files.some((file) => file.scope === "repository" && file.path === "AGENTS.md"));

    fs.writeFileSync(path.join(fixture.sourceRoot, "AGENTS.md"), "# Upstream changed protocol\n");
    const update = fixture.run(["update", "--apply"]);
    assert.strictEqual(update.status, 0, update.stderr || update.stdout);
    assert.ok(update.stdout.includes("SKIP UNKNOWN repository:AGENTS.md"));
    assert.strictEqual(
      fs.readFileSync(path.join(fixture.workspace, "AGENTS.md"), "utf8"),
      "# Consumer-owned protocol\n"
    );
  } finally {
    fixture.cleanup();
  }
});

test("legacy installed state migrates to composable state on update", () => {
  const fixture = createUpdateFixture("opencode");
  try {
    const state = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    fs.writeFileSync(
      fixture.statePath,
      `${JSON.stringify({
        schemaVersion: 1,
        packageVersion: state.packageVersion,
        kit: "coding-standard",
        runtimes: ["opencode"],
        skills: [],
        files: state.files,
      }, null, 2)}\n`
    );
    const update = fixture.run(["update", "--apply"]);
    assert.strictEqual(update.status, 0, update.stderr || update.stdout);
    const migrated = JSON.parse(fs.readFileSync(fixture.statePath, "utf8"));
    assert.strictEqual(migrated.schemaVersion, 2);
    assert.strictEqual(migrated.core.id, "repository-driven-protocol");
    assert.deepStrictEqual(migrated.core.runtimes, ["opencode"]);
    assert.deepStrictEqual(migrated.addons, []);
    assert.deepStrictEqual(migrated.kits, ["coding-standard"]);
    assert.ok(migrated.files.length > 0);
  } finally {
    fixture.cleanup();
  }
});




test("coding-standard does not install optional OpenCode subagents by default", () => {
  const result = runCli(["--kit", "coding-standard", "--tool", "opencode"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(!fs.existsSync(path.join(result.workspace, ".opencode/agents")));
    assert.ok(!fs.existsSync(path.join(result.workspace, ".opencode/node_modules")));
  } finally {
    result.cleanup();
  }
});

test("workflow session extraction preserves evidence and project boundaries", () => {
  const result = spawnSync("python3", ["-B", path.join(SOURCE_ROOT, "test/session_trace_test.py")], {
    cwd: SOURCE_ROOT,
    encoding: "utf8",
  });
  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
});

test("workflow-eval installs canonical evaluation files", () => {
  const result = runCli(["--kit", "workflow-eval", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(
      fs.existsSync(path.join(result.workspace, "docs/evaluation/reports/README.md"))
    );
    assert.ok(
      fs.existsSync(path.join(result.workspace, "docs/evaluation/STANDARD.md"))
    );
    const skill = fs.readFileSync(
      path.join(result.workspace, ".agents/skills/workflow-evaluation/SKILL.md"),
      "utf8"
    );
    assert.ok(skill.includes(".agents/skills/workflow-evaluation/extract_session_trace.py"));
    assert.ok(
      fs.existsSync(
        path.join(result.workspace, ".agents/skills/workflow-evaluation/references/weekly-audit.md")
      )
    );
    assert.ok(fs.existsSync(path.join(result.workspace, ".codex/agents/review-pr.toml")));
  } finally {
    result.cleanup();
  }
});

test("workflow-eval installs Claude review agents", () => {
  const result = runCli(["--kit", "workflow-eval", "--tool", "claude"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(path.join(result.workspace, ".claude/agents/review-pr.md")));
  } finally {
    result.cleanup();
  }
});

test("design kit installs unfilled context seeds under docs", () => {
  const result = runCli(["--kit", "design", "--tool", "claude"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const productPath = path.join(result.workspace, "docs/PRODUCT.md");
    const designPath = path.join(result.workspace, "docs/DESIGN.md");
    assert.ok(fs.existsSync(productPath));
    assert.ok(fs.existsSync(designPath));

    const product = fs.readFileSync(productPath, "utf8");
    const design = fs.readFileSync(designPath, "utf8");
    assert.ok(product.includes("Unfilled seed"));
    assert.ok(design.includes("Unfilled seed"));
    // The engine reads this marker to require colors and typography only.
    assert.ok(design.includes("<!-- SEED:"));
    // A parsed value here would be read as the platform itself.
    assert.ok(/## Platform\n\n## Users/.test(product));

    // The engine is a per-machine prerequisite the installer never installs.
    assert.ok(result.stdout.includes("npx impeccable install"));

    // Seeds must not land where they would outrank docs/.
    assert.ok(!fs.existsSync(path.join(result.workspace, "PRODUCT.md")));
    assert.ok(!fs.existsSync(path.join(result.workspace, ".agents/context/PRODUCT.md")));
  } finally {
    result.cleanup();
  }
});

test("design kit preserves a filled product record across reinstall", () => {
  const result = runCli(["--kit", "design", "--tool", "claude"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const productPath = path.join(result.workspace, "docs/PRODUCT.md");
    const filled = "# Product\n\n## Platform\n\nweb\n\n## Users\n\nLocally preserved product record.\n";
    fs.writeFileSync(productPath, filled);

    const reinstall = spawnSync(
      process.execPath,
      [path.join(SOURCE_ROOT, "cli.js"), "--kit", "design", "--tool", "claude"],
      { cwd: result.workspace, env: { ...process.env, HOME: result.home }, encoding: "utf8" }
    );
    assert.strictEqual(reinstall.status, 0, reinstall.stderr || reinstall.stdout);
    assert.strictEqual(fs.readFileSync(productPath, "utf8"), filled);
  } finally {
    result.cleanup();
  }
});

test("learning-workflow installs durable artifacts and executable state tooling", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skillRoot = path.join(result.workspace, ".agents/skills/learning-workflow");
    const skillsRoot = path.join(result.workspace, ".agents/skills");
    const casePath = path.join(result.workspace, "docs/learning/cases/inventory-reservation.json");
    const miniProjectCaseNames = [
      "webhook-replay-inspector.json",
      "expiring-secret-link.json",
      "cron-doctor.json",
      "api-chaos-proxy.json",
      "background-job-retry-incident.json",
    ];
    const projectPath = path.join(result.workspace, "docs/learning/project.json");
    const schedulePath = path.join(result.workspace, "docs/learning/schedule.json");
    const standardPath = path.join(result.workspace, "docs/learning/STANDARD.md");
    const initPath = path.join(skillRoot, "scripts/init_learning_session.py");
    const contextPath = path.join(skillRoot, "scripts/update_learning_context.py");
    const updatePath = path.join(skillRoot, "scripts/update_learning_state.py");
    const validatePath = path.join(skillRoot, "scripts/validate_learning_state.py");
    const profilePath = path.join(result.workspace, "docs/learning/profile.json");
    const sessionPath = path.join(result.workspace, "docs/learning/sessions/inventory-reservation-001.json");

    assert.ok(fs.existsSync(casePath));
    miniProjectCaseNames.forEach((caseName) => {
      const installedPath = path.join(result.workspace, "docs/learning/cases", caseName);
      assert.ok(fs.existsSync(installedPath));
      assert.strictEqual(
        JSON.parse(fs.readFileSync(installedPath, "utf8")).mini_project.format,
        "mini-project"
      );
    });
    assert.ok(fs.existsSync(projectPath));
    assert.ok(fs.existsSync(schedulePath));
    assert.ok(fs.existsSync(standardPath));
    assert.ok(fs.existsSync(initPath));
    assert.ok(fs.existsSync(contextPath));
    assert.ok(fs.existsSync(updatePath));
    assert.ok(fs.existsSync(validatePath));
    assert.ok(fs.existsSync(path.join(skillsRoot, "learning-case/SKILL.md")));
    assert.ok(fs.existsSync(path.join(skillsRoot, "learning-evidence/SKILL.md")));
    assert.ok(fs.existsSync(path.join(skillsRoot, "learning-review/SKILL.md")));

    const coordinator = fs.readFileSync(path.join(skillRoot, "SKILL.md"), "utf8");
    assert.ok(coordinator.includes("Setup -> Spec -> Build -> Review -> Reflect"));
    assert.ok(coordinator.includes("STANDARD.md"));
    assert.ok(coordinator.includes("update_learning_state.py"));
    assert.ok(coordinator.includes("update_learning_context.py"));

    const blockedInitialization = spawnSync(
      "python3",
      [
        initPath,
        "--case",
        casePath,
        "--project",
        projectPath,
        "--schedule",
        schedulePath,
        "--profile",
        profilePath,
        "--session",
        sessionPath,
        "--goal",
        "Develop senior system-design judgment",
        "--baseline",
        "Can design ordinary CRUD systems but needs guidance with partial failures",
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.notStrictEqual(blockedInitialization.status, 0);
    assert.ok(blockedInitialization.stderr.includes("must be active"));
    assert.ok(!fs.existsSync(profilePath));
    assert.ok(!fs.existsSync(sessionPath));

    const acceptedContext = spawnSync(
      "python3",
      [contextPath, "accept", "--project", projectPath, "--schedule", schedulePath],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(acceptedContext.status, 0, acceptedContext.stderr || acceptedContext.stdout);

    const recalibrationPath = path.join(result.workspace, "schedule-recalibration.json");
    fs.writeFileSync(
      recalibrationPath,
      JSON.stringify({
        reason: "Controlled evidence requires a sharper state-modeling focus.",
        effective_week: 2,
        updates: [
          {
            week: 2,
            theme: "Domain model and explicit state transitions",
            competency_focus: ["domain modeling", "state-machine reasoning"],
            project_focus: "Reservation, order, and payment transitions",
          },
        ],
      }, null, 2) + "\n"
    );
    const recalibrated = spawnSync(
      "python3",
      [
        contextPath,
        "recalibrate-schedule",
        "--project",
        projectPath,
        "--schedule",
        schedulePath,
        "--payload",
        recalibrationPath,
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(recalibrated.status, 0, recalibrated.stderr || recalibrated.stdout);

    const initialized = spawnSync(
      "python3",
      [
        initPath,
        "--case",
        casePath,
        "--project",
        projectPath,
        "--schedule",
        schedulePath,
        "--profile",
        profilePath,
        "--session",
        sessionPath,
        "--goal",
        "Develop senior system-design judgment",
        "--baseline",
        "Can design ordinary CRUD systems but needs guidance with partial failures",
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(initialized.status, 0, initialized.stderr || initialized.stdout);

    const initializedProfile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
    assert.strictEqual(initializedProfile.cadence, "mini-project");
    assert.strictEqual(initializedProfile.project_id, "mini-product-lab");
    assert.strictEqual(initializedProfile.schedule_week, 1);
    assert.deepStrictEqual(initializedProfile.current_gaps, []);
    assert.deepStrictEqual(initializedProfile.progress_history, []);

    const validated = spawnSync(
      "python3",
      [
        validatePath,
        sessionPath,
        "--case",
        casePath,
        "--profile",
        profilePath,
        "--project",
        projectPath,
        "--schedule",
        schedulePath,
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(validated.status, 0, validated.stderr || validated.stdout);
  } finally {
    result.cleanup();
  }
});

function runLearningTransition(paths, operation, payload) {
  const args = [
    paths.updatePath,
    operation,
    "--session",
    paths.sessionPath,
    "--case",
    paths.casePath,
    "--profile",
    paths.profilePath,
    "--project",
    paths.projectPath,
    "--schedule",
    paths.schedulePath,
  ];
  if (payload !== undefined) {
    const payloadPath = path.join(paths.workspace, "transition-payload.json");
    fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2) + "\n");
    args.push("--payload", payloadPath);
  }
  return spawnSync("python3", args, { cwd: paths.workspace, encoding: "utf8" });
}

function attemptPayload(judgmentId, summary) {
  return {
    judgment_id: judgmentId,
    summary,
    reasoning: "Reasoning recorded for the controlled lifecycle exercise.",
    assumptions: ["The currently disclosed case facts remain true."],
    constraints: [],
    invariants: [],
    risks: [],
    predictions: [],
    tradeoffs: [],
  };
}

test("learning-workflow completes a controlled MVP lifecycle", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skillRoot = path.join(result.workspace, ".agents/skills/learning-workflow");
    const paths = {
      workspace: result.workspace,
      casePath: path.join(result.workspace, "docs/learning/cases/inventory-reservation.json"),
      projectPath: path.join(result.workspace, "docs/learning/project.json"),
      schedulePath: path.join(result.workspace, "docs/learning/schedule.json"),
      profilePath: path.join(result.workspace, "docs/learning/profile.json"),
      sessionPath: path.join(result.workspace, "docs/learning/sessions/controlled-lifecycle.json"),
      initPath: path.join(skillRoot, "scripts/init_learning_session.py"),
      contextPath: path.join(skillRoot, "scripts/update_learning_context.py"),
      updatePath: path.join(skillRoot, "scripts/update_learning_state.py"),
      validatePath: path.join(skillRoot, "scripts/validate_learning_state.py"),
    };

    const draftSchedule = JSON.parse(fs.readFileSync(paths.schedulePath, "utf8"));
    draftSchedule.sessions_per_week = 1;
    fs.writeFileSync(paths.schedulePath, JSON.stringify(draftSchedule, null, 2) + "\n");
    const acceptedContext = spawnSync(
      "python3",
      [paths.contextPath, "accept", "--project", paths.projectPath, "--schedule", paths.schedulePath],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(acceptedContext.status, 0, acceptedContext.stderr || acceptedContext.stdout);

    const initialized = spawnSync(
      "python3",
      [
        paths.initPath,
        "--case",
        paths.casePath,
        "--project",
        paths.projectPath,
        "--schedule",
        paths.schedulePath,
        "--profile",
        paths.profilePath,
        "--session",
        paths.sessionPath,
        "--goal",
        "Develop evidence-bound system-design judgment",
        "--baseline",
        "Can design CRUD systems independently",
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(initialized.status, 0, initialized.stderr || initialized.stdout);

    let transition = runLearningTransition(paths, "accept-boundary");
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    transition = runLearningTransition(paths, "disclose-facts", {
      question: "Are inventory and order stored in the same transactional datastore?",
      matched_discovery_path: "Hỏi liệu inventory và order có cùng datastore không.",
      fact_ids: ["F-003"],
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    transition = runLearningTransition(paths, "record-attempt", attemptPayload("PJ-001", "Protect inventory, order, and payment invariants."));
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "close-judgment", {
      judgment_id: "PJ-001",
      mode: "assessment-closed",
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    transition = runLearningTransition(paths, "record-attempt", attemptPayload("PJ-002", "Use reservation state transitions and idempotent callbacks."));
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "release-event", {
      event_id: "EV-001",
      trigger_evidence: ["AT-002"],
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "record-assistance", {
      judgment_id: "PJ-002",
      level: 4,
      kind: "scoped-hint",
      content: "Consider the delayed-success path after reservation expiry.",
      material: true,
      material_reason: "The hint exposed a missing failure branch.",
      impact: "Narrowed the failure model.",
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "record-revision", {
      judgment_id: "PJ-002",
      summary: "Added reconciliation for delayed success after expiry.",
      reason: "The predeclared consequence invalidated the original recovery assumption.",
      evidence_refs: ["ERL-001", "AS-001"],
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    transition = runLearningTransition(paths, "record-attempt", attemptPayload("PJ-003", "Test duplicate callbacks and delayed payment recovery."));
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "request-evidence", {
      judgment_id: "PJ-003",
      decision_or_assumption: "Idempotent callback handling preserves the inventory invariant.",
      question: "Does the bounded simulation preserve state under duplicate callbacks?",
      method: "deterministic state-machine simulation",
      scope: "single-process synthetic callback sequence",
      interpretation_protected: true,
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "record-evidence", {
      request_id: "ER-001",
      question: "Does the bounded simulation preserve state under duplicate callbacks?",
      method: "deterministic state-machine simulation",
      environment: { runtime: "controlled-test" },
      assumptions: ["The state machine model matches the declared transitions."],
      result: "Duplicate callbacks did not create a second confirmed order.",
      evidence_references: ["test://controlled-state-machine"],
      limitations: ["The exercise did not simulate worker crashes."],
      confidence: "medium",
      proves: ["The modeled duplicate sequence is idempotent."],
      suggests: [],
      does_not_prove: ["Production reliability or crash recovery."],
      interpretation_withheld: true,
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "interpret-evidence", {
      evidence_id: "SE-001",
      summary: "The result covers duplicates but leaves crash recovery unknown.",
      proves: ["The modeled duplicate path is idempotent."],
      does_not_prove: ["Worker crash recovery."],
      decision_change: "revised",
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "record-revision", {
      judgment_id: "PJ-003",
      summary: "Kept idempotency and added a separate crash-recovery evidence gap.",
      reason: "The evidence was bounded to duplicate delivery.",
      evidence_refs: ["SE-001", "EI-001"],
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "close-judgment", {
      judgment_id: "PJ-003",
      mode: "assessment-closed",
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    transition = runLearningTransition(paths, "propose-assessment", {
      dimensions: [
        {
          id: "RUB-001",
          rating: "demonstrated",
          independence: "independent",
          evidence: ["AT-001"],
          limitation: "Observed in one simulated case.",
        },
        {
          id: "RUB-002",
          rating: "demonstrated",
          independence: "assisted",
          evidence: ["AT-002", "ERL-001", "AS-001", "RV-001"],
          limitation: "Delayed-success recovery required a scoped hint.",
        },
        {
          id: "RUB-003",
          rating: "demonstrated",
          independence: "independent",
          evidence: ["AT-003", "SE-001", "EI-001", "RV-002"],
          limitation: "The experiment did not cover crashes.",
        },
        {
          id: "RUB-004",
          rating: "demonstrated",
          independence: "assisted",
          evidence: ["RV-001", "RV-002"],
          limitation: "One revision followed material assistance.",
        },
      ],
      result_summary: {
        independent: ["Defined invariants and interpreted bounded evidence."],
        assisted: ["Expanded the delayed-payment failure model."],
        not_demonstrated: ["Transfer to another domain remains untested."],
      },
      gaps: ["Transfer the failure reasoning to another domain."],
      outcome: "assisted-success",
      limitations: ["One simulated case does not establish transfer."],
      next_action: {
        type: "transfer-context",
        reason: "Test the same principle in a scheduling domain.",
      },
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    transition = runLearningTransition(paths, "raise-dispute", {
      category: "rubric-mapping",
      reason: "The learner disputes the assistance attribution.",
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    const blockedCompletion = runLearningTransition(paths, "complete-session");
    assert.notStrictEqual(blockedCompletion.status, 0);
    assert.ok(blockedCompletion.stderr.includes("open dispute"));

    transition = runLearningTransition(paths, "resolve-dispute", {
      dispute_id: "DP-001",
      resolution: "The recorded scoped hint materially narrowed the missing failure branch.",
    });
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);
    transition = runLearningTransition(paths, "complete-session");
    assert.strictEqual(transition.status, 0, transition.stderr || transition.stdout);

    const validated = spawnSync(
      "python3",
      [
        paths.validatePath,
        paths.sessionPath,
        "--case",
        paths.casePath,
        "--profile",
        paths.profilePath,
        "--project",
        paths.projectPath,
        "--schedule",
        paths.schedulePath,
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(validated.status, 0, validated.stderr || validated.stdout);

    const profile = JSON.parse(fs.readFileSync(paths.profilePath, "utf8"));
    const session = JSON.parse(fs.readFileSync(paths.sessionPath, "utf8"));
    const schedule = JSON.parse(fs.readFileSync(paths.schedulePath, "utf8"));
    assert.strictEqual(session.status, "completed");
    assert.strictEqual(session.assessment.accepted_by_human, true);
    assert.strictEqual(profile.active_session_id, null);
    assert.strictEqual(profile.progress_history.length, 1);
    assert.strictEqual(profile.competencies[0].independence, "assisted");
    assert.strictEqual(profile.next_action.type, "transfer-context");
    assert.strictEqual(profile.schedule_week, 2);
    assert.strictEqual(schedule.current_week, 2);
    assert.strictEqual(schedule.weeks[0].status, "completed");
    assert.strictEqual(schedule.weeks[1].status, "in-progress");
    assert.deepStrictEqual(schedule.weeks[0].completed_session_ids, [session.session_id]);

    const evolutionPayloadPath = path.join(result.workspace, "project-evolution.json");
    fs.writeFileSync(
      evolutionPayloadPath,
      JSON.stringify({
        session_id: session.session_id,
        summary: "Accepted delayed-payment reconciliation into the project state.",
        decisions: ["Late successful payments enter reconciliation."],
        delivered_capabilities: [],
        active_constraints: ["Payment success may arrive after reservation expiry."],
      }, null, 2) + "\n"
    );
    const evolved = spawnSync(
      "python3",
      [
        paths.contextPath,
        "record-project-evolution",
        "--project",
        paths.projectPath,
        "--schedule",
        paths.schedulePath,
        "--payload",
        evolutionPayloadPath,
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(evolved.status, 0, evolved.stderr || evolved.stdout);
    const project = JSON.parse(fs.readFileSync(paths.projectPath, "utf8"));
    assert.strictEqual(project.version, 2);
    assert.strictEqual(project.evolution_history[1].session_id, session.session_id);
    const historicalValidation = spawnSync(
      "python3",
      [
        paths.validatePath,
        paths.sessionPath,
        "--case",
        paths.casePath,
        "--profile",
        paths.profilePath,
        "--project",
        paths.projectPath,
        "--schedule",
        paths.schedulePath,
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(historicalValidation.status, 0, historicalValidation.stderr || historicalValidation.stdout);
  } finally {
    result.cleanup();
  }
});

test("learning-workflow preserves an installed durable case", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const casePath = path.join(result.workspace, "docs/learning/cases/inventory-reservation.json");
    const projectPath = path.join(result.workspace, "docs/learning/project.json");
    const schedulePath = path.join(result.workspace, "docs/learning/schedule.json");
    const customized = JSON.parse(fs.readFileSync(casePath, "utf8"));
    customized.title = "Locally preserved durable case";
    fs.writeFileSync(casePath, JSON.stringify(customized, null, 2) + "\n");
    const customizedProject = JSON.parse(fs.readFileSync(projectPath, "utf8"));
    customizedProject.title = "Locally preserved learning project";
    fs.writeFileSync(projectPath, JSON.stringify(customizedProject, null, 2) + "\n");
    const customizedSchedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
    customizedSchedule.weeks[0].theme = "Locally preserved first week";
    fs.writeFileSync(schedulePath, JSON.stringify(customizedSchedule, null, 2) + "\n");

    const reinstall = spawnSync(
      process.execPath,
      [path.join(SOURCE_ROOT, "cli.js"), "--kit", "learning-workflow", "--tool", "codex"],
      { cwd: result.workspace, env: process.env, encoding: "utf8" }
    );
    assert.strictEqual(reinstall.status, 0, reinstall.stderr || reinstall.stdout);
    assert.strictEqual(JSON.parse(fs.readFileSync(casePath, "utf8")).title, "Locally preserved durable case");
    assert.strictEqual(JSON.parse(fs.readFileSync(projectPath, "utf8")).title, "Locally preserved learning project");
    assert.strictEqual(JSON.parse(fs.readFileSync(schedulePath, "utf8")).weeks[0].theme, "Locally preserved first week");
  } finally {
    result.cleanup();
  }
});

test("learning-workflow rejects unsupported Pi installs before writing files", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "pi"]);
  try {
    assert.notStrictEqual(result.status, 0);
    assert.ok(result.stdout.includes("Learning workflow does not support: pi"));
    assert.ok(!fs.existsSync(path.join(result.workspace, "docs/learning/CONSTITUTION.md")));
  } finally {
    result.cleanup();
  }
});

test("learning validator rejects malformed case contracts", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skillRoot = path.join(result.workspace, ".agents/skills/learning-workflow");
    const casePath = path.join(result.workspace, "docs/learning/cases/inventory-reservation.json");
    const validatePath = path.join(skillRoot, "scripts/validate_learning_state.py");
    const invalidCasePath = path.join(result.workspace, "invalid-case.json");
    const invalidCase = JSON.parse(fs.readFileSync(casePath, "utf8"));
    delete invalidCase.provenance;
    invalidCase.facts[2].discovery_paths = [42];
    delete invalidCase.future_events[0].purpose;
    fs.writeFileSync(invalidCasePath, JSON.stringify(invalidCase, null, 2) + "\n");

    const rejected = spawnSync("python3", [validatePath, invalidCasePath], {
      cwd: result.workspace,
      encoding: "utf8",
    });
    assert.notStrictEqual(rejected.status, 0);
  } finally {
    result.cleanup();
  }
});

test("learning mini-project sessions require assessed implied requirements", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skillRoot = path.join(result.workspace, ".agents/skills/learning-workflow");
    const validatePath = path.join(skillRoot, "scripts/validate_learning_state.py");
    const initPath = path.join(skillRoot, "scripts/init_learning_session.py");
    const contextPath = path.join(skillRoot, "scripts/update_learning_context.py");
    const casePath = path.join(result.workspace, "docs/learning/cases/webhook-replay-inspector.json");
    const projectPath = path.join(result.workspace, "docs/learning/project.json");
    const schedulePath = path.join(result.workspace, "docs/learning/schedule.json");
    const profilePath = path.join(result.workspace, "docs/learning/profile.json");
    const sessionPath = path.join(result.workspace, "docs/learning/sessions/webhook-replay-inspector-001.json");
    const run = (args) => spawnSync("python3", args, { cwd: result.workspace, encoding: "utf8" });
    const initialize = () => run([
      initPath,
      "--case", casePath,
      "--project", projectPath,
      "--schedule", schedulePath,
      "--profile", profilePath,
      "--session", sessionPath,
      "--goal", "Build product-minded fullstack judgment",
      "--baseline", "Builds React features without designing integration failure handling",
    ]);

    const acceptedContext = run([contextPath, "accept", "--project", projectPath, "--schedule", schedulePath]);
    assert.strictEqual(acceptedContext.status, 0, acceptedContext.stderr || acceptedContext.stdout);

    const blocked = initialize();
    assert.notStrictEqual(blocked.status, 0);
    assert.ok(blocked.stderr.includes("requires implied requirements"));
    assert.ok(!fs.existsSync(sessionPath));

    const baseCase = JSON.parse(fs.readFileSync(casePath, "utf8"));
    const withImpliedRequirements = () => {
      const value = JSON.parse(JSON.stringify(baseCase));
      value.facts.push({
        id: "F-WEBHOOK-005",
        visibility: "discoverable",
        statement: "Developers paste the shown payload into bug reports.",
        discovery_paths: ["Ask how developers share a captured webhook"],
      });
      value.implied_requirements = [{
        id: "IR-WEBHOOK-001",
        kind: "functional",
        statement: "A developer can copy the raw payload without the secret.",
        derived_from: "The user debugs integrations and shares findings.",
        fact_ids: ["F-WEBHOOK-005"],
        check: "The demo copies a raw payload that contains no secret.",
      }];
      value.rubric.push({
        id: "RUB-WEBHOOK-004",
        name: "Product understanding",
        required_judgment_ids: [],
        required_implied_requirement_ids: ["IR-WEBHOOK-001"],
        observable_signals: ["The learner handles a need implied by the user and problem."],
      });
      return value;
    };
    const productDimension = (value) => value.rubric.find((dimension) => dimension.id === "RUB-WEBHOOK-004");
    const rejectsCase = (value, message) => {
      const invalidPath = path.join(result.workspace, "invalid-implied-case.json");
      fs.writeFileSync(invalidPath, JSON.stringify(value, null, 2) + "\n");
      const rejected = run([validatePath, invalidPath]);
      assert.notStrictEqual(rejected.status, 0);
      assert.ok(rejected.stderr.includes(message), rejected.stderr);
    };

    const publicFact = withImpliedRequirements();
    publicFact.implied_requirements[0].fact_ids = ["F-WEBHOOK-001"];
    rejectsCase(publicFact, "must reference discoverable facts");

    const unassessed = withImpliedRequirements();
    unassessed.rubric.pop();
    rejectsCase(unassessed, "must be assessed by a rubric dimension");

    const sharedDimension = withImpliedRequirements();
    sharedDimension.rubric.pop();
    sharedDimension.rubric[0].required_implied_requirement_ids = ["IR-WEBHOOK-001"];
    rejectsCase(sharedDimension, "dedicated product-understanding dimension");

    const unknownReference = withImpliedRequirements();
    productDimension(unknownReference).required_implied_requirement_ids = ["IR-WEBHOOK-009"];
    rejectsCase(unknownReference, "references unknown implied requirements");

    const tooMany = withImpliedRequirements();
    for (const suffix of ["002", "003", "004"]) {
      tooMany.implied_requirements.push({ ...tooMany.implied_requirements[0], id: `IR-WEBHOOK-${suffix}` });
      productDimension(tooMany).required_implied_requirement_ids.push(`IR-WEBHOOK-${suffix}`);
    }
    rejectsCase(tooMany, "at most 3");

    const invalidKind = withImpliedRequirements();
    invalidKind.implied_requirements[0].kind = "nice-to-have";
    rejectsCase(invalidKind, "must be functional or non-functional");

    for (const field of ["statement", "derived_from", "check"]) {
      const missingField = withImpliedRequirements();
      delete missingField.implied_requirements[0][field];
      rejectsCase(missingField, `implied_requirements[0].${field} must be a non-empty string`);
    }

    const noRevealingFact = withImpliedRequirements();
    noRevealingFact.implied_requirements[0].fact_ids = [];
    rejectsCase(noRevealingFact, "fact_ids must not be empty");

    fs.writeFileSync(casePath, JSON.stringify(withImpliedRequirements(), null, 2) + "\n");
    const initialized = initialize();
    assert.strictEqual(initialized.status, 0, initialized.stderr || initialized.stdout);
    const validated = run([
      validatePath,
      sessionPath,
      "--case", casePath,
      "--profile", profilePath,
      "--project", projectPath,
      "--schedule", schedulePath,
    ]);
    assert.strictEqual(validated.status, 0, validated.stderr || validated.stdout);
  } finally {
    result.cleanup();
  }
});

test("learning validator rejects malformed project and schedule contracts", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const validatePath = path.join(
      result.workspace,
      ".agents/skills/learning-workflow/scripts/validate_learning_state.py"
    );
    const projectPath = path.join(result.workspace, "docs/learning/project.json");
    const schedulePath = path.join(result.workspace, "docs/learning/schedule.json");
    const invalidProjectPath = path.join(result.workspace, "invalid-project.json");
    const invalidSchedulePath = path.join(result.workspace, "invalid-schedule.json");

    const invalidProject = JSON.parse(fs.readFileSync(projectPath, "utf8"));
    delete invalidProject.architecture_baseline;
    fs.writeFileSync(invalidProjectPath, JSON.stringify(invalidProject, null, 2) + "\n");
    const rejectedProject = spawnSync("python3", [validatePath, invalidProjectPath], {
      cwd: result.workspace,
      encoding: "utf8",
    });
    assert.notStrictEqual(rejectedProject.status, 0);

    const invalidSchedule = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
    invalidSchedule.weeks[1].week = 1;
    fs.writeFileSync(invalidSchedulePath, JSON.stringify(invalidSchedule, null, 2) + "\n");
    const rejectedSchedule = spawnSync(
      "python3",
      [validatePath, invalidSchedulePath, "--project", projectPath],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.notStrictEqual(rejectedSchedule.status, 0);
  } finally {
    result.cleanup();
  }
});

test("learning state tooling rejects first attempts after material assistance", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skillRoot = path.join(result.workspace, ".agents/skills/learning-workflow");
    const paths = {
      workspace: result.workspace,
      casePath: path.join(result.workspace, "docs/learning/cases/inventory-reservation.json"),
      projectPath: path.join(result.workspace, "docs/learning/project.json"),
      schedulePath: path.join(result.workspace, "docs/learning/schedule.json"),
      profilePath: path.join(result.workspace, "docs/learning/profile.json"),
      sessionPath: path.join(result.workspace, "docs/learning/sessions/prior-help.json"),
      initPath: path.join(skillRoot, "scripts/init_learning_session.py"),
      contextPath: path.join(skillRoot, "scripts/update_learning_context.py"),
      updatePath: path.join(skillRoot, "scripts/update_learning_state.py"),
    };
    const acceptedContext = spawnSync(
      "python3",
      [paths.contextPath, "accept", "--project", paths.projectPath, "--schedule", paths.schedulePath],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(acceptedContext.status, 0, acceptedContext.stderr || acceptedContext.stdout);
    const initialized = spawnSync(
      "python3",
      [
        paths.initPath,
        "--case",
        paths.casePath,
        "--project",
        paths.projectPath,
        "--schedule",
        paths.schedulePath,
        "--profile",
        paths.profilePath,
        "--session",
        paths.sessionPath,
        "--goal",
        "test",
        "--baseline",
        "test baseline",
      ],
      { cwd: result.workspace, encoding: "utf8" }
    );
    assert.strictEqual(initialized.status, 0, initialized.stderr || initialized.stdout);
    assert.strictEqual(runLearningTransition(paths, "accept-boundary").status, 0);
    const assisted = runLearningTransition(paths, "record-assistance", {
      judgment_id: "PJ-001",
      level: 4,
      kind: "scoped-hint",
      content: "Material direction before an attempt.",
      material: true,
      material_reason: "The intervention narrowed the solution space.",
      impact: "Supplied the missing invariant direction.",
    });
    assert.strictEqual(assisted.status, 0, assisted.stderr || assisted.stdout);

    const rejected = runLearningTransition(
      paths,
      "record-attempt",
      attemptPayload("PJ-001", "Attempt recorded after receiving material help.")
    );
    assert.notStrictEqual(rejected.status, 0);
    assert.ok(rejected.stderr.includes("after material assistance"));
  } finally {
    result.cleanup();
  }
});

test("learning namespace defines the coding handoff and promotion boundary", () => {
  const namespacePath = path.join(SOURCE_ROOT, "docs/learning/README.md");
  const evidenceSkillPath = path.join(SOURCE_ROOT, "skills/learning-evidence/SKILL.md");
  const namespace = fs.readFileSync(namespacePath, "utf8");
  const evidenceSkill = fs.readFileSync(evidenceSkillPath, "utf8");
  assert.ok(namespace.includes("production deliverable"));
  assert.ok(namespace.includes("isolated worktree or temporary directory"));
  assert.ok(namespace.includes("not repository product intent"));
  assert.ok(evidenceSkill.includes("does not require a separate named coding constitution"));
  assert.ok(evidenceSkill.includes("Route a production deliverable through the repository's normal coding workflow"));
});

test("learning state rejects stale snapshots and recovers interrupted commits", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "learning-state-safety-"));
  const learningRoot = path.join(temporaryRoot, "docs/learning");
  fs.mkdirSync(learningRoot, { recursive: true });
  const script = `
import hashlib
import json
import sys
from pathlib import Path

from state_io import StateConflictError, learning_state_lock, snapshot_paths, write_files_atomic

root = Path(sys.argv[1])
first = root / "first.json"
second = root / "second.json"
old_first = b'{"state":"old-first"}\\\\n'
old_second = b'{"state":"old-second"}\\\\n'
new_first = b'{"state":"new-first"}\\\\n'
new_second = b'{"state":"new-second"}\\\\n'
first.write_bytes(old_first)
second.write_bytes(old_second)
originals = snapshot_paths([first, second])
first.write_bytes(b'{"state":"external"}\\\\n')
try:
    write_files_atomic(
        {first: new_first.decode(), second: new_second.decode()},
        originals=originals,
        root=root,
    )
except StateConflictError:
    pass
else:
    raise SystemExit("stale snapshot was accepted")
if first.read_bytes() != b'{"state":"external"}\\\\n' or second.read_bytes() != old_second:
    raise SystemExit("stale write changed newer state")

first.write_bytes(old_first)
second.write_bytes(old_second)
transaction = root / ".learning-tx-test"
transaction.mkdir()
(transaction / "old-0").write_bytes(old_first)
(transaction / "old-1").write_bytes(old_second)
(transaction / "new-0").write_bytes(new_first)
(transaction / "new-1").write_bytes(new_second)
manifest = {
    "version": 1,
    "transaction_dir": transaction.name,
    "entries": [
        {
            "path": "first.json",
            "stage": "new-0",
            "backup": "old-0",
            "original_exists": True,
            "original_sha256": hashlib.sha256(old_first).hexdigest(),
            "new_exists": True,
            "new_sha256": hashlib.sha256(new_first).hexdigest(),
        },
        {
            "path": "second.json",
            "stage": "new-1",
            "backup": "old-1",
            "original_exists": True,
            "original_sha256": hashlib.sha256(old_second).hexdigest(),
            "new_exists": True,
            "new_sha256": hashlib.sha256(new_second).hexdigest(),
        },
    ],
}
(root / ".learning-workflow-transaction.json").write_text(json.dumps(manifest), encoding="utf-8")
first.write_bytes(new_first)
with learning_state_lock([first, second]):
    pass
if first.read_bytes() != old_first or second.read_bytes() != old_second:
    raise SystemExit("interrupted commit was not rolled back")
if (root / ".learning-workflow-transaction.json").exists() or transaction.exists():
    raise SystemExit("recovery artifacts were not cleaned")
`;
  try {
    const result = spawnSync("python3", ["-c", script, learningRoot], {
      cwd: SOURCE_ROOT,
      env: {
        ...process.env,
        PYTHONPATH: path.join(SOURCE_ROOT, "skills/learning-workflow/scripts"),
      },
      encoding: "utf8",
    });
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("installed learning workflow includes state safety runtime", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(
      fs.existsSync(
        path.join(result.workspace, ".agents/skills/learning-workflow/scripts/state_io.py")
      )
    );
    assert.ok(fs.existsSync(path.join(result.workspace, "docs/learning/README.md")));
  } finally {
    result.cleanup();
  }
});

test("temporary package workspace can be created", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-test-"));
  assert.ok(fs.existsSync(workspace));
  fs.rmSync(workspace, { recursive: true, force: true });
});
