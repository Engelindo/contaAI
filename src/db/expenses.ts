import { prisma } from "./prisma.js";

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