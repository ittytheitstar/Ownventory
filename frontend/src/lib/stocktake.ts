import { Prisma } from '@prisma/client';

const stocktakeSessionInclude = {
  catalogue: { select: { id: true, name: true, icon: true } },
  collection: {
    select: {
      id: true,
      name: true,
      catalogue: { select: { id: true, name: true, icon: true } },
    },
  },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  items: {
    orderBy: [{ expected: 'desc' }, { createdAt: 'asc' }],
    include: {
      item: {
        include: {
          catalogue: { select: { id: true, name: true, icon: true } },
          collections: {
            include: {
              collection: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.StocktakeSessionInclude;

export const stocktakeSessionArgs = {
  include: stocktakeSessionInclude,
} satisfies Prisma.StocktakeSessionDefaultArgs;

export type StocktakeSessionWithItems = Prisma.StocktakeSessionGetPayload<typeof stocktakeSessionArgs>;

export function summarizeStocktakeSession(session: StocktakeSessionWithItems) {
  const expectedItems = session.items.filter((item) => item.expected);
  const confirmedItems = expectedItems.filter((item) => item.scannedAt);
  const missingItems = expectedItems.filter((item) => !item.scannedAt);
  const newItems = session.items.filter((item) => !item.expected && item.scannedAt);

  return {
    expected: expectedItems.length,
    confirmed: confirmedItems.length,
    missing: missingItems.length,
    new: newItems.length,
  };
}

export function serializeStocktakeSession(session: StocktakeSessionWithItems) {
  return {
    ...session,
    summary: summarizeStocktakeSession(session),
  };
}
