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
