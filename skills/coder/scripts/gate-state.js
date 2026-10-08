// Shared working-tree fingerprint and per-session state for the coder hooks.
// Every helper fails open: callers treat a null result as "do not gate".

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const MAX_UNTRACKED_FILES = 500;
const MAX_HASHED_BYTES = 1024 * 1024;

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

function treeFingerprint(cwd) {
  if (!cwd || git(cwd, ["rev-parse", "--is-inside-work-tree"]) === null) return null;

  const status = git(cwd, ["status", "--porcelain=v1", "-uall"]);
  const unstaged = git(cwd, ["diff", "--no-ext-diff", "--binary"]);
  const staged = git(cwd, ["diff", "--no-ext-diff", "--binary", "--cached"]);
  const untracked = git(cwd, ["ls-files", "--others", "--exclude-standard", "-z"]);
  const root = git(cwd, ["rev-parse", "--show-toplevel"]);
  if ([status, unstaged, staged, untracked, root].includes(null)) return null;

  const statusText = status.toString("utf8");
  if (statusText.trim() === "") return { clean: true, hash: "clean" };

  const hash = crypto.createHash("sha256");
  hash.update(statusText).update(unstaged).update(staged);

  const topLevel = root.toString("utf8").trim();
  untracked
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .slice(0, MAX_UNTRACKED_FILES)
    .forEach((relativePath) => {
      hash.update(relativePath);
      try {
        const filePath = path.join(topLevel, relativePath);
        const stat = fs.statSync(filePath);
        if (stat.isFile() && stat.size <= MAX_HASHED_BYTES) {
          hash.update(fs.readFileSync(filePath));
        } else {
          hash.update(`${stat.size}:${stat.mtimeMs}`);
        }
      } catch (_) {
        // A file can disappear between listing and reading; its path is enough.
      }
    });

  return { clean: false, hash: hash.digest("hex") };
}

function statePath(sessionId) {
  const safeId = String(sessionId || "").replace(/[^A-Za-z0-9_-]/g, "_");
  if (!safeId) return null;
  return path.join(os.tmpdir(), "claude-coder-gate", safeId);
}

function readAccepted(sessionId) {
  const file = statePath(sessionId);
  if (!file) return null;
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch (_) {
    return null;
  }
}

function writeAccepted(sessionId, hash) {
  const file = statePath(sessionId);
  if (!file || !hash) return;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, hash);
  } catch (_) {
    // State is an optimization; without it the gate only asks for a handoff again.
  }
}

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

module.exports = { readAccepted, readStdinJson, treeFingerprint, writeAccepted };
