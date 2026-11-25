#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { checkFrontmatter } = require("./skill-frontmatter");

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

function checkSkillFile(relativeDir, skillId) {
  const skillFile = path.join(root, relativeDir, skillId, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    return;
  }
  const label = `${relativeDir}/${skillId}/SKILL.md`;
  const { fields, errors } = checkFrontmatter(fs.readFileSync(skillFile, "utf8"));
  errors.forEach(({ line, message }) => failures.push(`${label}:${line}: ${message}`));
  if (errors.some(({ message }) => message.endsWith("YAML frontmatter"))) {
    return;
  }
  if (fields.name !== skillId) {
    failures.push(`${label}: frontmatter name must be "${skillId}"; got ${JSON.stringify(fields.name)}`);
  }
  if (!fields.description) {
    failures.push(`${label}: frontmatter description is missing`);
  }
}

skillDirectories.forEach((skillId) => checkSkillFile("skills", skillId));

const globalSkillsRoot = path.join(root, "global-skills");
if (fs.existsSync(globalSkillsRoot)) {
  fs.readdirSync(globalSkillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => checkSkillFile("global-skills", entry.name));
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
