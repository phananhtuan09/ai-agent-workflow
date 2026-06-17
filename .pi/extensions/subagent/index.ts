import type { ExtensionAPI, ExtensionContext, WorkingIndicatorOptions } from "@earendil-works/pi-coding-agent";
import { Box, Text } from "@earendil-works/pi-tui";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildReviewSpecPrompt } from "./prompts.ts";
import { resolveExistingPaths, runDelegatedReview } from "./delegated-runner.ts";

const REVIEW_TOOLS = ["read"];
const STATUS_KEY = "subagent";
const WIDGET_KEY = "subagent-progress";
const SUBAGENT_ACTIVE_FILE = ".pi/workflows/.subagent-active";
const STATUS_CLEAR_DELAY_MS = 4000;
const PROGRESS_CLEAR_DELAY_MS = 8000;
const MESSAGE_BODY_PREVIEW_LIMIT = 600;
const PROGRESS_ACTIVITY_LIMIT = 4;
const LONG_RUNNING_AFTER_MS = 15000;
const SUBAGENT_VIETNAMESE_RULE = [
	"Additional required rule:",
	"- Respond in Vietnamese.",
	"- If the prompt requires an exact output format, required headings, labels, checklist markers, or file structure, keep that format exactly as requested and write the content under it in Vietnamese.",
	"- Keep code, identifiers, file paths, and command names unchanged unless the task explicitly asks to translate them.",
].join("\n");

let clearStatusTimer: ReturnType<typeof setTimeout> | undefined;
let clearProgressTimer: ReturnType<typeof setTimeout> | undefined;
let progressRefreshTimer: ReturnType<typeof setInterval> | undefined;

interface SubagentProgressState {
	mode: string;
	status: string;
	step: string;
	artifacts?: string;
	startedAt: number;
	activity: string[];
}

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

function getSubagentActivePath(cwd: string) {
	return path.join(cwd, SUBAGENT_ACTIVE_FILE);
}

async function markSubagentActive(cwd: string) {
	const activePath = getSubagentActivePath(cwd);
	await fs.mkdir(path.dirname(activePath), { recursive: true });
	await fs.writeFile(activePath, `${Date.now()}\n`, "utf8");
}

async function clearSubagentActive(cwd: string) {
	try {
		await fs.unlink(getSubagentActivePath(cwd));
	} catch {
		// Ignore missing marker file.
	}
}

function getReviewPrefix(exitCode: number, successLabel: string, failureLabel: string): string {
	return exitCode === 0 ? `${successLabel}:\n\n` : `${failureLabel}:\n\n`;
}

function toCompactPreview(text: string): string {
	return text.length <= MESSAGE_BODY_PREVIEW_LIMIT ? text : `${text.slice(0, MESSAGE_BODY_PREVIEW_LIMIT).trimEnd()}\n...[truncated]`;
}

function withVietnameseRule(prompt: string): string {
	return `${prompt.trimEnd()}\n\n---\n${SUBAGENT_VIETNAMESE_RULE}\n`;
}

function cancelProgressTimers() {
	if (clearProgressTimer) {
		clearTimeout(clearProgressTimer);
		clearProgressTimer = undefined;
	}
	if (progressRefreshTimer) {
		clearInterval(progressRefreshTimer);
		progressRefreshTimer = undefined;
	}
}

function formatElapsed(startedAt: number): string {
	const elapsedMs = Math.max(0, Date.now() - startedAt);
	const totalSeconds = Math.floor(elapsedMs / 1000);
	const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
	const seconds = (totalSeconds % 60).toString().padStart(2, "0");
	return `${minutes}:${seconds}`;
}

function getAnimatedBadge(theme: ExtensionContext["ui"]["theme"], startedAt: number): string {
	const frames = ["·", "•", "●", "•"] as const;
	const frame = frames[Math.floor((Date.now() - startedAt) / 350) % frames.length];
	return theme.fg("accent", frame);
}

function renderProgressWidget(ctx: ExtensionContext, state: SubagentProgressState) {
	const elapsed = formatElapsed(state.startedAt);
	const badge = getAnimatedBadge(ctx.ui.theme, state.startedAt);
	const latestActivity = state.activity.at(-1) ?? "starting";
	const headline = state.status === "failed"
		? ctx.ui.theme.fg("warning", `! ${state.step}`)
		: state.status === "complete"
			? ctx.ui.theme.fg("success", `✓ ${state.step}`)
			: ctx.ui.theme.fg("accent", `… ${state.step}`);
	const meta = Date.now() - state.startedAt >= LONG_RUNNING_AFTER_MS
		? state.artifacts ? `${state.artifacts} · waiting for model` : "waiting for model"
		: state.artifacts ?? "running";
	const title = [
		`${badge} ${ctx.ui.theme.bold(state.mode)}`,
		ctx.ui.theme.fg("dim", elapsed),
	].join(ctx.ui.theme.fg("dim", "   "));

	const box = new Box(1, 0, (text) => ctx.ui.theme.bg("customMessageBg", text));
	box.addChild(new Text(title, 0, 0));
	box.addChild(new Text(headline, 0, 0));
	box.addChild(new Text(ctx.ui.theme.fg("dim", `${meta} · ${latestActivity}`), 0, 0));
	ctx.ui.setWidget(WIDGET_KEY, () => box);
	ctx.ui.setStatus(STATUS_KEY, ctx.ui.theme.fg("accent", "◌") + ctx.ui.theme.fg("dim", " sub-agent active"));
}

function startProgress(ctx: ExtensionContext, state: Omit<SubagentProgressState, "startedAt" | "activity"> & { activity?: string[] }) {
	cancelStatusClearTimer();
	cancelProgressTimers();
	void markSubagentActive(ctx.cwd);
	ctx.ui.setWorkingIndicator(getLoadingIndicator(ctx));
	const progressState: SubagentProgressState = {
		...state,
		startedAt: Date.now(),
		activity: state.activity?.slice(-PROGRESS_ACTIVITY_LIMIT) ?? [],
	};
	renderProgressWidget(ctx, progressState);
	progressRefreshTimer = setInterval(() => {
		try {
			renderProgressWidget(ctx, progressState);
		} catch {
			cancelProgressTimers();
		}
	}, 1000);
	return progressState;
}

function finishProgress(
	ctx: ExtensionContext,
	state: SubagentProgressState | undefined,
	options: { status: "complete" | "failed"; step: string; isSuccess: boolean; activity?: string },
) {
	if (!state) return;
	cancelProgressTimers();
	state.status = options.status;
	state.step = options.step;
	if (options.activity) {
		state.activity.push(options.activity);
		state.activity = state.activity.slice(-PROGRESS_ACTIVITY_LIMIT);
	}
	renderProgressWidget(ctx, state);
	ctx.ui.setWorkingIndicator();
	void clearSubagentActive(ctx.cwd);
	clearProgressTimer = setTimeout(() => {
		try {
			ctx.ui.setWidget(WIDGET_KEY, undefined);
		} catch {
			// Ignore stale extension context after command/session teardown.
		}
		clearProgressTimer = undefined;
	}, PROGRESS_CLEAR_DELAY_MS);
}

function getMessageStatus(details: unknown): "success" | "error" {
	const exitCode = typeof details === "object" && details && "exitCode" in details ? (details as { exitCode?: unknown }).exitCode : undefined;
	return exitCode === 0 || exitCode === undefined ? "success" : "error";
}

function registerSubagentMessageRenderer(pi: ExtensionAPI, customType: string, title: string) {
	pi.registerMessageRenderer(customType, (message, options, theme) => {
		const status = getMessageStatus(message.details);
		const icon = status === "success" ? theme.fg("success", "✓") : theme.fg("warning", "!");
		const titleColor = status === "success" ? "success" : "warning";
		const heading = `${icon} ${theme.fg(titleColor, theme.bold(title))}`;
		const preview = options.expanded ? String(message.content ?? "") : toCompactPreview(String(message.content ?? ""));
		const lines = [heading, "", preview];
		const box = new Box(1, 1, (text) => theme.bg("customMessageBg", text));
		box.addChild(new Text(lines.join("\n"), 0, 0));
		return box;
	});
}

async function runDelegatedCommand(params: {
	cwd: string;
	prompt: string;
	signal: AbortSignal;
	tools: string[];
}) {
	return runDelegatedReview({
		cwd: params.cwd,
		prompt: withVietnameseRule(params.prompt),
		tools: params.tools,
		signal: params.signal,
	});
}

export default function subagentExtension(pi: ExtensionAPI) {
	registerSubagentMessageRenderer(pi, "subagent-review-spec", "Sub-agent spec review");

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

			let progress: SubagentProgressState | undefined;
			try {
				const [specPath] = await resolveExistingPaths(ctx.cwd, args);
				ctx.ui.notify(`Running isolated spec review for ${specPath}`, "info");
				progress = startProgress(ctx, {
					mode: "review-spec",
					status: "running",
					step: "reviewing spec file",
					artifacts: "1 spec file",
					activity: ["Started delegated spec review"],
				});
				setRunningStatus(ctx, "Delegated spec review running");
				const result = await runDelegatedCommand({
					cwd: ctx.cwd,
					prompt: buildReviewSpecPrompt(ctx.cwd, specPath),
					tools: REVIEW_TOOLS,
					signal: ctx.signal,
				});

				finishProgress(ctx, progress, {
					status: result.exitCode === 0 ? "complete" : "failed",
					step: result.exitCode === 0 ? "spec review finished" : "spec review failed",
					isSuccess: result.exitCode === 0,
					activity: result.exitCode === 0 ? "Spec review complete" : "Spec review failed",
				});
				setDoneStatus(ctx, "Delegated spec review complete", result.exitCode === 0);
				ctx.ui.notify(result.exitCode === 0 ? "Spec review complete" : "Spec review failed", result.exitCode === 0 ? "info" : "error");
				pi.sendMessage(
					{
						customType: "subagent-review-spec",
						content: `${getReviewPrefix(result.exitCode, "Delegated spec review complete", "Delegated spec review failed")}${result.finalText}`,
						display: true,
						details: { exitCode: result.exitCode, stderr: result.stderr },
					},
					{ triggerTurn: false, deliverAs: "followUp" },
				);
			} catch (error) {
				finishProgress(ctx, progress, {
					status: "failed",
					step: "spec review failed",
					isSuccess: false,
					activity: error instanceof Error ? error.message : "Spec review failed",
				});
				setDoneStatus(ctx, "Delegated spec review failed", false);
				ctx.ui.notify(error instanceof Error ? error.message : "Spec review failed", "error");
			}
		},
	});
}
