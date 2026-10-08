import type { PluginClientContext } from "@getpaseo/plugin/client";
import { AttentionRow } from "./client/attention-row";
import { REVIEW_KIND, REVIEW_VERSION, reviewDataSchema } from "./shared/review";

export default function contribute(client: PluginClientContext) {
  return client.addTimelineRenderer({
    kind: REVIEW_KIND,
    version: REVIEW_VERSION,
    schema: reviewDataSchema,
    Component: AttentionRow,
  });
}
