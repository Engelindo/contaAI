import { prisma } from "./prisma.js";

/** Default limit in BRL when auto-creating a card from a name only (0 = not set). */
export const DEFAULT_CARD_LIMIT = 0;

export async function listCardsForUser(userId: string) {
  return prisma.card.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function findCardByNameInsensitive(userId: string, rawName: string) {
  const name = rawName.trim();
  if (!name) return null;
  return prisma.card.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
    },
  });
}

export async function createCardWithDefaults(userId: string, displayName: string) {
  const name = displayName.trim();
  return prisma.card.create({
    data: {
      userId,
      name,
      limit: DEFAULT_CARD_LIMIT,
    },
  });
}

export async function findOrCreateCardByName(userId: string, rawName: string) {
  const existing = await findCardByNameInsensitive(userId, rawName);
  if (existing) return existing;
  return createCardWithDefaults(userId, rawName);
}

export type AddCardFields = {
  name: string;
  limit?: number;
};

export async function upsertCardFromIntent(userId: string, input: AddCardFields) {
  const name = input.name.trim();
  const existing = await findCardByNameInsensitive(userId, name);
  const limit = input.limit ?? DEFAULT_CARD_LIMIT;

  if (existing) {
    return prisma.card.update({
      where: { id: existing.id },
      data: {
        limit: input.limit !== undefined ? input.limit : existing.limit,
      },
    });
  }

  return prisma.card.create({
    data: {
      userId,
      name,
      limit,
    },
  });
}

export type CardResolution =
  | { ok: true; cardId: string }
  | {
      ok: false;
      code: "NO_CARDS" | "CARD_REQUIRED";
      cards: { id: string; name: string }[];
    };

/**
 * Rules for attaching an expense to a card when the parser did not send a card name.
 */
export async function resolveCardIdForNewExpense(
  userId: string,
  parsedCardName: string | undefined,
): Promise<CardResolution> {
  if (parsedCardName) {
    const card = await findOrCreateCardByName(userId, parsedCardName);
    return { ok: true, cardId: card.id };
  }

  const cards = await listCardsForUser(userId);
  if (cards.length === 0) {
    return { ok: false, code: "NO_CARDS", cards: [] };
  }
  if (cards.length === 1) {
    const [only] = cards;
    if (!only) {
      return { ok: false, code: "NO_CARDS", cards: [] };
    }
    return { ok: true, cardId: only.id };
  }
  return { ok: false, code: "CARD_REQUIRED", cards };
}
