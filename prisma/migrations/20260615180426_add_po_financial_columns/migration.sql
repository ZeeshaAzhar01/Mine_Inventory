/*
  Warnings:

  - Added the required column `subtotal` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.
  - Made the column `itc_amount` on table `PurchaseOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_amount" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "itc_amount" SET NOT NULL;
