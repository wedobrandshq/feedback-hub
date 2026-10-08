import path from "node:path";
import { defineConfig } from "vitest/config";

const testDatabaseUrl = "postgresql://feedback:feedback@localhost:5432/feedback_hub_test";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      DATABASE_URL_UNPOOLED: testDatabaseUrl,
      WILLOW_APP_SECRET: "willow-dev-secret",
      EARNIT_APP_SECRET: "earnit-dev-secret",
      AUTH_SECRET: "dev-only-auth-secret-change-me-32bytes",
      ADMIN_EMAIL: "owner@healthysteps.example",
      ADMIN_PASSWORD: "owner-local-dev",
      ATTACHMENT_DIR: path.join(process.cwd(), "data", "test-attachments"),
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
