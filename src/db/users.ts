import { prisma } from "./prisma.js";

export async function getOrCreateUserByPhone(phoneNumber: string) {
  const normalized = phoneNumber.trim();
  return prisma.user.upsert({
    where: { phoneNumber: normalized },
    create: { phoneNumber: normalized },
    update: {},
  });
}
