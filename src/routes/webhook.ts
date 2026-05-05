import crypto from "node:crypto";
import { Router } from "express";
import { formatSummaryReply } from "../ai/formatSummaryReply.js";
import { parseExpense } from "../ai/parseExpense.js";
import { env } from "../config/env.js";
import {
  findOrCreateCardByName,
  resolveCardIdForNewExpense,
  upsertCardFromIntent,
} from "../db/cards.js";
import { createExpense, getSummary } from "../db/expenses.js";
import { getOrCreateUserByPhone } from "../db/users.js";
import { messageCardRequired, messageNoCards } from "../messages/cardPrompts.js";

const router = Router();

type MetaWebhookMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: {
    body?: string;
  };
};

const getWebhookPayloadMessage = (
  body: unknown,
): { message: string | undefined; phoneNumber: string | undefined } => {
  const payload = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: MetaWebhookMessage[];
        };
      }>;
    }>;
  };

  const firstMessage = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const message = firstMessage?.text?.body;
  const phoneNumber = firstMessage?.from;
  return { message, phoneNumber };
};

const isValidSignature = (req: { headers: Record<string, unknown>; rawBody?: Buffer }): boolean => {
  if (!env.META_APP_SECRET) {
    return true;
  }

  const signatureHeader = req.headers["x-hub-signature-256"];
  if (typeof signatureHeader !== "string" || !req.rawBody) {
    return false;
  }

  const expectedDigest = crypto
    .createHmac("sha256", env.META_APP_SECRET)
    .update(req.rawBody)
    .digest("hex");
  const expectedSignature = `sha256=${expectedDigest}`;
  if (signatureHeader.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader, "utf8"),
    Buffer.from(expectedSignature, "utf8"),
  );
};

const processMessage = async (message: string, phoneNumber: string) => {
  try {
    const user = await getOrCreateUserByPhone(phoneNumber);
    const parsedMessage = await parseExpense(message);

    if (parsedMessage.intent === "add_card") {
      const { reply, name, limit } = parsedMessage;
      const card = await upsertCardFromIntent(user.id, {
        name,
        ...(typeof limit === "number" ? { limit } : {}),
      });
      return {
        success: true,
        intent: "add_card",
        card,
        message: reply,
      };
    }

    if (parsedMessage.intent === "get_summary") {
      let cardIdFilter: string | undefined;
      let cardNameHint: string | undefined;
      if (parsedMessage.card) {
        const card = await findOrCreateCardByName(user.id, parsedMessage.card);
        cardIdFilter = card.id;
        cardNameHint = card.name;
      }
      const summary = await getSummary(
        user.id,
        parsedMessage.period,
        parsedMessage.subcategory,
        cardIdFilter,
        cardNameHint,
      );

      return {
        success: true,
        intent: "get_summary",
        summary,
        message: formatSummaryReply(summary),
      };
    }

    const resolved = await resolveCardIdForNewExpense(user.id, parsedMessage.card);
    if (!resolved.ok) {
      if (resolved.code === "NO_CARDS") {
        return {
          success: false,
          code: "NO_CARDS",
          message: messageNoCards(),
        };
      }
      return {
        success: false,
        code: "CARD_REQUIRED",
        message: messageCardRequired(resolved.cards.map((c) => c.name)),
        cards: resolved.cards,
      };
    }

    const { reply, ...expenseData } = parsedMessage;
    const saved = await createExpense(user.id, expenseData, resolved.cardId);

    return {
      success: true,
      intent: "add_expense",
      expense: saved,
      message: reply,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    verifyToken === env.WHATSAPP_VERIFY_TOKEN &&
    typeof challenge === "string"
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/", async (req, res) => {
  const request = req as { headers: Record<string, unknown>; rawBody?: Buffer; body: unknown };
  if (!isValidSignature(request)) {
    return res.sendStatus(401);
  }

  const payload = request.body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: MetaWebhookMessage[];
        };
      }>;
    }>;
  };
  const incomingMessages = payload.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
  for (const incoming of incomingMessages) {
    console.log("[webhook] message received", {
      id: incoming.id,
      from: incoming.from,
      type: incoming.type,
      text: incoming.text?.body,
    });
  }

  const { message, phoneNumber } = getWebhookPayloadMessage(request.body);
  if (!message || !phoneNumber) {
    // Meta sends multiple event types; acknowledge non-text events.
    return res.sendStatus(200);
  }

  const result = await processMessage(message, phoneNumber);
  if (!result) {
    return res.status(500).json({ error: "Failed to process message" });
  }

  return res.sendStatus(200);
});

export default router;
