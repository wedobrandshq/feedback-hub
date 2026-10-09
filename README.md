# Feedback Hub

Feedback Hub is a multi-app product feedback system. A person submits feedback inside a host app, it becomes a conversation, and an admin can reply. The person sees that reply in the host app and can answer.

Healthy Steps is the seeded workspace. It has two apps, Willow and Earn It. The phone at `/demo` is Willow. The admin tool lists and opens feedback for one app or for every app.

Product rules live in [docs/PRODUCT.md](docs/PRODUCT.md). Choices this slice had to make are in [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md).

## What this slice includes

- Open the Feedback Hub window from the Willow icon, or by holding the marked walk card. A tap on that card logs a walk. The window is submit feedback, public requests with voting, and the roadmap.
- Identify the seeded Willow user on the server. The browser does not send an app secret or choose who the message belongs to.
- Store the original message, submission context, and screenshot.
- Create a conversation and the first in-app message from that submission.
- Admin Inbox and conversation detail: reply, close, and reopen. Reply also works on feedback detail.
- Willow Messages: unread badge, thread, and a reply from that user.
- Create a private request from feedback, link and unlink other feedback, and publish it. Willow can vote once. A status change moves the request and does not notify. The phone shows public requests and one roadmap. The admin Changelog stays the release note.
- Admin Home shows the last 30 days of feedback, new requests, conversations, and votes as separate numbers, plus trending requests and conversations that need a reply.
- Users list and user detail for product context. Apps lists connected apps. Settings shows the signed-in owner and workspace.
- New feedback can store a generated suggestion: a type, topics, and one existing request with the similarity the model returned. An admin can link that request, create a request, or ignore it. The original message stays as submitted. A request with linked feedback can show a short generated summary to admins. The Willow demo does not show suggestions, similarity, or that summary.
- Events for feedback, conversations, requests, votes, updates, and in-app notifications.

Email, push, Slack, Jira, surveys, public comments, and a web SDK are not built.

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
| `/demo` | Willow phone. An icon opens the Feedback Hub window. |
| `/admin` | Home: signals, trending requests, needs attention |
| `/admin/login` | Admin sign-in |
| `/admin/users` | Users and user detail |
| `/admin/apps` | Connected apps |
| `/admin/settings` | Signed-in owner and workspace |
| `/admin/inbox` | Conversations that need attention |
| `/admin/feedback` | Feedback list |
| `/admin/requests` | Requests, with feedback and votes kept as separate counts |
| `/admin/roadmap` | Public requests by status |
| `/admin/changelog` | One entry per released request |

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

## Embed

The host server identifies the user it already knows. The app secret stays in that server’s environment. The response `session` goes in the snippet. Do not put the secret, or a raw user id, on the icon.

```bash
curl -s -X POST https://feedback-hub-smoky.vercel.app/api/embed/session \
  -H "Authorization: Bearer $APP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"userId":"usr_maya_chen","email":"maya.chen@example.com","name":"Maya Chen","plan":"Plus"}'
```

```html
<button type="button" data-fh-open aria-label="Feedback">
  <!-- your icon -->
</button>
<script src="https://feedback-hub-smoky.vercel.app/embed.js" data-session="SESSION"></script>
```

A tap on the button opens one window: submit feedback, public requests with voting, and the roadmap (Planned, In progress, and Released).

## Tests

```bash
npm test
```

Tests use `feedback_hub_test` and cover submit, identify, Willow and Earn It separation, replies, creating and linking a request, publish, one vote, status changes, updates, in-app notices, and that Earn It cannot vote on a Willow request.

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
