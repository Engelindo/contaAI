import type { Expenses } from "../types/expenses.js";

const expenses: Expenses[] = [];

export const db = {
  addExpense(expense: Expenses) {
    expenses.push(expense);
  },

  getAll() {
    return expenses;
  },

  getTotal() {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  },

  getTotalByMonth(month: string) {
    return expenses
      .filter(e => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amount, 0);
  }
};