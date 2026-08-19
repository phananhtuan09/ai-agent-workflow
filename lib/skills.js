const fs = require("fs");
const path = require("path");

function readSkillManifest(sourceRoot) {
  const manifestPath = path.join(sourceRoot, "skills", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Skill manifest not found: ${manifestPath}`);
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function adaptSkillContent(content, runtime, skillId) {
  const runtimeRoot = runtime === "claude" ? ".claude/skills" : ".agents/skills";
  return content
    .split(`skills/${skillId}/`)
    .join(`${runtimeRoot}/${skillId}/`)
    .split(".agents/")
    .join(runtime === "claude" ? ".claude/" : ".agents/")
    .replace(/runtime: (codex|claude)/g, `runtime: ${runtime}`);
}

function expandBundle(manifest, bundleId, seen = new Set()) {
  if (seen.has(bundleId)) return [];
  seen.add(bundleId);

  const bundle = manifest.bundles[bundleId];
  if (!bundle) {
    throw new Error(`Unknown skill bundle: ${bundleId}`);
  }

  return bundle.flatMap((item) =>
    manifest.bundles[item] ? expandBundle(manifest, item, seen) : [item]
  );
}

function resolveSkills({ sourceRoot, kitId, extraSkills = [], extraBundles = [] }) {
  const manifest = readSkillManifest(sourceRoot);
  const kitBundles = manifest.kits[kitId];
  if (!kitBundles) throw new Error(`No skill bundles registered for kit: ${kitId}`);

  const skillIds = [...new Set([
    ...kitBundles.flatMap((bundleId) => expandBundle(manifest, bundleId)),
    ...extraBundles.flatMap((bundleId) => expandBundle(manifest, bundleId)),
    ...extraSkills,
  ])];

  skillIds.forEach((skillId) => {
    const skillPath = path.join(sourceRoot, "skills", skillId);
    if (!fs.existsSync(path.join(skillPath, "SKILL.md"))) {
      throw new Error(`Canonical skill not found: ${skillId}`);
    }
  });

  return { manifest, skillIds };
}

module.exports = { adaptSkillContent, readSkillManifest, resolveSkills };
