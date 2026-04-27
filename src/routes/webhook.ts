import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { parseExpense } from "../ai/parseExpense.js";

const router = Router();

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    // 1. AI parses message
    const expense = await parseExpense(message);

    // 2. Save to DB (Prisma)
    const saved = await prisma.expense.create({
      data: {
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: new Date(expense.date),
      },
    });

    return res.json({
      success: true,
      expense: saved,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;