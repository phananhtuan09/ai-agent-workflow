#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { adaptSkillContent } = require("../lib/skills");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "skills");

function copyTree(sourcePath, destinationPath, runtime, skillId) {
  fs.mkdirSync(destinationPath, { recursive: true });
  fs.readdirSync(sourcePath, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === "manifest.json") return;

    const from = path.join(sourcePath, entry.name);
    const to = path.join(destinationPath, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to, runtime, skillId || entry.name);
      return;
    }

    let content = fs.readFileSync(from);
    if (entry.name.endsWith(".md") || entry.name.endsWith(".py")) {
      content = Buffer.from(adaptSkillContent(content.toString("utf8"), runtime, skillId));
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, content);
  });
}

copyTree(source, path.join(root, ".agents/skills"), "codex");
copyTree(source, path.join(root, ".claude/skills"), "claude");
console.log("Synchronized canonical skills to Codex and Claude runtime folders.");
