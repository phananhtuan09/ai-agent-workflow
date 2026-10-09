import type { PluginClientContext } from "@getpaseo/plugin/client";
import { AttentionRow } from "./client/attention-row";
import { REVIEW_KIND, REVIEW_VERSION, reviewDataSchema, reviewLatest } from "./shared/review";

export default function contribute(client: PluginClientContext) {
  client.addTimelineRenderer({
    kind: REVIEW_KIND,
    version: REVIEW_VERSION,
    schema: reviewDataSchema,
    Component: AttentionRow,
  });
  client.addSlashCommand({
    name: "attention",
    description: "Point out what needs you in the latest answer",
    argumentHint: "",
    context: "agent",
    async onSubmit({ agent, rpc }) {
      if (agent.status === "running") throw new Error("Wait for the agent to finish its turn");
      await rpc(reviewLatest, { agentId: agent.id, cwd: agent.cwd });
    },
  });
  return () => {};
}
