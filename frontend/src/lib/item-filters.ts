import { ItemStatus, Prisma } from '@prisma/client';

export type ItemFilterInput = {
  catalogueId?: string | null;
  collectionId?: string | null;
  status?: string | null;
  q?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  valueMin?: string | null;
  valueMax?: string | null;
};

export function buildItemWhere(filters: ItemFilterInput): Prisma.ItemWhereInput {
  const {
    catalogueId,
    collectionId,
    status,
    q,
    dateFrom,
    dateTo,
    valueMin,
    valueMax,
  } = filters;

  const createdAt: Prisma.DateTimeFilter = {};
  if (dateFrom) createdAt.gte = new Date(dateFrom);
  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    createdAt.lte = endOfDay;
  }

  const estimatedValue: { gte?: Prisma.Decimal; lte?: Prisma.Decimal } = {};
  if (valueMin && !Number.isNaN(Number(valueMin))) {
    estimatedValue.gte = new Prisma.Decimal(valueMin);
  }
  if (valueMax && !Number.isNaN(Number(valueMax))) {
    estimatedValue.lte = new Prisma.Decimal(valueMax);
  }

  const search = q?.trim();

  return {
    ...(catalogueId ? { catalogueId } : {}),
    ...(status && Object.values(ItemStatus).includes(status as ItemStatus)
      ? { status: status as ItemStatus }
      : {}),
    ...(collectionId ? { collections: { some: { collectionId } } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
            { manufacturer: { contains: search, mode: 'insensitive' } },
            { publisher: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
    ...(Object.keys(estimatedValue).length ? { estimatedValue } : {}),
  };
}
