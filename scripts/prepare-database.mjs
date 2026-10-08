import { spawnSync } from "node:child_process";

const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!directUrl) {
  console.error("DATABASE_URL is required to migrate and seed.");
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: directUrl,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || directUrl,
};

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["prisma", "db", "seed"]);
