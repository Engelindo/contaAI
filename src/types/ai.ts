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
    /** Merchant or service label, e.g. "Uber", "iFood". Omit if not explicit. */
    subcategory: z
      .string()
      .nullish()
      .transform((s) => {
        const t = s?.trim();
        return t && t.length > 0 ? t : undefined;
      }),
    date: z.string(),
    description: z.string(),
    /** Short user-facing confirmation in Brazilian Portuguese (WhatsApp-style). */
    reply: z.string(),
  }),
  z.object({
    intent: z.literal("get_summary"),
    period: summaryPeriodSchema,
    /** When user asks spending for a specific merchant/service (e.g. "quanto gastei com uber"). */
    subcategory: z
      .string()
      .nullish()
      .transform((s) => {
        const t = s?.trim();
        return t && t.length > 0 ? t : undefined;
      }),
  }),
]);

export type ParsedMessage = z.infer<typeof parseResultSchema>;
export type AddExpenseInput = Omit<
  Extract<ParsedMessage, { intent: "add_expense" }>,
  "reply"
>;
export type SummaryPeriod = z.infer<typeof summaryPeriodSchema>;
