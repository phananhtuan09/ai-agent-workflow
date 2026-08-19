#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { adaptSkillContent } = require("../lib/skills");

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

const failures = [];
let checkedAdapters = 0;
for (const [runtime, destination] of runtimes) {
  if (!fs.existsSync(destination)) {
    continue;
  }
  checkedAdapters += 1;
  for (const relative of listFiles(source)) {
    const expected = path.join(destination, relative);
    if (!fs.existsSync(expected)) {
      failures.push(`${runtime}: missing ${relative}`);
    } else if (
      adaptSkillContent(
        fs.readFileSync(path.join(source, relative), "utf8"),
        runtime,
        relative.split(path.sep)[0]
      ) !== fs.readFileSync(expected, "utf8")
    ) {
      failures.push(`${runtime}: drift in ${relative}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  checkedAdapters
    ? "Generated skill adapters match canonical skills."
    : "Canonical skills are valid; no generated adapters are present."
);
