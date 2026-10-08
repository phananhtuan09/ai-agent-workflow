#!/usr/bin/env node
// Stop hook: when the working tree changed since the last accepted stop,
// require the coder handoff status line before the turn may end.

const { readAccepted, readStdinJson, treeFingerprint, writeAccepted } = require("./gate-state");

const STATUS_LINE = /^[\s>*_`]*Status:\s*(HANDOFF|DECISION NEEDED|BLOCKED)\b/im;

function main() {
  const input = readStdinJson();
  if (input.stop_hook_active || !input.session_id) return;

  const fingerprint = treeFingerprint(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (!fingerprint || fingerprint.clean) return;
  if (readAccepted(input.session_id) === fingerprint.hash) return;

  if (STATUS_LINE.test(String(input.last_assistant_message || ""))) {
    writeAccepted(input.session_id, fingerprint.hash);
    return;
  }

  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        "Files changed since the last coder handoff. Finish validation per the coder contract " +
        "(project checks, focused proof, review-pr subagent), then end the turn with the handoff " +
        "starting with `Status: HANDOFF`, `Status: DECISION NEEDED`, or `Status: BLOCKED`.",
    })
  );
}

try {
  main();
} catch (_) {
  // Fail open: a broken gate must never trap the session.
}
