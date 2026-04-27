import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = {
  PORT: Number(parsed.data.PORT),
  OPENAI_API_KEY: parsed.data.OPENAI_API_KEY,
};