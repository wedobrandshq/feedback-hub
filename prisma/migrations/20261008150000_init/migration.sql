-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('iOS', 'Android', 'Web', 'Cross-platform');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('idea', 'problem', 'improvement', 'bug', 'other');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('new', 'reviewed', 'linked', 'closed');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "platform" "Platform" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "credential_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "external_user_id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "plan" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "app_version" TEXT,
    "os_version" TEXT,
    "device" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'in_app',
    "app_version_at_submission" TEXT,
    "os_version_at_submission" TEXT,
    "device_at_submission" TEXT,
    "locale_at_submission" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_attachments" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "apps_credential_hash_key" ON "apps"("credential_hash");

-- CreateIndex
CREATE INDEX "apps_workspace_id_idx" ON "apps"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "apps_workspace_id_slug_key" ON "apps"("workspace_id", "slug");

-- CreateIndex
CREATE INDEX "users_app_id_idx" ON "users"("app_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_app_id_external_user_id_key" ON "users"("app_id", "external_user_id");

-- CreateIndex
CREATE INDEX "feedback_app_id_created_at_idx" ON "feedback"("app_id", "created_at");

-- CreateIndex
CREATE INDEX "feedback_user_id_idx" ON "feedback"("user_id");

-- CreateIndex
CREATE INDEX "feedback_status_idx" ON "feedback"("status");

-- CreateIndex
CREATE INDEX "feedback_type_idx" ON "feedback"("type");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_attachments_storage_key_key" ON "feedback_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "feedback_attachments_feedback_id_idx" ON "feedback_attachments"("feedback_id");

-- CreateIndex
CREATE INDEX "events_entity_type_entity_id_created_at_idx" ON "events"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "events_app_id_created_at_idx" ON "events"("app_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_workspace_id_idx" ON "admin_users"("workspace_id");

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_attachments" ADD CONSTRAINT "feedback_attachments_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

