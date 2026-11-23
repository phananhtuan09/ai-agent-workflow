#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const skillsRoot = path.join(root, "skills");
const manifestPath = path.join(skillsRoot, "manifest.json");
const forbiddenMirrors = [
  path.join(root, ".agents/skills"),
  path.join(root, ".claude/skills"),
];
const failures = [];

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`Invalid skill manifest: ${error.message}`);
  process.exit(1);
}

if (manifest.source !== "skills") {
  failures.push(`manifest source must be "skills"; got ${JSON.stringify(manifest.source)}`);
}

forbiddenMirrors.forEach((directory) => {
  if (fs.existsSync(directory)) {
    failures.push(`generated runtime skill mirror must not exist: ${path.relative(root, directory)}`);
  }
});

const skillDirectories = fs.readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

skillDirectories.forEach((skillId) => {
  if (!fs.existsSync(path.join(skillsRoot, skillId, "SKILL.md"))) {
    failures.push(`canonical skill is missing SKILL.md: skills/${skillId}`);
  }
});

// Dependency-free strict check of the YAML frontmatter subset skills use:
// top-level `key: value` scalars plus indented blocks under an empty key.
// Lenient runtimes accept invalid YAML that strict ones (Codex, OpenCode) drop.
function checkFrontmatter(relativeDir, skillId) {
  const skillFile = path.join(root, relativeDir, skillId, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    return;
  }
  const label = `${relativeDir}/${skillId}/SKILL.md`;
  const lines = fs.readFileSync(skillFile, "utf8").split(/\r?\n/);
  if (lines[0] !== "---") {
    failures.push(`${label}: missing YAML frontmatter`);
    return;
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    failures.push(`${label}: unterminated YAML frontmatter`);
    return;
  }

  const fields = {};
  let blockKey = null;
  lines.slice(1, end).forEach((line, index) => {
    const lineLabel = `${label}:${index + 2}`;
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      return;
    }
    if (/^\s/.test(line)) {
      if (!blockKey) {
        failures.push(`${lineLabel}: indented line outside a block key`);
      }
      return;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):(?: (.*))?$/);
    if (!match) {
      failures.push(`${lineLabel}: expected "key: value"`);
      return;
    }
    const [, key, rawValue = ""] = match;
    const value = rawValue.trim();
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      failures.push(`${lineLabel}: duplicate key "${key}"`);
    }
    blockKey = value === "" ? key : null;
    fields[key] = value;

    if (value.startsWith('"')) {
      try {
        fields[key] = JSON.parse(value);
      } catch (error) {
        failures.push(`${lineLabel}: invalid double-quoted value for "${key}"`);
      }
    } else if (value.startsWith("'")) {
      if (value.length < 2 || !value.endsWith("'")) {
        failures.push(`${lineLabel}: unterminated single-quoted value for "${key}"`);
      }
      fields[key] = value.slice(1, -1).replace(/''/g, "'");
    } else if (/: |:$/.test(value)) {
      failures.push(`${lineLabel}: unquoted value for "${key}" contains ": "; wrap it in double quotes`);
    } else if (/ #/.test(value)) {
      failures.push(`${lineLabel}: unquoted value for "${key}" contains " #", which YAML reads as a comment; wrap it in double quotes`);
    }
  });

  if (fields.name !== skillId) {
    failures.push(`${label}: frontmatter name must be "${skillId}"; got ${JSON.stringify(fields.name)}`);
  }
  if (!fields.description) {
    failures.push(`${label}: frontmatter description is missing`);
  }
}

skillDirectories.forEach((skillId) => checkFrontmatter("skills", skillId));

const globalSkillsRoot = path.join(root, "global-skills");
if (fs.existsSync(globalSkillsRoot)) {
  fs.readdirSync(globalSkillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => checkFrontmatter("global-skills", entry.name));
}

const bundles = manifest.bundles || {};
const registeredSkills = new Set();
const visiting = new Set();

function visitBundle(bundleId) {
  if (visiting.has(bundleId)) {
    failures.push(`bundle cycle detected at ${bundleId}`);
    return;
  }
  const entries = bundles[bundleId];
  if (!Array.isArray(entries)) {
    failures.push(`bundle must be an array: ${bundleId}`);
    return;
  }

  visiting.add(bundleId);
  entries.forEach((entry) => {
    if (Object.prototype.hasOwnProperty.call(bundles, entry)) {
      visitBundle(entry);
    } else {
      registeredSkills.add(entry);
    }
  });
  visiting.delete(bundleId);
}

Object.keys(bundles).forEach(visitBundle);
registeredSkills.forEach((skillId) => {
  if (!fs.existsSync(path.join(skillsRoot, skillId, "SKILL.md"))) {
    failures.push(`registered skill is missing SKILL.md: ${skillId}`);
  }
});

Object.entries(manifest.kits || {}).forEach(([kitId, bundleIds]) => {
  if (!Array.isArray(bundleIds)) {
    failures.push(`kit bundles must be an array: ${kitId}`);
    return;
  }
  bundleIds.forEach((bundleId) => {
    if (!Object.prototype.hasOwnProperty.call(bundles, bundleId)) {
      failures.push(`kit ${kitId} references unknown bundle: ${bundleId}`);
    }
  });
});

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validated ${skillDirectories.length} canonical skills; no runtime mirrors present.`);
