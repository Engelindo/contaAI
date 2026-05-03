import type { SummaryPeriod } from "../types/ai.js";

export type SummaryPayload = {
  period: SummaryPeriod;
  totalAmount: number;
  expenseCount: number;
  byCategory: { category: string; totalAmount: number }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Alimentação",
  TRANSPORT: "Transporte",
  HOUSING: "Moradia",
  ENTERTAINMENT: "Lazer",
  HEALTH: "Saúde",
  OTHER: "Outros",
};

const PERIOD_PHRASE: Record<SummaryPeriod, string> = {
  TODAY: "hoje",
  CURRENT_WEEK: "nesta semana",
  CURRENT_MONTH: "neste mês",
  LAST_MONTH: "no mês passado",
  ALL_TIME: "no total",
};

function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatSummaryReply(summary: SummaryPayload): string {
  const periodPhrase = PERIOD_PHRASE[summary.period];
  const total = formatBrl(summary.totalAmount);

  if (summary.expenseCount === 0) {
    return `Não encontrei despesas registradas ${periodPhrase}.`;
  }

  const lines: string[] = [
    `Você gastou ${total} ${periodPhrase} (${summary.expenseCount} ${summary.expenseCount === 1 ? "despesa" : "despesas"}).`,
  ];

  const top = summary.byCategory[0];
  if (top && top.totalAmount > 0) {
    const label = CATEGORY_LABELS[top.category] ?? top.category;
    lines.push(`Maior categoria: ${label.toLowerCase()} (${formatBrl(top.totalAmount)}).`);
  }

  return lines.join("\n");
}
