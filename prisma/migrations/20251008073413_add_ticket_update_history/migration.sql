-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "updateHistory" JSONB NOT NULL DEFAULT '[]';
