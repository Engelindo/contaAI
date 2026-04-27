import OpenAI from "openai";
import { env } from "../config/env.js";
import { z } from "zod";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const expenseSchema = z.object({
  amount: z.number(),
  category: z.string(),
  date: z.string(),
  description: z.string(),
});

export async function parseExpense(input: string) {
  const response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `
Extract expense data and return ONLY JSON.

Fields:
- amount (number)
- category (Portuguese: alimentação, transporte, etc.)
- date (YYYY-MM-DD)
- description
        `,
      },
      {
        role: "user",
        content: input,
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

  const result = expenseSchema.safeParse(parsed);

  if (!result.success) {
    console.error(result.error.format());
    throw new Error("AI returned invalid structure");
  }

  return result.data;
}