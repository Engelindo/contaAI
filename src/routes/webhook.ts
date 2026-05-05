import { Router } from "express";
import { formatSummaryReply } from "../ai/formatSummaryReply.js";
import { parseExpense } from "../ai/parseExpense.js";
import {
  findOrCreateCardByName,
  resolveCardIdForNewExpense,
  upsertCardFromIntent,
} from "../db/cards.js";
import { createExpense, getSummary } from "../db/expenses.js";
import { getOrCreateUserByPhone } from "../db/users.js";
import { messageCardRequired, messageNoCards } from "../messages/cardPrompts.js";

const router = Router();

router.post("/", async (req, res) => {
  const { message, phoneNumber } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  if (!phoneNumber || typeof phoneNumber !== "string") {
    return res.status(400).json({ error: "Missing phoneNumber" });
  }

  try {
    const user = await getOrCreateUserByPhone(phoneNumber);
    const parsedMessage = await parseExpense(message);

    if (parsedMessage.intent === "add_card") {
      const { reply, name, limit } = parsedMessage;
      const card = await upsertCardFromIntent(user.id, {
        name,
        ...(typeof limit === "number" ? { limit } : {}),
      });
      return res.json({
        success: true,
        intent: "add_card",
        card,
        message: reply,
      });
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

      return res.json({
        success: true,
        intent: "get_summary",
        summary,
        message: formatSummaryReply(summary),
      });
    }

    const resolved = await resolveCardIdForNewExpense(user.id, parsedMessage.card);
    if (!resolved.ok) {
      if (resolved.code === "NO_CARDS") {
        return res.json({
          success: false,
          code: "NO_CARDS",
          message: messageNoCards(),
        });
      }
      return res.json({
        success: false,
        code: "CARD_REQUIRED",
        message: messageCardRequired(resolved.cards.map((c) => c.name)),
        cards: resolved.cards,
      });
    }

    const { reply, ...expenseData } = parsedMessage;
    const saved = await createExpense(user.id, expenseData, resolved.cardId);

    return res.json({
      success: true,
      intent: "add_expense",
      expense: saved,
      message: reply,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;
