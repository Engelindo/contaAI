import { Router } from "express";
import { parseExpense } from "../ai/parseExpense.js";
import { createExpense, getSummary } from "../db/expenses.js";

const router = Router();

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const parsedMessage = await parseExpense(message);

    if (parsedMessage.intent === "get_summary") {
      const summary = await getSummary(parsedMessage.period);

      return res.json({
        success: true,
        intent: "get_summary",
        summary,
      });
    }

    const saved = await createExpense(parsedMessage);

    return res.json({
      success: true,
      intent: "add_expense",
      expense: saved,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;