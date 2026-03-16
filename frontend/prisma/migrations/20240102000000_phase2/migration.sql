-- AlterTable
ALTER TABLE "Item" ADD COLUMN "estimatedValue" DECIMAL(10,2),
                   ADD COLUMN "valueFetchedAt" TIMESTAMP(3);
