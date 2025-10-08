-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Activity_userId_isRead_idx" ON "Activity"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Activity_expiresAt_idx" ON "Activity"("expiresAt");
