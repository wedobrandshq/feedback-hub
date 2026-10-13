ALTER TABLE "feedback_suggestions" ADD COLUMN "urgent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "feedback_suggestions" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';
