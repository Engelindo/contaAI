import { prisma } from "./prisma.js";
import type { AddExpenseInput, SummaryPeriod } from "../types/ai.js";

export async function createExpense(userId: string, input: AddExpenseInput) {
  return prisma.expense.create({
    data: {
      userId,
      amount: input.amount,
      category: input.category,
      subcategory: input.subcategory ?? null,
      description: input.description,
      date: new Date(input.date),
    },
  });
}

function getPeriodRange(period: SummaryPeriod): { start?: Date; end?: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === "ALL_TIME") {
    return {};
  }

  if (period === "TODAY") {
    const start = new Date(year, month, now.getDate(), 0, 0, 0, 0);
    const end = new Date(year, month, now.getDate() + 1, 0, 0, 0, 0);
    return { start, end };
  }

  if (period === "CURRENT_WEEK") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(year, month, now.getDate() + diffToMonday, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (period === "CURRENT_MONTH") {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
    return { start, end };
  }

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

export async function getSummary(
  userId: string,
  period: SummaryPeriod,
  subcategoryFilter?: string,
) {
  const { start, end } = getPeriodRange(period);
  const subcategory = subcategoryFilter?.trim();

  const where = {
    userId,
    ...(start && end ? { date: { gte: start, lt: end } } : {}),
    ...(subcategory
      ? {
          subcategory: {
            contains: subcategory,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [totals, byCategory] = await Promise.all([
    prisma.expense.aggregate({
      _sum: { amount: true },
      _count: true,
      where,
    }),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      where,
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  return {
    period,
    subcategoryFilter: subcategory ?? null,
    totalAmount: totals._sum?.amount ?? 0,
    expenseCount: totals._count ?? 0,
    byCategory: byCategory.map((item) => ({
      category: item.category,
      totalAmount: item._sum?.amount ?? 0,
    })),
  };
}
