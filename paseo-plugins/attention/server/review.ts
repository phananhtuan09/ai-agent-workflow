import type { AgentTimelineItem } from "@getpaseo/protocol/agent-types";
import type { PaseoApi } from "@getpaseo/client";
import { REVIEW_KIND, REVIEW_VERSION, type ReviewData } from "../shared/review";

export const REVIEWER_TITLE = "attention-reviewer";
const REVIEWER_PROVIDER = "claude/claude-haiku-5-5";

// Shorter answers are quick to read yourself.
const MIN_CHARS = 600;
const MAX_CHARS = 40_000;
const REVIEW_TIMEOUT_MS = 60_000;

const RULES = `You review an AI coding assistant's response for a busy developer who will not read it fully.
Flag only what the developer must notice or act on:
- action: a question, decision, approval, or manual step waiting on the developer
- risk: destructive or irreversible actions taken or proposed, security or data-loss concerns, breaking changes, assumptions that could be wrong
- todo: failed or skipped verification, unfinished work, blockers, known bugs left behind
Ignore routine narration, successful steps, and explanations.
Reply with JSON only: {"items":[{"level":"action|risk|todo","text":"..."}]}
At most 3 items, most important first, each text under 120 characters, written in the same language as the response.
Reply {"items":[]} when nothing needs the developer.
Never use tools.`;

// The assistant text of the latest turn: everything after the last user message.
export function latestAnswer(timeline: readonly AgentTimelineItem[]): string {
  const lastUser = timeline.map((item) => item.type).lastIndexOf("user_message");
  return timeline
    .slice(lastUser + 1)
    .flatMap((item) => (item.type === "assistant_message" ? [item.text] : []))
    .join("")
    .trim();
}

export function isWorthReviewing(answer: string): boolean {
  return answer.length >= MIN_CHARS;
}

function parseItems(text: string): ReviewData {
  try {
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const items = (Array.isArray(json.items) ? json.items : [])
      .filter(
        (one: { level?: string; text?: unknown }) =>
          ["action", "risk", "todo"].includes(String(one?.level)) && typeof one.text === "string",
      )
      .slice(0, 3);
    return { status: "done", items };
  } catch {
    return { status: "failed", items: [], reason: "unreadable reply" };
  }
}

async function publish(paseo: PaseoApi, agentId: string, rowId: string, data: ReviewData) {
  await paseo.agents.ref(agentId).timeline.append({
    type: "plugin",
    id: rowId,
    kind: REVIEW_KIND,
    version: REVIEW_VERSION,
    data,
  });
}

export async function reviewAnswer(
  paseo: PaseoApi,
  agent: { id: string; cwd: string },
  rowId: string,
  answer: string,
) {
  await publish(paseo, agent.id, rowId, { status: "checking", items: [] });
  try {
    const reviewer = await paseo.agents.create({
      config: { provider: REVIEWER_PROVIDER, systemPrompt: RULES },
      cwd: agent.cwd,
      title: REVIEWER_TITLE,
      autoArchive: true,
      prompt: `<response>\n${answer.slice(0, MAX_CHARS)}\n</response>`,
    });
    const result = await reviewer.waitForFinish(REVIEW_TIMEOUT_MS);
    const page = await reviewer.timeline.refetch({ limit: 20 });
    void reviewer.archive().catch(() => undefined);
    if (result.status !== "idle") {
      return publish(paseo, agent.id, rowId, {
        status: "failed",
        items: [],
        reason: result.status,
      });
    }
    const text = latestAnswer(page.entries.map((entry) => entry.item));
    return publish(paseo, agent.id, rowId, parseItems(text));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "review failed";
    return publish(paseo, agent.id, rowId, { status: "failed", items: [], reason });
  }
}
