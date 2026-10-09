import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const REVIEW_KIND = "attention-review";
export const REVIEW_VERSION = 1;

export const levelSchema = z.enum(["action", "risk", "todo"]);

export const reviewDataSchema = z.object({
  status: z.enum(["checking", "done", "failed"]),
  items: z.array(z.object({ level: levelSchema, text: z.string() })),
  reason: z.string().optional(),
});

export type ReviewData = z.infer<typeof reviewDataSchema>;

// Starts a review of the agent's latest answer; the result arrives as a timeline row.
export const reviewLatest = defineRpc({
  name: "attention.review",
  input: z.object({ agentId: z.string(), cwd: z.string() }),
  output: z.object({}),
});
