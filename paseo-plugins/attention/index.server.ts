import type { PluginServerContext } from "@getpaseo/plugin/server";
import { isWorthReviewing, latestAnswer, reviewAnswer, REVIEWER_TITLE } from "./server/review";

export default function contribute(server: PluginServerContext) {
  const remove = server.on("agent.turn_ended", async (event, { paseo }) => {
    const { agent, outcome, timeline, turnId } = event;
    if (outcome.kind !== "completed" || agent.title === REVIEWER_TITLE || agent.parentAgentId) {
      return;
    }
    const answer = latestAnswer(timeline);
    if (!isWorthReviewing(answer)) return;
    // Not awaited: the hook returns at once while Haiku reads the answer.
    void reviewAnswer(paseo, agent, `attention-${turnId ?? Date.now()}`, answer);
  });
  return remove;
}
