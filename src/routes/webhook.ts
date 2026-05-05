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
import { sendWhatsAppText } from "../services/whatsapp.js";

const router = Router();

type MetaWebhookMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: {
    body?: string;
  };
};

const processedMessageIds = new Map<string, number>();
const PROCESSED_MESSAGE_TTL_MS = 15 * 60 * 1000;

const pruneProcessedMessageIds = () => {
  const cutoff = Date.now() - PROCESSED_MESSAGE_TTL_MS;
  for (const [id, seenAt] of processedMessageIds.entries()) {
    if (seenAt < cutoff) {
      processedMessageIds.delete(id);
    }
  }
};

const getIncomingMessages = (body: unknown): MetaWebhookMessage[] => {
  const payload = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: MetaWebhookMessage[];
        };
      }>;
    }>;
  };

  const messages: MetaWebhookMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      messages.push(...(change.value?.messages ?? []));
    }
  }

  return messages;
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

  pruneProcessedMessageIds();
  const incomingMessages = getIncomingMessages(request.body);
  for (const incoming of incomingMessages) {
    console.log("[webhook] message received", {
      id: incoming.id,
      from: incoming.from,
      type: incoming.type,
      text: incoming.text?.body,
    });

    if (incoming.id && processedMessageIds.has(incoming.id)) {
      console.log("[webhook] duplicate delivery ignored", { id: incoming.id });
      continue;
    }

    if (!incoming.text?.body || !incoming.from) {
      // Meta sends non-text events too; acknowledge and skip.
      continue;
    }

    if (incoming.id) {
      processedMessageIds.set(incoming.id, Date.now());
    }

    const result = await processMessage(incoming.text.body, incoming.from);
    if (!result) {
      console.error("[webhook] failed to process message", { id: incoming.id });
      continue;
    }

    try {
      await sendWhatsAppText({
        to: incoming.from,
        body: result.message,
      });
    } catch (error) {
      console.error("[webhook] failed to send reply", error);
    }
  }

  return res.sendStatus(200);
});

export default router;
