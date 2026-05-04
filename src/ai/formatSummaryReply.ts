import type { SummaryPeriod } from "../types/ai.js";

export type SummaryPayload = {
  period: SummaryPeriod;
  /** Normalized filter label when user asked about a merchant/service. */
  subcategoryFilter?: string | null;
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
  const subLabel = summary.subcategoryFilter?.trim();

  if (summary.expenseCount === 0) {
    if (subLabel) {
      return `Não encontrei despesas com "${subLabel}" ${periodPhrase}.`;
    }
    return `Não encontrei despesas registradas ${periodPhrase}.`;
  }

  if (subLabel) {
    const lines: string[] = [
      `Com ${subLabel} você gastou ${total} ${periodPhrase} (${summary.expenseCount} ${summary.expenseCount === 1 ? "despesa" : "despesas"}).`,
    ];
    const top = summary.byCategory[0];
    if (top && top.totalAmount > 0 && summary.byCategory.length > 1) {
      const label = CATEGORY_LABELS[top.category] ?? top.category;
      lines.push(`Maior categoria entre essas despesas: ${label.toLowerCase()} (${formatBrl(top.totalAmount)}).`);
    }
    return lines.join("\n");
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
