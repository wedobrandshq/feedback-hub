CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'ignored', 'linked');

CREATE TABLE "feedback_suggestions" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "suggested_type" "FeedbackType",
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "request_id" TEXT,
    "similarity" DOUBLE PRECISION,
    "model" TEXT NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "feedback_suggestions_feedback_id_key" ON "feedback_suggestions"("feedback_id");
CREATE INDEX "feedback_suggestions_request_id_idx" ON "feedback_suggestions"("request_id");

ALTER TABLE "feedback_suggestions" ADD CONSTRAINT "feedback_suggestions_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "feedback_suggestions" ADD CONSTRAINT "feedback_suggestions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "request_summaries" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "feedback_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_summaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "request_summaries_request_id_key" ON "request_summaries"("request_id");

ALTER TABLE "request_summaries" ADD CONSTRAINT "request_summaries_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
