import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("3000"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  WHATSAPP_VERIFY_TOKEN: z
    .string()
    .min(1, "WHATSAPP_VERIFY_TOKEN is required"),
  META_APP_SECRET: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1, "WHATSAPP_ACCESS_TOKEN is required"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1, "WHATSAPP_PHONE_NUMBER_ID is required"),
  WHATSAPP_API_VERSION: z.string().default("v23.0"),
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
  WHATSAPP_VERIFY_TOKEN: parsed.data.WHATSAPP_VERIFY_TOKEN,
  META_APP_SECRET: parsed.data.META_APP_SECRET,
  WHATSAPP_ACCESS_TOKEN: parsed.data.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: parsed.data.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_API_VERSION: parsed.data.WHATSAPP_API_VERSION,
};