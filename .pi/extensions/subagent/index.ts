import type { ExtensionAPI, ExtensionContext, WorkingIndicatorOptions } from "@earendil-works/pi-coding-agent";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Type } from "typebox";
import {
	buildExplorePrompt,
	buildReadinessBriefPrompt,
	buildReviewPlanPrompt,
	buildReviewReadinessPrompt,
	buildReviewSpecPrompt,
} from "./prompts.ts";
import { resolveExistingPaths, runDelegatedReview } from "./delegated-runner.ts";

const REVIEW_TOOLS = ["read"];
const EXPLORE_TOOLS = ["read", "bash"];
const STATUS_KEY = "subagent";
const LOADING_INDICATOR_ID = "subagent-loading";
const STATUS_CLEAR_DELAY_MS = 4000;
const RESULT_PREVIEW_LIMIT = 1200;
let clearStatusTimer: ReturnType<typeof setTimeout> | undefined;

function getLoadingIndicator(ctx: ExtensionContext): WorkingIndicatorOptions {
	const theme = ctx.ui.theme;
	return {
		frames: [
			theme.fg("accent", "⠋"),
			theme.fg("accent", "⠙"),
			theme.fg("accent", "⠹"),
			theme.fg("accent", "⠸"),
			theme.fg("accent", "⠼"),
			theme.fg("accent", "⠴"),
			theme.fg("accent", "⠦"),
			theme.fg("accent", "⠧"),
			theme.fg("accent", "⠇"),
			theme.fg("accent", "⠏"),
		],
		intervalMs: 80,
	};
}

function cancelStatusClearTimer() {
	if (clearStatusTimer) {
		clearTimeout(clearStatusTimer);
		clearStatusTimer = undefined;
	}
}

function scheduleStatusClear(ctx: ExtensionContext) {
	cancelStatusClearTimer();
	clearStatusTimer = setTimeout(() => {
		try {
			ctx.ui.setStatus(STATUS_KEY, undefined);
		} catch {
			// Ignore stale extension context after command/session teardown.
		}
		clearStatusTimer = undefined;
	}, STATUS_CLEAR_DELAY_MS);
}

function setRunningStatus(ctx: ExtensionContext, label: string) {
	cancelStatusClearTimer();
	const theme = ctx.ui.theme;
	ctx.ui.setWorkingIndicator(getLoadingIndicator(ctx));
	ctx.ui.setStatus(STATUS_KEY, theme.fg("accent", "◌") + theme.fg("dim", ` ${label}...`));
}

function setDoneStatus(ctx: ExtensionContext, label: string, isSuccess: boolean) {
	const theme = ctx.ui.theme;
	const icon = isSuccess ? theme.fg("success", "✓") : theme.fg("warning", "!");
	ctx.ui.setWorkingIndicator();
	ctx.ui.setStatus(STATUS_KEY, icon + theme.fg("dim", ` ${label}`));
	scheduleStatusClear(ctx);
}

function showLoadingMessage(_pi: ExtensionAPI, _label: string) {
	// Intentionally no-op: avoid high-contrast custom follow-up cards for transient loading state.
}

function hasFlag(args: string, flag: string): boolean {
	return new RegExp(`(^|\\s)${flag}(?=\\s|$)`).test(args);
}

function removeFlag(args: string, flag: string): string {
	return args.replace(new RegExp(`(^|\\s)${flag}(?=\\s|$)`, "g"), " ").replace(/\s+/g, " ").trim();
}

function getReviewPrefix(exitCode: number, successLabel: string, failureLabel: string): string {
	return exitCode === 0 ? `${successLabel}:\n\n` : `${failureLabel}:\n\n`;
}

function toPreview(text: string): string {
	return text.length <= RESULT_PREVIEW_LIMIT ? text : `${text.slice(0, RESULT_PREVIEW_LIMIT).trimEnd()}\n\n...[truncated]`;
}

interface PlanPhase {
	name: string;
	tasks: string[];
}

interface ReadinessPacket {
	specPath: string;
	planPath: string;
	detailPaths: string[];
}

function stripEnrichSummary(content: string): string {
	const marker = "\n## Enrich Summary\n";
	const index = content.indexOf(marker);
	return index >= 0 ? content.slice(0, index).trimEnd() : content.trimEnd();
}

function parsePlanPhases(content: string): PlanPhase[] {
	const tasksSectionMatch = content.match(/## Tasks\s*\n([\s\S]*?)(?:\n## |$)/);
	if (!tasksSectionMatch) {
		throw new Error("Plan is missing a ## Tasks section.");
	}

	const section = tasksSectionMatch[1];
	const phaseRegex = /^###\s+(.+)$/gm;
	const phases: PlanPhase[] = [];
	const matches = [...section.matchAll(phaseRegex)];
	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const phaseName = match[1].trim();
		const start = match.index! + match[0].length;
		const end = index + 1 < matches.length ? matches[index + 1].index! : section.length;
		const block = section.slice(start, end);
		const tasks = [...block.matchAll(/^\s*- \[ \]\s+(.+)$/gm)].map((taskMatch) => taskMatch[1].trim());
		phases.push({ name: phaseName, tasks });
	}

	if (phases.length === 0) {
		throw new Error("Plan has no phases under ## Tasks.");
	}

	for (const phase of phases) {
		if (phase.tasks.length === 0) {
			throw new Error(`Phase \"${phase.name}\" has no unchecked tasks to enrich.`);
		}
	}

	return phases;
}

function normalizePhaseDisplayName(phaseName: string): string {
	return phaseName.replace(/^Phase\s+\d+:\s*/i, "").trim();
}

function parseExploreSection(result: string, sectionName: string): string[] {
	const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`^${escapedName}:\\s*\\r?\\n([\\s\\S]*?)(?=^\\S.*:\\s*$|$)`, "m");
	const match = result.match(regex);
	if (!match) return [];
	return match[1]
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith("- ") && line !== "- none");
}

function formatPhaseDetails(phaseNumber: number, phaseName: string, exploreResult: string): string {
	const filesToModify = parseExploreSection(exploreResult, "Files to modify");
	const filesToCreate = parseExploreSection(exploreResult, "Files to create");
	const relevantSymbols = parseExploreSection(exploreResult, "Relevant symbols");
	const notes = parseExploreSection(exploreResult, "Notes").slice(0, 3);
	const displayPhaseName = normalizePhaseDisplayName(phaseName);

	const sections = [`## Phase ${phaseNumber} Details — ${displayPhaseName}`, ""];
	sections.push("### Files to modify");
	sections.push(...(filesToModify.length > 0 ? filesToModify : ["- none"]));
	sections.push("");
	sections.push("### Files to create");
	sections.push(...(filesToCreate.length > 0 ? filesToCreate : ["- none"]));
	sections.push("");
	sections.push("### Relevant symbols");
	sections.push(...(relevantSymbols.length > 0 ? relevantSymbols : ["- none"]));
	if (notes.length > 0) {
		sections.push("");
		sections.push("### Notes");
		sections.push(...notes);
	}

	return sections.join("\n") + "\n";
}

function countNonNoneBullets(lines: string[]): number {
	return lines.filter((line) => line !== "- none").length;
}

function buildEnrichSummary(planPath: string, phaseSummaries: Array<{ name: string; detailPath: string; modified: number; created: number }>): string {
	const totalModified = phaseSummaries.reduce((sum, phase) => sum + phase.modified, 0);
	const totalCreated = phaseSummaries.reduce((sum, phase) => sum + phase.created, 0);
	const totalFiles = totalModified + totalCreated;
	const phaseBreakdown = phaseSummaries.map((phase) => `${phase.name}: ${phase.modified + phase.created} files`).join(" · ");
	const detailLines = phaseSummaries
		.map((phase, index) => {
			const relativeDetailPath = phase.detailPath.replace(/\\/g, "/");
			return `- Phase ${index + 1} → ${relativeDetailPath}`;
		})
		.join("\n");

	return `\n\n## Enrich Summary\nTotal files: ${totalFiles} (${totalModified} modified, ${totalCreated} created)\n${phaseBreakdown}\n\nDetails:\n${detailLines}\n`;
}

async function runDelegatedCommand(params: {
	cwd: string;
	prompt: string;
	signal: AbortSignal;
	tools: string[];
}) {
	return runDelegatedReview({
		cwd: params.cwd,
		prompt: params.prompt,
		tools: params.tools,
		signal: params.signal,
	});
}

async function runReviewReadinessPacket(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	packet: ReadinessPacket,
	customType = "subagent-review-readiness",
): Promise<{ exitCode: number; finalText: string; stderr: string }> {
	ctx.ui.notify(`Running isolated readiness review for ${2 + packet.detailPaths.length} artifacts`, "info");
	setRunningStatus(ctx, "Delegated readiness review running");
	showLoadingMessage(pi, "readiness review");
	const result = await runDelegatedCommand({
		cwd: ctx.cwd,
		prompt: buildReviewReadinessPrompt(ctx.cwd, packet.specPath, packet.planPath, packet.detailPaths),
		tools: REVIEW_TOOLS,
		signal: ctx.signal,
	});

	setDoneStatus(ctx, "Delegated readiness review complete", result.exitCode === 0);
	ctx.ui.notify(
		result.exitCode === 0 ? "Readiness review complete" : "Readiness review failed",
		result.exitCode === 0 ? "info" : "error",
	);
	pi.sendMessage(
		{
			customType,
			content: `${getReviewPrefix(result.exitCode, "Delegated readiness review complete", "Delegated readiness review failed")}${toPreview(result.finalText)}`,
			display: true,
			details: { exitCode: result.exitCode, stderr: result.stderr },
		},
		{ triggerTurn: false, deliverAs: "followUp" },
	);

	return result;
}

export default function subagentExtension(pi: ExtensionAPI) {
	pi.registerCommand("review-plan", {
		description: "Review a plan file before enrichment with an isolated delegated Pi run",
		handler: async (args, ctx) => {
			if (!args.trim()) {
				ctx.ui.notify("Usage: /review-plan @docs/ai/plans/<file>.md", "warning");
				return;
			}
			if (!ctx.isIdle()) {
				ctx.ui.notify("Wait for the current run to finish before starting a delegated review.", "warning");
				return;
			}

			try {
				const [planPath] = await resolveExistingPaths(ctx.cwd, args);
				ctx.ui.notify(`Running isolated plan review for ${planPath}`, "info");
				setRunningStatus(ctx, "Delegated plan review running");
				showLoadingMessage(pi, "plan review");
				const result = await runDelegatedCommand({
					cwd: ctx.cwd,
					prompt: buildReviewPlanPrompt(ctx.cwd, planPath),
					tools: REVIEW_TOOLS,
					signal: ctx.signal,
				});

				setDoneStatus(ctx, "Delegated plan review complete", result.exitCode === 0);
				ctx.ui.notify(result.exitCode === 0 ? "Plan review complete" : "Plan review failed", result.exitCode === 0 ? "info" : "error");
				pi.sendMessage(
					{
						customType: "subagent-review-plan",
						content: `${getReviewPrefix(result.exitCode, "Delegated plan review complete", "Delegated plan review failed")}${toPreview(result.finalText)}`,
						display: true,
						details: { exitCode: result.exitCode, stderr: result.stderr },
					},
					{ triggerTurn: false, deliverAs: "followUp" },
				);
			} catch (error) {
				setDoneStatus(ctx, "Delegated plan review failed", false);
				ctx.ui.notify(error instanceof Error ? error.message : "Plan review failed", "error");
			}
		},
	});

	pi.registerCommand("review-spec", {
		description: "Review a spec file with an isolated delegated Pi run",
		handler: async (args, ctx) => {
			if (!args.trim()) {
				ctx.ui.notify("Usage: /review-spec @docs/ai/specs/<file>.md", "warning");
				return;
			}
			if (!ctx.isIdle()) {
				ctx.ui.notify("Wait for the current run to finish before starting a delegated review.", "warning");
				return;
			}

			try {
				const [specPath] = await resolveExistingPaths(ctx.cwd, args);
				ctx.ui.notify(`Running isolated spec review for ${specPath}`, "info");
				setRunningStatus(ctx, "Delegated spec review running");
				showLoadingMessage(pi, "spec review");
				const result = await runDelegatedCommand({
					cwd: ctx.cwd,
					prompt: buildReviewSpecPrompt(ctx.cwd, specPath),
					tools: REVIEW_TOOLS,
					signal: ctx.signal,
				});

				setDoneStatus(ctx, "Delegated spec review complete", result.exitCode === 0);
				ctx.ui.notify(result.exitCode === 0 ? "Spec review complete" : "Spec review failed", result.exitCode === 0 ? "info" : "error");
				pi.sendMessage(
					{
						customType: "subagent-review-spec",
						content: `${getReviewPrefix(result.exitCode, "Delegated spec review complete", "Delegated spec review failed")}${toPreview(result.finalText)}`,
						display: true,
						details: { exitCode: result.exitCode, stderr: result.stderr },
					},
					{ triggerTurn: false, deliverAs: "followUp" },
				);
			} catch (error) {
				setDoneStatus(ctx, "Delegated spec review failed", false);
				ctx.ui.notify(error instanceof Error ? error.message : "Spec review failed", "error");
			}
		},
	});

	pi.registerCommand("readiness-brief", {
		description: "Summarize the top execution focus areas from a reviewed artifact packet",
		handler: async (args, ctx) => {
			if (!args.trim()) {
				ctx.ui.notify("Usage: /readiness-brief @spec.md @plan.md @detail-1.md [@detail-2.md ...]", "warning");
				return;
			}
			if (!ctx.isIdle()) {
				ctx.ui.notify("Wait for the current run to finish before starting a delegated review.", "warning");
				return;
			}

			try {
				const resolvedPaths = await resolveExistingPaths(ctx.cwd, args);
				if (resolvedPaths.length < 3) {
					ctx.ui.notify("Provide at least a spec, a plan, and one details file.", "warning");
					return;
				}

				const [specPath, planPath, ...detailPaths] = resolvedPaths;
				ctx.ui.notify(`Running isolated readiness brief for ${resolvedPaths.length} artifacts`, "info");
				setRunningStatus(ctx, "Delegated readiness brief running");
				showLoadingMessage(pi, "readiness brief");
				const result = await runDelegatedCommand({
					cwd: ctx.cwd,
					prompt: buildReadinessBriefPrompt(ctx.cwd, specPath, planPath, detailPaths),
					tools: REVIEW_TOOLS,
					signal: ctx.signal,
				});

				setDoneStatus(ctx, "Delegated readiness brief complete", result.exitCode === 0);
				ctx.ui.notify(result.exitCode === 0 ? "Readiness brief complete" : "Readiness brief failed", result.exitCode === 0 ? "info" : "error");
				pi.sendMessage(
					{
						customType: "subagent-readiness-brief",
						content: `${getReviewPrefix(result.exitCode, "Delegated readiness brief complete", "Delegated readiness brief failed")}${toPreview(result.finalText)}`,
						display: true,
						details: { exitCode: result.exitCode, stderr: result.stderr },
					},
					{ triggerTurn: false, deliverAs: "followUp" },
				);
			} catch (error) {
				setDoneStatus(ctx, "Delegated readiness brief failed", false);
				ctx.ui.notify(error instanceof Error ? error.message : "Readiness brief failed", "error");
			}
		},
	});

	pi.registerCommand("review-readiness", {
		description: "Review planning artifacts with an isolated delegated Pi run",
		handler: async (args, ctx) => {
			if (!args.trim()) {
				ctx.ui.notify("Usage: /review-readiness @spec.md @plan.md @detail-1.md [@detail-2.md ...] [--brief]", "warning");
				return;
			}
			if (!ctx.isIdle()) {
				ctx.ui.notify("Wait for the current run to finish before starting a delegated review.", "warning");
				return;
			}

			try {
				const withBrief = hasFlag(args, "--brief");
				const cleanedArgs = removeFlag(args, "--brief");
				const resolvedPaths = await resolveExistingPaths(ctx.cwd, cleanedArgs);
				if (resolvedPaths.length < 3) {
					ctx.ui.notify("Provide at least a spec, a plan, and one details file.", "warning");
					return;
				}

				const [specPath, planPath, ...detailPaths] = resolvedPaths;
				await runReviewReadinessPacket(pi, ctx, { specPath, planPath, detailPaths });

				if (withBrief) {
					ctx.ui.notify("Auto-running readiness brief for the reviewed packet", "info");
					setRunningStatus(ctx, "Delegated readiness brief running");
					showLoadingMessage(pi, "readiness brief");
					const briefResult = await runDelegatedCommand({
						cwd: ctx.cwd,
						prompt: buildReadinessBriefPrompt(ctx.cwd, specPath, planPath, detailPaths),
						tools: REVIEW_TOOLS,
						signal: ctx.signal,
					});
					setDoneStatus(ctx, "Delegated readiness brief complete", briefResult.exitCode === 0);
					ctx.ui.notify(briefResult.exitCode === 0 ? "Readiness brief complete" : "Readiness brief failed", briefResult.exitCode === 0 ? "info" : "error");
					pi.sendMessage(
						{
							customType: "subagent-readiness-brief",
							content: `${getReviewPrefix(briefResult.exitCode, "Delegated readiness brief complete", "Delegated readiness brief failed")}${toPreview(briefResult.finalText)}`,
							display: true,
							details: { exitCode: briefResult.exitCode, stderr: briefResult.stderr, auto: true },
						},
						{ triggerTurn: false, deliverAs: "followUp" },
					);
				}
			} catch (error) {
				setDoneStatus(ctx, "Delegated readiness review failed", false);
				ctx.ui.notify(error instanceof Error ? error.message : "Readiness review failed", "error");
			}
		},
	});

	pi.registerCommand("enrich-plan-pi", {
		description: "Enrich a plan with Pi-only delegated phase exploration",
		handler: async (args, ctx) => {
			if (!args.trim()) {
				ctx.ui.notify("Usage: /enrich-plan-pi docs/ai/plans/<file>.md [--review-plan]", "warning");
				return;
			}
			if (!ctx.isIdle()) {
				ctx.ui.notify("Wait for the current run to finish before starting delegated enrichment.", "warning");
				return;
			}

			try {
				const withPlanReview = hasFlag(args, "--review-plan");
				const cleanedArgs = removeFlag(args, "--review-plan");
				const [planAbsolutePath] = await resolveExistingPaths(ctx.cwd, cleanedArgs);
				const planRelativePath = path.relative(ctx.cwd, planAbsolutePath).replace(/\\/g, "/");

				if (withPlanReview) {
					ctx.ui.notify("Auto-running plan review before enrichment", "info");
					setRunningStatus(ctx, "Delegated plan review running");
					showLoadingMessage(pi, "plan review");
					const planReviewResult = await runDelegatedCommand({
						cwd: ctx.cwd,
						prompt: buildReviewPlanPrompt(ctx.cwd, planAbsolutePath),
						tools: REVIEW_TOOLS,
						signal: ctx.signal,
					});
					setDoneStatus(ctx, "Delegated plan review complete", planReviewResult.exitCode === 0);
					ctx.ui.notify(planReviewResult.exitCode === 0 ? "Plan review complete" : "Plan review failed", planReviewResult.exitCode === 0 ? "info" : "error");
					pi.sendMessage(
						{
							customType: "subagent-review-plan",
							content: `${getReviewPrefix(planReviewResult.exitCode, "Delegated plan review complete", "Delegated plan review failed")}${toPreview(planReviewResult.finalText)}`,
							display: true,
							details: { exitCode: planReviewResult.exitCode, stderr: planReviewResult.stderr, auto: true },
						},
						{ triggerTurn: false, deliverAs: "followUp" },
					);
				}

				const originalPlan = await fs.readFile(planAbsolutePath, "utf8");
				const phases = parsePlanPhases(originalPlan);
				const planDir = path.dirname(planAbsolutePath);
				const planBaseName = path.basename(planAbsolutePath, path.extname(planAbsolutePath));
				const phaseSummaries: Array<{ name: string; detailPath: string; modified: number; created: number }> = [];

				ctx.ui.notify(`Running Pi-only enrich for ${phases.length} phase(s)`, "info");
				showLoadingMessage(pi, "plan enrichment");

				for (let index = 0; index < phases.length; index += 1) {
					const phase = phases[index];
					setRunningStatus(ctx, `Exploring ${phase.name}`);
					const result = await runDelegatedReview({
						cwd: ctx.cwd,
						prompt: buildExplorePrompt(phase.name, phase.tasks),
						tools: EXPLORE_TOOLS,
						signal: ctx.signal,
					});

					const detailAbsolutePath = path.join(planDir, `${planBaseName}-phase-${index + 1}-details.md`);
					const detailRelativePath = path.relative(ctx.cwd, detailAbsolutePath).replace(/\\/g, "/");
					const detailContent = formatPhaseDetails(index + 1, phase.name, result.finalText);
					await fs.writeFile(detailAbsolutePath, detailContent, "utf8");

					phaseSummaries.push({
						name: phase.name,
						detailPath: detailRelativePath,
						modified: countNonNoneBullets(parseExploreSection(result.finalText, "Files to modify")),
						created: countNonNoneBullets(parseExploreSection(result.finalText, "Files to create")),
					});
				}

				const updatedPlan = stripEnrichSummary(originalPlan) + buildEnrichSummary(planRelativePath, phaseSummaries);
				await fs.writeFile(planAbsolutePath, updatedPlan.endsWith("\n") ? updatedPlan : `${updatedPlan}\n`, "utf8");

				setDoneStatus(ctx, "Pi-only enrich complete", true);
				ctx.ui.notify(`Enrich complete: ${phaseSummaries.length} phase(s)`, "info");
				pi.sendMessage(
					{
						customType: "subagent-enrich-plan",
						content: `Pi-only enrich complete for ${planRelativePath}.\n\nGenerated details:\n${phaseSummaries.map((phase, index) => `- Phase ${index + 1}: ${phase.detailPath}`).join("\n")}`,
						display: true,
						details: { planPath: planRelativePath, phases: phaseSummaries.length, autoReviewed: withPlanReview },
					},
					{ triggerTurn: false, deliverAs: "followUp" },
				);
			} catch (error) {
				setDoneStatus(ctx, "Pi-only enrich failed", false);
				ctx.ui.notify(error instanceof Error ? error.message : "Pi-only enrich failed", "error");
			}
		},
	});

	pi.registerTool({
		name: "explore_phase",
		label: "Explore Phase",
		description: "Internal read-only explore worker for enrich-plan",
		parameters: Type.Object({
			phaseName: Type.String({ description: "Phase name from the plan" }),
			tasks: Type.Array(Type.String(), { description: "Intent-based tasks for this phase" }),
		}),
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			const phaseName = params.phaseName.trim();
			const tasks = params.tasks.map((task) => task.trim()).filter(Boolean);
			if (!phaseName) {
				return {
					content: [{ type: "text", text: "Files to modify:\n- none\n\nFiles to create:\n- none\n\nRelevant symbols:\n- none\n\nNotes:\n- invalid input: phaseName is required" }],
					details: { exitCode: 1, stderr: "phaseName is required" },
				};
			}
			if (tasks.length === 0) {
				return {
					content: [{ type: "text", text: "Files to modify:\n- none\n\nFiles to create:\n- none\n\nRelevant symbols:\n- none\n\nNotes:\n- invalid input: at least one task is required" }],
					details: { exitCode: 1, stderr: "at least one task is required" },
				};
			}

			setRunningStatus(ctx, `Exploring ${phaseName}`);
			const result = await runDelegatedReview({
				cwd: ctx.cwd,
				prompt: buildExplorePrompt(phaseName, tasks),
				tools: EXPLORE_TOOLS,
				signal,
			});
			setDoneStatus(ctx, `Explore complete for ${phaseName}`, result.exitCode === 0);

			return {
				content: [{ type: "text", text: result.finalText }],
				details: { exitCode: result.exitCode, stderr: result.stderr },
			};
		},
	});
}
