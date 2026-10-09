import type { PluginServerContext } from "@getpaseo/plugin/server";
import { startReview } from "./server/review";
import { reviewLatest } from "./shared/review";

export default function contribute(server: PluginServerContext) {
  server.handle(reviewLatest, startReview);
  return () => {};
}
