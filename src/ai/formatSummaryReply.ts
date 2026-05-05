import type { SummaryPeriod } from "../types/ai.js";

export type SummaryPayload = {
  period: SummaryPeriod;
  /** Normalized filter label when user asked about a merchant/service. */
  subcategoryFilter?: string | null;
  /** Display name when user filtered by card. */
  cardNameFilter?: string | null;
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

function topCategoryLine(
  byCategory: SummaryPayload["byCategory"],
  prefix: string,
): string | null {
  const top = byCategory[0];
  if (!top || top.totalAmount <= 0 || byCategory.length < 2) return null;
  const label = CATEGORY_LABELS[top.category] ?? top.category;
  return `${prefix}: ${label.toLowerCase()} (${formatBrl(top.totalAmount)}).`;
}

export function formatSummaryReply(summary: SummaryPayload): string {
  const periodPhrase = PERIOD_PHRASE[summary.period];
  const total = formatBrl(summary.totalAmount);
  const subLabel = summary.subcategoryFilter?.trim();
  const cardLabel = summary.cardNameFilter?.trim();
  const countPhrase = `${summary.expenseCount} ${summary.expenseCount === 1 ? "despesa" : "despesas"}`;

  if (summary.expenseCount === 0) {
    if (cardLabel && subLabel) {
      return `Não encontrei despesas no cartão "${cardLabel}" com "${subLabel}" ${periodPhrase}.`;
    }
    if (cardLabel) {
      return `Não encontrei despesas no cartão "${cardLabel}" ${periodPhrase}.`;
    }
    if (subLabel) {
      return `Não encontrei despesas com "${subLabel}" ${periodPhrase}.`;
    }
    return `Não encontrei despesas registradas ${periodPhrase}.`;
  }

  if (cardLabel && subLabel) {
    const lines: string[] = [
      `No cartão "${cardLabel}", com ${subLabel} você gastou ${total} ${periodPhrase} (${countPhrase}).`,
    ];
    const extra = topCategoryLine(summary.byCategory, "Maior categoria entre essas despesas");
    if (extra) lines.push(extra);
    return lines.join("\n");
  }

  if (cardLabel) {
    const lines: string[] = [
      `No cartão "${cardLabel}" você gastou ${total} ${periodPhrase} (${countPhrase}).`,
    ];
    const extra = topCategoryLine(summary.byCategory, "Maior categoria nesse cartão");
    if (extra) lines.push(extra);
    return lines.join("\n");
  }

  if (subLabel) {
    const lines: string[] = [
      `Com ${subLabel} você gastou ${total} ${periodPhrase} (${countPhrase}).`,
    ];
    const extra = topCategoryLine(summary.byCategory, "Maior categoria entre essas despesas");
    if (extra) lines.push(extra);
    return lines.join("\n");
  }

  const lines: string[] = [
    `Você gastou ${total} ${periodPhrase} (${countPhrase}).`,
  ];

  const top = summary.byCategory[0];
  if (top && top.totalAmount > 0) {
    const label = CATEGORY_LABELS[top.category] ?? top.category;
    lines.push(`Maior categoria: ${label.toLowerCase()} (${formatBrl(top.totalAmount)}).`);
  }

  return lines.join("\n");
}
