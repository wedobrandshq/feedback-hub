# Feedback Hub

Feedback Hub is a multi-app product feedback system. A person submits feedback inside a host app, it becomes a conversation, and an admin can reply. The person sees that reply in the host app and can answer.

Healthy Steps is the seeded workspace. It has two apps, Willow and Earn It. The phone at `/demo` is Willow. The admin tool lists and opens feedback for one app or for every app.

Product rules live in [docs/PRODUCT.md](docs/PRODUCT.md). Choices this slice had to make are in [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md).

## What this slice includes

- Open feedback from the Willow demo by holding the marked walk card for half a second. A tap on that card logs a walk and does not open feedback. The window is kind, message, optional screenshot, and thanks.
- Identify the seeded Willow user on the server. The browser does not send an app secret or choose who the message belongs to.
- Store the original message, submission context, and screenshot.
- Create a conversation and the first in-app message from that submission.
- Admin Inbox and conversation detail: reply, close, and reopen. Reply also works on feedback detail.
- Willow Messages: unread badge, thread, and a reply from that user.
- Events for `feedback.created`, `feedback.reviewed`, `feedback.closed`, `conversation.created`, `message.sent`, and `conversation.closed`.

Requests, voting, roadmap, changelog, notifications, and the other admin sections are not in this slice. Those nav items explain that. Email delivery is not built.

## Local setup

You need Node.js 22+ and PostgreSQL 16.

```bash
createdb feedback_hub
createdb feedback_hub_test
cp .env.example .env
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run dev
```

The dev server listens on [http://127.0.0.1:43123](http://127.0.0.1:43123).

| Path | What it is |
| --- | --- |
| `/demo` | Willow phone. Feedback and Messages. |
| `/admin/login` | Admin sign-in |
| `/admin/inbox` | Conversations that need attention |
| `/admin/feedback` | Feedback list |

`.env.example` matches a local database user `feedback` with password `feedback`. Change `DATABASE_URL` if your Postgres user is different. Create that role if you want the example URL as written:

```bash
createuser feedback --pwprompt
# password: feedback
createdb -O feedback feedback_hub
createdb -O feedback feedback_hub_test
```

## Seeded admin login

| | |
| --- | --- |
| Email | `owner@healthysteps.example` |
| Password | `owner-local-dev` |
| Role | Owner of Healthy Steps |

Override `ADMIN_EMAIL` and `ADMIN_PASSWORD` before seeding if you want different credentials. Reseed after changing them.

The Willow demo is Maya Chen (`maya.chen@example.com`, plan Plus). Earn It starts with no users. App credentials live only in server environment variables (`WILLOW_APP_SECRET`, `EARNIT_APP_SECRET`).

## Tests

```bash
npm test
```

Tests use `feedback_hub_test` and cover submit, identify (upsert by app + external user id), separation between Willow and Earn It, an admin reply, a user reply, and that Earn It cannot see a Willow conversation.

## Hosted

Production uses hosted Postgres and Vercel Blob. The build runs `prisma migrate deploy` and the seed, so a fresh deploy has Healthy Steps, Willow, Earn It, the Willow demo user, and the owner login above.

Set these on the host. Do not commit their production values.

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection |
| `DATABASE_URL_UNPOOLED` | Direct connection for migrations |
| `WILLOW_APP_SECRET` | Server credential for Willow |
| `EARNIT_APP_SECRET` | Server credential for Earn It |
| `AUTH_SECRET` | Admin session signing key |
| `ADMIN_EMAIL` | Seeded owner email |
| `ADMIN_PASSWORD` | Seeded owner password |
| `BLOB_READ_WRITE_TOKEN` | Private screenshot store |

Local development keeps screenshots on disk when `BLOB_READ_WRITE_TOKEN` is unset. `/demo` is public. Admin pages stay behind the owner login.

## Scripts

```bash
npm run dev          # next dev on 0.0.0.0:43123
npm test             # migrate the test database, then vitest
npm run db:seed      # seed the database in DATABASE_URL
npm run lint
```
