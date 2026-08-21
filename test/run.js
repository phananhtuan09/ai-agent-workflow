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
    "brainstorm-partner",
    "design-spec",
    "create-spec",
    "execute-spec",
    "manual-checklist",
    "verify-feature",
    "verify-runtime",
    "execute-task",
    "review-pr",
    "prompt-leverage",
    "sync-spec",
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

test("coding-standard installs OpenCode agents without dependencies", () => {
  const result = runCli(["--kit", "coding-standard", "--tool", "opencode"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(
      fs.existsSync(path.join(result.workspace, ".opencode/agents/review-spec.md"))
    );
    assert.ok(!fs.existsSync(path.join(result.workspace, ".opencode/node_modules")));
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
    assert.ok(
      fs.existsSync(path.join(result.workspace, "docs/ai/project/WORKFLOW_LEARNING_STANDARD.md"))
    );
    const skill = fs.readFileSync(
      path.join(result.workspace, ".agents/skills/workflow-evaluation/SKILL.md"),
      "utf8"
    );
    assert.ok(skill.includes(".agents/skills/workflow-evaluation/extract_session_trace.py"));
    assert.ok(fs.existsSync(path.join(result.workspace, ".codex/agents/review-spec.toml")));
  } finally {
    result.cleanup();
  }
});

test("workflow-eval installs Claude subagents", () => {
  const result = runCli(["--kit", "workflow-eval", "--tool", "claude"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(path.join(result.workspace, ".claude/agents/review-spec.md")));
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
    const casePath = path.join(result.workspace, "docs/ai/learning/cases/inventory-reservation.json");
    const projectPath = path.join(result.workspace, "docs/ai/learning/project.json");
    const schedulePath = path.join(result.workspace, "docs/ai/learning/schedule.json");
    const standardPath = path.join(result.workspace, "docs/ai/project/WORKFLOW_LEARNING_STANDARD.md");
    const initPath = path.join(skillRoot, "scripts/init_learning_session.py");
    const contextPath = path.join(skillRoot, "scripts/update_learning_context.py");
    const updatePath = path.join(skillRoot, "scripts/update_learning_state.py");
    const validatePath = path.join(skillRoot, "scripts/validate_learning_state.py");
    const profilePath = path.join(result.workspace, "docs/ai/learning/profile.json");
    const sessionPath = path.join(result.workspace, "docs/ai/learning/sessions/inventory-reservation-001.json");

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
    assert.ok(coordinator.includes("WORKFLOW_LEARNING_STANDARD.md"));
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
      casePath: path.join(result.workspace, "docs/ai/learning/cases/inventory-reservation.json"),
      projectPath: path.join(result.workspace, "docs/ai/learning/project.json"),
      schedulePath: path.join(result.workspace, "docs/ai/learning/schedule.json"),
      profilePath: path.join(result.workspace, "docs/ai/learning/profile.json"),
      sessionPath: path.join(result.workspace, "docs/ai/learning/sessions/controlled-lifecycle.json"),
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
    const casePath = path.join(result.workspace, "docs/ai/learning/cases/inventory-reservation.json");
    const projectPath = path.join(result.workspace, "docs/ai/learning/project.json");
    const schedulePath = path.join(result.workspace, "docs/ai/learning/schedule.json");
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
    assert.ok(!fs.existsSync(path.join(result.workspace, "docs/ai/project/WORKFLOW_LEARNING_CONSTITUTION.md")));
  } finally {
    result.cleanup();
  }
});

test("learning validator rejects malformed case contracts", () => {
  const result = runCli(["--kit", "learning-workflow", "--tool", "codex"]);
  try {
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    const skillRoot = path.join(result.workspace, ".agents/skills/learning-workflow");
    const casePath = path.join(result.workspace, "docs/ai/learning/cases/inventory-reservation.json");
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
    const projectPath = path.join(result.workspace, "docs/ai/learning/project.json");
    const schedulePath = path.join(result.workspace, "docs/ai/learning/schedule.json");
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
      casePath: path.join(result.workspace, "docs/ai/learning/cases/inventory-reservation.json"),
      projectPath: path.join(result.workspace, "docs/ai/learning/project.json"),
      schedulePath: path.join(result.workspace, "docs/ai/learning/schedule.json"),
      profilePath: path.join(result.workspace, "docs/ai/learning/profile.json"),
      sessionPath: path.join(result.workspace, "docs/ai/learning/sessions/prior-help.json"),
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

test("temporary package workspace can be created", () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-workflow-test-"));
  assert.ok(fs.existsSync(workspace));
  fs.rmSync(workspace, { recursive: true, force: true });
});
