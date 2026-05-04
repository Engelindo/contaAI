import { Router } from "express";
import { formatSummaryReply } from "../ai/formatSummaryReply.js";
import { parseExpense } from "../ai/parseExpense.js";
import { createExpense, getSummary } from "../db/expenses.js";
import { getOrCreateUserByPhone } from "../db/users.js";

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

    if (parsedMessage.intent === "get_summary") {
      const summary = await getSummary(
        user.id,
        parsedMessage.period,
        parsedMessage.subcategory,
      );

      return res.json({
        success: true,
        intent: "get_summary",
        summary,
        message: formatSummaryReply(summary),
      });
    }

    const { reply, ...expenseData } = parsedMessage;
    const saved = await createExpense(user.id, expenseData);

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