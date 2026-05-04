import OpenAI from "openai";
import { env } from "../config/env.js";
import { parseResultSchema, type ParsedMessage } from "../types/ai.js";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

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

Subcategory (optional on add_expense): when the user names a specific merchant, app, or service (Uber, 99, iFood, Netflix, "mercado X"), set "subcategory" to a short canonical label (e.g. "Uber", "iFood"). Omit "subcategory" if they only give a generic description.

If intent is "add_expense", return this shape:
{
  "intent": "add_expense",
  "amount": number,
  "category": "FOOD" | "TRANSPORT" | "HOUSING" | "ENTERTAINMENT" | "HEALTH" | "OTHER",
  "subcategory": "optional short label like Uber or iFood",
  "date": "YYYY-MM-DD",
  "description": "short lowercase description in Portuguese",
  "reply": "1–3 short sentences in natural Brazilian Portuguese confirming the expense: state the amount in R$, the category in plain words (not enum codes), and mention the subcategory/merchant if present. Friendly WhatsApp tone, no JSON inside reply."
}

If intent is "get_summary", return this shape (no reply field — totals come from the database):
{
  "intent": "get_summary",
  "period": "TODAY" | "CURRENT_WEEK" | "CURRENT_MONTH" | "LAST_MONTH" | "ALL_TIME",
  "subcategory": "optional: when the user asks spending for a specific merchant/service (e.g. 'quanto gastei com uber', 'total ifood esse mês'), set to the same short label you would use on add_expense (e.g. Uber, iFood). Omit for general totals."
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