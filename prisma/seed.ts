import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Use this `phoneNumber` in webhook curls after seeding. */
const SEED_PHONE = "+5551987654321";

function noon(y: number, month: number, day: number): Date {
  return new Date(y, month, day, 12, 0, 0, 0);
}

async function main() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  await prisma.expense.deleteMany({
    where: { user: { phoneNumber: SEED_PHONE } },
  });
  await prisma.card.deleteMany({
    where: { user: { phoneNumber: SEED_PHONE } },
  });

  const user = await prisma.user.upsert({
    where: { phoneNumber: SEED_PHONE },
    create: { phoneNumber: SEED_PHONE },
    update: {},
  });

  const nubank = await prisma.card.create({
    data: {
      userId: user.id,
      name: "Nubank",
      limit: 8000,
    },
  });

  await prisma.card.create({
    data: {
      userId: user.id,
      name: "Inter",
      limit: 5000,
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        userId: user.id,
        cardId: nubank.id,
        amount: 45.9,
        category: "TRANSPORT",
        subcategory: "Uber",
        description: "ida ao centro",
        date: noon(y, m, d),
      },
      {
        userId: user.id,
        cardId: nubank.id,
        amount: 32.5,
        category: "TRANSPORT",
        subcategory: "Uber",
        description: "volta",
        date: noon(y, m, Math.max(1, d - 2)),
      },
      {
        userId: user.id,
        cardId: nubank.id,
        amount: 89.9,
        category: "FOOD",
        subcategory: "iFood",
        description: "jantar",
        date: noon(y, m, Math.max(1, d - 1)),
      },
      {
        userId: user.id,
        cardId: nubank.id,
        amount: 156.4,
        category: "FOOD",
        subcategory: null,
        description: "compras no mercado",
        date: noon(y, m, Math.max(1, d - 5)),
      },
      {
        userId: user.id,
        cardId: nubank.id,
        amount: 12,
        category: "FOOD",
        subcategory: null,
        description: "café",
        date: noon(y, m, Math.max(1, d - 3)),
      },
      {
        userId: user.id,
        cardId: nubank.id,
        amount: 120,
        category: "ENTERTAINMENT",
        subcategory: "Netflix",
        description: "assinatura",
        date: noon(y, m, 3),
      },
      {
        userId: user.id,
        cardId: nubank.id,
        amount: 2500,
        category: "HOUSING",
        subcategory: null,
        description: "aluguel",
        date: noon(y, m, 1),
      },
    ],
  });

  const count = await prisma.expense.count({ where: { userId: user.id } });
  console.log(
    `Seeded user ${SEED_PHONE} with 2 cards (Nubank + Inter); ${count} expenses on Nubank (current month dates).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
