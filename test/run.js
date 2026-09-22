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
    extraSkills: ["refactor", "refactor", "property-based-testing"],
  });
  assert.strictEqual(skillIds.filter((id) => id === "refactor").length, 1);
  assert.strictEqual(skillIds[skillIds.length - 1], "property-based-testing");
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
    getCliSelectedSkills(["--skill", "refactor", "--skill", "property-based-testing"]),
    ["refactor", "property-based-testing"]
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

test("testing bundle registers runtime E2E and property-based skills", () => {
  const { skillIds } = resolveSkills({
    sourceRoot: SOURCE_ROOT,
    kitId: "coding-standard",
    extraBundles: ["testing"],
  });
  assert.deepStrictEqual(skillIds, [
    "runtime-e2e-test-plan",
    "property-based-testing",
  ]);
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

test("Claude project instructions use the root protocol as their source", () => {
  assert.ok(!fs.existsSync(path.join(SOURCE_ROOT, ".claude/CLAUDE.md")));
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
  const customSkill = "# Consumer-owned refactor skill\n";
  const result = runCli(
    ["--kit", "coding-standard", "--tool", "codex", "--skill", "refactor"],
    ({ workspace }) => {
      const skillPath = path.join(workspace, ".agents/skills/refactor/SKILL.md");
      fs.mkdirSync(path.dirname(skillPath), { recursive: true });
      fs.writeFileSync(skillPath, customSkill);
    }
  );
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.strictEqual(
      fs.readFileSync(path.join(result.workspace, ".agents/skills/refactor/SKILL.md"), "utf8"),
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
    const propertyRoot = path.join(
      result.workspace,
      ".agents/skills/property-based-testing"
    );
    assert.ok(fs.existsSync(path.join(propertyRoot, "SKILL.md")));
    assert.ok(fs.existsSync(path.join(propertyRoot, "references/generating.md")));
    assert.ok(fs.existsSync(path.join(propertyRoot, "assets/trail-of-bits-mark.svg")));
    assert.ok(fs.existsSync(path.join(propertyRoot, "LICENSE")));

    const runtimeRoot = path.join(
      result.workspace,
      ".agents/skills/runtime-e2e-test-plan"
    );
    const installedRuntimeSkill = fs.readFileSync(
      path.join(runtimeRoot, "SKILL.md"),
      "utf8"
    );
    assert.ok(
      installedRuntimeSkill.includes(
        ".agents/skills/runtime-e2e-test-plan/references/project-runtime.md"
      )
    );
    assert.ok(fs.existsSync(path.join(runtimeRoot, "validate_test_plan.py")));
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

test("runtime E2E validator rejects PASS through a different production path", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-e2e-plan-"));
  const planPath = path.join(directory, "settled-order.md");
  const validator = path.join(
    SOURCE_ROOT,
    "skills/runtime-e2e-test-plan/validate_test_plan.py"
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
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
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
        fs.readFileSync(path.join(SOURCE_ROOT, "AGENTS.md"))
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
    const currentProject = fs.readFileSync(path.join(SOURCE_ROOT, "AGENTS.md"));
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
    assert.ok(coordinator.includes("Explore -> Decide -> Reflect"));
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
    assert.strictEqual(initializedProfile.cadence, "schedule-driven");
    assert.strictEqual(initializedProfile.project_id, "commerce-operations-platform");
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
  assert.ok(evidenceSkill.includes("do not require a separate named coding constitution"));
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
