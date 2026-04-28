import OpenAI from "openai";
import { env } from "../config/env.js";
import { z } from "zod";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const categorySchema = z.enum([
  "FOOD",
  "TRANSPORT",
  "HOUSING",
  "ENTERTAINMENT",
  "HEALTH",
  "OTHER",
]);

const summaryPeriodSchema = z.enum([
  "TODAY",
  "CURRENT_WEEK",
  "CURRENT_MONTH",
  "LAST_MONTH",
  "ALL_TIME",
]);

const parseResultSchema = z.discriminatedUnion("intent", [
  z.object({
    intent: z.literal("add_expense"),
    amount: z.number(),
    category: categorySchema,
    date: z.string(),
    description: z.string(),
  }),
  z.object({
    intent: z.literal("get_summary"),
    period: summaryPeriodSchema,
  }),
]);

export type ParsedMessage = z.infer<typeof parseResultSchema>;

const systemPrompt = `
You are a finance intent parser for Brazilian Portuguese user messages.
Return ONLY valid JSON with no markdown, no explanation.

You must classify exactly one intent:
- "add_expense"
- "get_summary"

Expense categories are restricted to this exact list:
- FOOD: supermarket, groceries, restaurant, iFood, snacks, coffee
- TRANSPORT: Uber, taxi, bus, metro, fuel, parking, tolls
- HOUSING: rent, electricity, water, gas, internet, condo, home maintenance
- ENTERTAINMENT: streaming, games, bars, cinema, leisure, subscriptions for fun
- HEALTH: pharmacy, doctor, therapy, exams, insurance
- OTHER: use only when no category above fits

If intent is "add_expense", return this shape:
{
  "intent": "add_expense",
  "amount": number,
  "category": "FOOD" | "TRANSPORT" | "HOUSING" | "ENTERTAINMENT" | "HEALTH" | "OTHER",
  "date": "YYYY-MM-DD",
  "description": "short lowercase description in Portuguese"
}

If intent is "get_summary", return this shape:
{
  "intent": "get_summary",
  "period": "TODAY" | "CURRENT_WEEK" | "CURRENT_MONTH" | "LAST_MONTH" | "ALL_TIME"
}

Period mapping guidance:
- "hoje" => TODAY
- "essa semana"/"esta semana" => CURRENT_WEEK
- "esse mês"/"este mês" => CURRENT_MONTH
- "mês passado"/"último mês" => LAST_MONTH
- "total"/"geral"/"até agora" => ALL_TIME
`;

export async function parseExpense(input: string): Promise<ParsedMessage> {
  const today = new Date().toISOString().slice(0, 10);
  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Today is ${today}. User message: ${input}`,
      },
    ],
});

  const text = response?.choices[0]?.message?.content ?? "{}";

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI did not return valid JSON");
  }

  const result = parseResultSchema.safeParse(parsed);

  if (!result.success) {
    console.error(result.error.format());
    throw new Error("AI returned invalid structure");
  }

  return result.data;
}