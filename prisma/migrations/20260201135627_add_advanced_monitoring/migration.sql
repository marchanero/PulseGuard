-- AlterTable
ALTER TABLE "Service" ADD COLUMN "contentMatch" TEXT;
ALTER TABLE "Service" ADD COLUMN "dbConnectionString" TEXT;
ALTER TABLE "Service" ADD COLUMN "dbType" TEXT;
ALTER TABLE "Service" ADD COLUMN "sslDaysRemaining" INTEGER;
ALTER TABLE "Service" ADD COLUMN "sslExpiryDate" DATETIME;
