import { z } from "zod";

export const categorySchema = z.enum([
  "FOOD",
  "TRANSPORT",
  "HOUSING",
  "ENTERTAINMENT",
  "HEALTH",
  "OTHER",
]);

export const summaryPeriodSchema = z.enum([
  "TODAY",
  "CURRENT_WEEK",
  "CURRENT_MONTH",
  "LAST_MONTH",
  "ALL_TIME",
]);

export const parseResultSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("add_expense"),
    amount: z.number(),
    category: categorySchema,
    date: z.string(),
    description: z.string(),
    /** Short user-facing confirmation in Brazilian Portuguese (WhatsApp-style). */
    reply: z.string(),
  }),
  z.object({
    intent: z.literal("get_summary"),
    period: summaryPeriodSchema,
  }),
]);

export type ParsedMessage = z.infer<typeof parseResultSchema>;
export type AddExpenseInput = Omit<
  Extract<ParsedMessage, { intent: "add_expense" }>,
  "reply"
>;
export type SummaryPeriod = z.infer<typeof summaryPeriodSchema>;
