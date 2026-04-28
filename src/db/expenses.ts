import { prisma } from "./prisma.js";

export type SummaryPeriod =
  | "TODAY"
  | "CURRENT_WEEK"
  | "CURRENT_MONTH"
  | "LAST_MONTH"
  | "ALL_TIME";

export async function getTotalExpenses() {
  const result = await prisma.expense.aggregate({
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount ?? 0;
}

export async function getExpensesByCategory() {
  return prisma.expense.groupBy({
    by: ["category"],
    _sum: {
      amount: true,
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
    const day = now.getDay(); // 0=Sunday
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

export async function getSummary(period: SummaryPeriod) {
  const { start, end } = getPeriodRange(period);
  const where = start && end ? { date: { gte: start, lt: end } } : {};

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
    totalAmount: totals._sum?.amount ?? 0,
    expenseCount: totals._count ?? 0,
    byCategory: byCategory.map((item) => ({
      category: item.category,
      totalAmount: item._sum?.amount ?? 0,
    })),
  };
}