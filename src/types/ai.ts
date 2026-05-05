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

const optionalTrimmedString = z
  .string()
  .nullish()
  .transform((s) => {
    const t = s?.trim();
    return t && t.length > 0 ? t : undefined;
  });

const optionalNonNegativeNumber = z
  .number()
  .nonnegative()
  .nullish()
  .transform((v) => (v === null || v === undefined ? undefined : v));

export const parseResultSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("add_expense"),
    amount: z.number(),
    category: categorySchema,
    subcategory: optionalTrimmedString,
    /** Card name if user said which card (e.g. "no Nubank"). Omit if not stated. */
    card: optionalTrimmedString,
    date: z.string(),
    description: z.string(),
    /** Short user-facing confirmation in Brazilian Portuguese (WhatsApp-style). */
    reply: z.string(),
  }),
  z.object({
    intent: z.literal("get_summary"),
    period: summaryPeriodSchema,
    subcategory: optionalTrimmedString,
    /** Card name when user asks totals for one card. Omit for all cards / whole file. */
    card: optionalTrimmedString,
  }),
  z.object({
    intent: z.literal("add_card"),
    name: z.string().trim().min(1),
    limit: optionalNonNegativeNumber,
    reply: z.string(),
  }),
]);

export type ParsedMessage = z.infer<typeof parseResultSchema>;
export type AddExpenseInput = Omit<
  Extract<ParsedMessage, { intent: "add_expense" }>,
  "reply"
>;
export type SummaryPeriod = z.infer<typeof summaryPeriodSchema>;
