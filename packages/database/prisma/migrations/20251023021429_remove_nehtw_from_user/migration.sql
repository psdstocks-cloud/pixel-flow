/*
  Warnings:

  - You are about to drop the column `completedAt` on the `Batch` table. All the data in the column will be lost.
  - You are about to alter the column `totalCost` on the `Batch` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - The `status` column on the `Batch` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `batchOrder` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `linkType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `maxRetries` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `responseType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `stockSize` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `stockSource` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `cost` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `price` on the `StockSite` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `nehtwApiKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nehtwUsername` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `stockUrl` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_packageId_fkey";

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_userId_fkey";

-- DropIndex
DROP INDEX "Batch_status_idx";

-- DropIndex
DROP INDEX "Order_status_idx";

-- DropIndex
DROP INDEX "StockSite_active_idx";

-- DropIndex
DROP INDEX "StockSite_name_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "completedAt",
ALTER COLUMN "totalCost" SET DATA TYPE INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PROCESSING';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "batchOrder",
DROP COLUMN "completedAt",
DROP COLUMN "linkType",
DROP COLUMN "maxRetries",
DROP COLUMN "responseType",
DROP COLUMN "stockSize",
DROP COLUMN "stockSource",
ALTER COLUMN "stockUrl" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "cost" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "StockSite" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "price" SET DEFAULT 10,
ALTER COLUMN "price" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "nehtwApiKey",
DROP COLUMN "nehtwUsername",
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "Package";

-- DropTable
DROP TABLE "UserSubscription";

-- DropTable
DROP TABLE "VerificationToken";

-- DropEnum
DROP TYPE "BatchStatus";

-- DropEnum
DROP TYPE "OrderStatus";
