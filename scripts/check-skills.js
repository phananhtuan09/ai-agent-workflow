#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "skills");
const runtimes = [
  ["codex", path.join(root, ".agents/skills")],
  ["claude", path.join(root, ".claude/skills")],
];

function listFiles(dir, prefix = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "manifest.json") return [];
    const relative = path.join(prefix, entry.name);
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full, relative) : [relative];
  });
}

function normalize(file, runtime) {
  return fs
    .readFileSync(file, "utf8")
    .split(".agents/")
    .join(".runtime/")
    .split(".claude/")
    .join(".runtime/")
    .replace(/runtime: (codex|claude)/g, "runtime: runtime");
}

const failures = [];
for (const [runtime, destination] of runtimes) {
  if (!fs.existsSync(destination)) {
    failures.push(`${runtime}: adapter directory is missing; run npm run sync-skills`);
    continue;
  }
  for (const relative of listFiles(source)) {
    const expected = path.join(destination, relative);
    if (!fs.existsSync(expected)) {
      failures.push(`${runtime}: missing ${relative}`);
    } else if (
      normalize(path.join(source, relative), "codex") !== normalize(expected, runtime)
    ) {
      failures.push(`${runtime}: drift in ${relative}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Skill adapters match canonical skills.");
