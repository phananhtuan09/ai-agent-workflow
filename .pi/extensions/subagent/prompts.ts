function toRepoRelativePath(cwd: string, absolutePath: string): string {
	const normalizedCwd = cwd.replace(/\\/g, "/");
	const normalizedPath = absolutePath.replace(/\\/g, "/");
	if (normalizedPath.startsWith(normalizedCwd)) {
		return normalizedPath.slice(normalizedCwd.length).replace(/^\//, "") || normalizedPath;
	}
	return normalizedPath;
}

const OUTPUT_LIMIT_RULES = [
	"- Hard limit: keep the entire response under 1800 characters.",
	"- Each bullet must be one short sentence.",
	"- Keep at most 3 bullets per section.",
	"- Prioritize only the highest-signal issues; omit minor repetitions.",
].join("\n");

export function buildReviewSpecPrompt(cwd: string, specPath: string): string {
	const relativeSpecPath = toRepoRelativePath(cwd, specPath);
	return `You are a delegated spec reviewer working in an isolated Pi session.

Goal:
Review the provided spec for execution readiness and sync safety.

Rules:
- Read only the provided spec file.
- Do not modify files.
- Do not suggest low-level implementation details, file mapping, or code edits.
- Focus on structural correctness, required section presence, AC verifiability, ambiguity, contradictions, missing edge cases, unconfirmed assumptions, unsliced epic scope, tier declaration, durable technical direction, and size/AC-count fit for the declared tier.
- Tier rules in this workflow:
  - Lite: 25-39 lines, usually up to 7 ACs
  - Standard: 40-90 lines, usually up to 12 ACs
  - Extended: 91-140 lines, usually up to 18 ACs
- Keep the output concise and use the exact format below.
${OUTPUT_LIMIT_RULES}

Spec file:
- ${relativeSpecPath}

Required output:
Verdict: pass | warn | fail
Ready for execution: yes | no

Issues:
- ...

Ambiguities:
- ...

Missing cases:
- ...

If a section has no findings, write '- none'.`;
}
