import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Box, Text } from "@earendil-works/pi-tui";
import { promises as fs } from "node:fs";
import path from "node:path";

interface WorkflowStep {
	id: string;
	title: string;
	type?: string;
	value?: string;
	description?: string;
	display?: string;
	note?: string;
	hint?: string;
}

interface WorkflowDefinition {
	id: string;
	name: string;
	description?: string;
	steps: WorkflowStep[];
}

interface ActiveWorkflowState {
	workflowId: string;
	currentStepIndex: number;
	startedAt: string;
}

const STATUS_KEY = "workflows";
const WIDGET_KEY = "workflows";
const WORKFLOW_DIR = ".pi/workflows";
const ACTIVE_STATE_FILE = ".pi/workflows/.active-workflow.json";

function getWorkflowDir(cwd: string) {
	return path.join(cwd, WORKFLOW_DIR);
}

function getActiveStatePath(cwd: string) {
	return path.join(cwd, ACTIVE_STATE_FILE);
}

function normalizeStepIndex(index: number, total: number) {
	if (total <= 0) return 0;
	if (index < 0) return 0;
	if (index >= total) return total - 1;
	return index;
}

async function pathExists(filePath: string) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function ensureWorkflowDir(cwd: string) {
	await fs.mkdir(getWorkflowDir(cwd), { recursive: true });
}

async function listWorkflowFiles(cwd: string) {
	const workflowDir = getWorkflowDir(cwd);
	if (!(await pathExists(workflowDir))) return [];
	const entries = await fs.readdir(workflowDir, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !entry.name.startsWith(".active-workflow"))
		.map((entry) => path.join(workflowDir, entry.name))
		.sort();
}

function isValidWorkflowDefinition(value: unknown): value is WorkflowDefinition {
	if (!value || typeof value !== "object") return false;
	const workflow = value as Partial<WorkflowDefinition>;
	if (typeof workflow.id !== "string" || !workflow.id.trim()) return false;
	if (typeof workflow.name !== "string" || !workflow.name.trim()) return false;
	if (!Array.isArray(workflow.steps)) return false;
	return workflow.steps.every((step) => step && typeof step.id === "string" && step.id.trim() && typeof step.title === "string" && step.title.trim());
}

async function loadWorkflowFromFile(filePath: string): Promise<WorkflowDefinition | null> {
	try {
		const raw = await fs.readFile(filePath, "utf8");
		const parsed: unknown = JSON.parse(raw);
		return isValidWorkflowDefinition(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

async function listWorkflows(cwd: string): Promise<WorkflowDefinition[]> {
	const files = await listWorkflowFiles(cwd);
	const workflows = await Promise.all(files.map((filePath) => loadWorkflowFromFile(filePath)));
	return workflows.filter((workflow): workflow is WorkflowDefinition => workflow !== null);
}

async function getWorkflow(cwd: string, workflowId: string): Promise<WorkflowDefinition | undefined> {
	const workflows = await listWorkflows(cwd);
	return workflows.find((workflow) => workflow.id === workflowId);
}

async function loadActiveState(cwd: string): Promise<ActiveWorkflowState | undefined> {
	const statePath = getActiveStatePath(cwd);
	if (!(await pathExists(statePath))) return undefined;
	try {
		const raw = await fs.readFile(statePath, "utf8");
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return undefined;
		const state = parsed as Partial<ActiveWorkflowState>;
		if (typeof state.workflowId !== "string" || !state.workflowId.trim()) return undefined;
		if (typeof state.currentStepIndex !== "number" || Number.isNaN(state.currentStepIndex)) return undefined;
		if (typeof state.startedAt !== "string" || !state.startedAt.trim()) return undefined;
		return state as ActiveWorkflowState;
	} catch {
		return undefined;
	}
}

async function saveActiveState(cwd: string, state: ActiveWorkflowState) {
	await ensureWorkflowDir(cwd);
	await fs.writeFile(getActiveStatePath(cwd), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function clearActiveState(cwd: string) {
	const statePath = getActiveStatePath(cwd);
	if (await pathExists(statePath)) {
		await fs.unlink(statePath);
	}
}

function getStepSummary(workflow: WorkflowDefinition, stepIndex: number) {
	const currentIndex = normalizeStepIndex(stepIndex, workflow.steps.length);
	const current = workflow.steps[currentIndex];
	const next = workflow.steps[currentIndex + 1];
	return {
		currentIndex,
		current,
		next,
		total: workflow.steps.length,
	};
}

function formatStepLabel(step: WorkflowStep | undefined) {
	if (!step) return "done";
	const typeLabel = step.type?.trim() ? ` [${step.type.trim()}]` : "";
	return `${step.title}${typeLabel}`;
}

function formatHint(step: WorkflowStep | undefined) {
	if (!step?.hint?.trim()) return undefined;
	return step.hint.trim();
}

function setWorkflowStatus(ctx: ExtensionContext, workflow: WorkflowDefinition, stepIndex: number) {
	const summary = getStepSummary(workflow, stepIndex);
	const currentLabel = formatStepLabel(summary.current);
	const nextLabel = formatStepLabel(summary.next);
	ctx.ui.setStatus(
		STATUS_KEY,
		ctx.ui.theme.fg("accent", "◌") + ctx.ui.theme.fg("dim", ` workflow: ${workflow.name} · ${summary.currentIndex + 1}/${summary.total} · ${currentLabel} → ${nextLabel}`),
	);
}

function clearWorkflowUI(ctx: ExtensionContext) {
	ctx.ui.setStatus(STATUS_KEY, undefined);
	ctx.ui.setWidget(WIDGET_KEY, undefined);
}

function renderWorkflowWidget(ctx: ExtensionContext, workflow: WorkflowDefinition, stepIndex: number) {
	const summary = getStepSummary(workflow, stepIndex);
	const currentLabel = formatStepLabel(summary.current);
	const nextLabel = formatStepLabel(summary.next);
	const currentHint = formatHint(summary.current);
	const nextHint = formatHint(summary.next);
	const box = new Box(1, 0, (text) => ctx.ui.theme.bg("customMessageBg", text));
	box.addChild(new Text(`${ctx.ui.theme.fg("accent", "•")} ${ctx.ui.theme.bold(workflow.name)} ${ctx.ui.theme.fg("dim", `${summary.currentIndex + 1}/${summary.total}`)}`, 0, 0));
	box.addChild(new Text(`${currentLabel} ${ctx.ui.theme.fg("dim", "→")} ${nextLabel}`, 0, 0));
	if (nextHint || currentHint) {
		const hintText = nextHint ? `Next hint: ${nextHint}` : `Hint: ${currentHint}`;
		box.addChild(new Text(ctx.ui.theme.fg("dim", hintText), 0, 0));
	}
	ctx.ui.setWidget(WIDGET_KEY, () => box);
	setWorkflowStatus(ctx, workflow, stepIndex);
}

async function refreshWorkflowUI(ctx: ExtensionContext) {
	const state = await loadActiveState(ctx.cwd);
	if (!state) {
		clearWorkflowUI(ctx);
		return;
	}
	const workflow = await getWorkflow(ctx.cwd, state.workflowId);
	if (!workflow || workflow.steps.length === 0) {
		clearWorkflowUI(ctx);
		return;
	}
	const stepIndex = normalizeStepIndex(state.currentStepIndex, workflow.steps.length);
	if (stepIndex !== state.currentStepIndex) {
		await saveActiveState(ctx.cwd, { ...state, currentStepIndex: stepIndex });
	}
	renderWorkflowWidget(ctx, workflow, stepIndex);
}

function parseArgs(args: string) {
	const parts = args.trim().split(/\s+/).filter(Boolean);
	return {
		action: parts[0]?.toLowerCase(),
		params: parts.slice(1),
	};
}

function buildWorkflowListMessage(workflows: WorkflowDefinition[], activeWorkflowId?: string) {
	if (workflows.length === 0) {
		return "Chưa có workflow nào trong .pi/workflows/*.json";
	}
	return [
		"Workflows:",
		...workflows.map((workflow) => {
			const marker = workflow.id === activeWorkflowId ? "*" : "-";
			return `${marker} ${workflow.id} — ${workflow.name} (${workflow.steps.length} step)`;
		}),
	].join("\n");
}

function buildWorkflowDetailMessage(workflow: WorkflowDefinition, currentStepIndex?: number) {
	return [
		`${workflow.name}`,
		workflow.description ? `${workflow.description}` : undefined,
		"",
		...workflow.steps.map((step, index) => {
			const isCurrent = currentStepIndex === index;
			const marker = isCurrent ? ">" : "-";
			const type = step.type?.trim() ? ` [${step.type.trim()}]` : "";
			const value = step.value?.trim() ? ` · source: ${step.value.trim()}` : "";
			const hint = step.hint?.trim() ? `\n    hint: ${step.hint.trim()}` : "";
			return `${marker} ${index + 1}. ${step.title}${type}${value}${hint}`;
		}).filter(Boolean),
	].join("\n");
}

function buildCurrentWorkflowMessage(workflow: WorkflowDefinition, stepIndex: number) {
	const summary = getStepSummary(workflow, stepIndex);
	const currentLabel = formatStepLabel(summary.current);
	const nextLabel = formatStepLabel(summary.next);
	const currentValue = summary.current?.value?.trim() ? `Source: ${summary.current.value.trim()}` : undefined;
	const nextHint = formatHint(summary.next);
	const currentHint = formatHint(summary.current);
		return [
		`Workflow hiện tại: ${workflow.name}`,
		`Step: ${summary.currentIndex + 1}/${summary.total}`,
		`Now: ${currentLabel}`,
		currentValue,
		`Next: ${nextLabel}`,
		nextHint ? `Next hint: ${nextHint}` : currentHint ? `Hint: ${currentHint}` : undefined,
	].filter(Boolean).join("\n");
}

async function activateWorkflow(ctx: ExtensionContext, workflow: WorkflowDefinition, stepIndex = 0) {
	const normalizedIndex = normalizeStepIndex(stepIndex, workflow.steps.length);
	await saveActiveState(ctx.cwd, {
		workflowId: workflow.id,
		currentStepIndex: normalizedIndex,
		startedAt: new Date().toISOString(),
	});
	renderWorkflowWidget(ctx, workflow, normalizedIndex);
	const summary = getStepSummary(workflow, normalizedIndex);
	ctx.ui.notify(`Đã kích hoạt workflow: ${workflow.name} · step ${summary.currentIndex + 1}/${summary.total}`, "info");
}

export default function workflowsExtension(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		await refreshWorkflowUI(ctx);
	});

	pi.registerCommand("workflows", {
		description: "Tạo/sửa/xem/liệt kê workflow và theo dõi step hiện tại trên TUI",
		handler: async (args, ctx) => {
			try {
				const { action, params } = parseArgs(args);
				const activeState = await loadActiveState(ctx.cwd);

				if (!action) {
					const workflows = await listWorkflows(ctx.cwd);
					ctx.ui.notify(buildWorkflowListMessage(workflows, activeState?.workflowId), "info");
					await refreshWorkflowUI(ctx);
					return;
				}

				if (action === "view") {
					const workflowId = params[0];
					if (!workflowId) {
						ctx.ui.notify("Dùng: /workflows view <workflow-id>", "warning");
						return;
					}
					const workflow = await getWorkflow(ctx.cwd, workflowId);
					if (!workflow) {
						ctx.ui.notify(`Không tìm thấy workflow: ${workflowId}`, "warning");
						return;
					}
					const currentStepIndex = activeState?.workflowId === workflow.id ? activeState.currentStepIndex : undefined;
					ctx.ui.notify(buildWorkflowDetailMessage(workflow, currentStepIndex), "info");
					return;
				}

				if (action === "current") {
					if (!activeState) {
						ctx.ui.notify("Chưa có workflow active. Dùng: /workflows use <workflow-id>", "warning");
						return;
					}
					const workflow = await getWorkflow(ctx.cwd, activeState.workflowId);
					if (!workflow || workflow.steps.length === 0) {
						ctx.ui.notify("Workflow active không hợp lệ hoặc đã bị xóa", "warning");
						clearWorkflowUI(ctx);
						return;
					}
					ctx.ui.notify(buildCurrentWorkflowMessage(workflow, activeState.currentStepIndex), "info");
					await refreshWorkflowUI(ctx);
					return;
				}

				if (action === "use") {
					const workflowId = params[0];
					if (!workflowId) {
						ctx.ui.notify("Dùng: /workflows use <workflow-id>", "warning");
						return;
					}
					const workflow = await getWorkflow(ctx.cwd, workflowId);
					if (!workflow) {
						ctx.ui.notify(`Không tìm thấy workflow: ${workflowId}`, "warning");
						return;
					}
					if (workflow.steps.length === 0) {
						ctx.ui.notify(`Workflow ${workflowId} không có step nào`, "warning");
						return;
					}
					await activateWorkflow(ctx, workflow, 0);
					return;
				}

				if (action === "next" || action === "prev") {
					if (!activeState) {
						ctx.ui.notify("Chưa có workflow active. Dùng: /workflows use <workflow-id>", "warning");
						return;
					}
					const workflow = await getWorkflow(ctx.cwd, activeState.workflowId);
					if (!workflow || workflow.steps.length === 0) {
						ctx.ui.notify("Workflow active không hợp lệ hoặc đã bị xóa", "warning");
						clearWorkflowUI(ctx);
						return;
					}
					const delta = action === "next" ? 1 : -1;
					const nextIndex = normalizeStepIndex(activeState.currentStepIndex + delta, workflow.steps.length);
					await activateWorkflow(ctx, workflow, nextIndex);
					return;
				}

				if (action === "set") {
					if (!activeState) {
						ctx.ui.notify("Chưa có workflow active. Dùng: /workflows use <workflow-id>", "warning");
						return;
					}
					const selector = params[0];
					if (!selector) {
						ctx.ui.notify("Dùng: /workflows set <step-id | step-number>", "warning");
						return;
					}
					const workflow = await getWorkflow(ctx.cwd, activeState.workflowId);
					if (!workflow || workflow.steps.length === 0) {
						ctx.ui.notify("Workflow active không hợp lệ hoặc đã bị xóa", "warning");
						clearWorkflowUI(ctx);
						return;
					}
					let stepIndex = Number(selector) - 1;
					if (Number.isNaN(stepIndex)) {
						stepIndex = workflow.steps.findIndex((step) => step.id === selector);
					}
					if (stepIndex < 0 || stepIndex >= workflow.steps.length) {
						ctx.ui.notify(`Không tìm thấy step: ${selector}`, "warning");
						return;
					}
					await activateWorkflow(ctx, workflow, stepIndex);
					return;
				}

				if (action === "clear") {
					await clearActiveState(ctx.cwd);
					clearWorkflowUI(ctx);
					ctx.ui.notify("Đã clear workflow active", "info");
					return;
				}

				ctx.ui.notify("Các lệnh hỗ trợ: /workflows, /workflows current, /workflows view <id>, /workflows use <id>, /workflows next, /workflows prev, /workflows set <step-id|step-number>, /workflows clear", "warning");
			} catch (error) {
				ctx.ui.notify(error instanceof Error ? error.message : "Workflow command failed", "error");
			}
		},
	});
}
