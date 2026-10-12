CREATE TABLE "admin_app_access" (
    "admin_user_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,

    CONSTRAINT "admin_app_access_pkey" PRIMARY KEY ("admin_user_id","app_id")
);

CREATE INDEX "admin_app_access_app_id_idx" ON "admin_app_access"("app_id");

ALTER TABLE "admin_app_access" ADD CONSTRAINT "admin_app_access_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_app_access" ADD CONSTRAINT "admin_app_access_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "admin_app_access" ("admin_user_id", "app_id")
SELECT "admin_users"."id", "apps"."id"
FROM "admin_users"
JOIN "apps" ON "apps"."workspace_id" = "admin_users"."workspace_id"
ON CONFLICT DO NOTHING;
