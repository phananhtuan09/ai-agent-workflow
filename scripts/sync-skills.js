#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "skills");

function copyTree(sourcePath, destinationPath, runtime) {
  fs.mkdirSync(destinationPath, { recursive: true });
  fs.readdirSync(sourcePath, { withFileTypes: true }).forEach((entry) => {
    if (entry.name === "manifest.json") return;

    const from = path.join(sourcePath, entry.name);
    const to = path.join(destinationPath, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to, runtime);
      return;
    }

    let content = fs.readFileSync(from);
    if (entry.name.endsWith(".md") || entry.name.endsWith(".py")) {
      content = Buffer.from(
        content
          .toString("utf8")
          .split(".agents/")
          .join(runtime === "claude" ? ".claude/" : ".agents/")
          .split("runtime: codex")
          .join(`runtime: ${runtime}`)
      );
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, content);
  });
}

copyTree(source, path.join(root, ".agents/skills"), "codex");
copyTree(source, path.join(root, ".claude/skills"), "claude");
console.log("Synchronized canonical skills to Codex and Claude runtime folders.");
