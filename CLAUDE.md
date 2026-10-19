@AGENTS.md

# Feedback Hub

Product rules are in [docs/PRODUCT.md](docs/PRODUCT.md) and open choices in [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md). Read them before changing behavior. Local setup and commands are in [README.md](README.md).

This repo is worked on from both Claude Code and Cursor. GitHub (`wedobrandshq/feedback-hub`) is the shared state: push finished work so the other tool sees it.

## Scope

- First ship is the feedback submit slice on TypeScript, Next.js, and Postgres, with a demo host app (Willow at `/demo`) and the admin web app (`/admin`). The iOS SDK waits until that loop works.
- Review builds go to Vercel with a public demo URL: https://feedback-hub-smoky.vercel.app
- The host embed is a snippet on a view the owner chooses, attached to the host's own icon. A tap opens the Feedback Hub window: feedback, votable requests, and the status roadmap. The app secret stays on the host server. Each app's install snippet is on that app's own page in the admin.
- The user phone keeps feedback, votable requests, one status roadmap, and Messages. What's new and the Updates inbox stay off.

## Console accounts

- The owner edits their profile, adds Owner and Admin accounts, adds an app, and edits that app's name, platform, and status. An admin edits only their own profile.
- Changing a password asks for the current password, the new password, and a retype.
- Adding a person confirms the password and chooses which apps that person can access.

## AI suggestions

A new feedback message gets a TypeLLM suggestion for the admin: type, urgency, a one-sentence summary, and a request match only when the model is confident. The admin still links, creates, or ignores. Users never see it.

## Admin design (Feedie)

- Type: Bricolage Grotesque for the name, Outfit for text and links, Space Mono for sticker labels.
- Hatch sticker style: cream paper, ink borders, lime labels, separate status colors, and flat fields that shadow when active.
- Every admin button, filter, tab, and menu item lifts slightly up and left on hover and gains a small hard shadow, then settles back on click.
- Status, type, and attention marks follow the Hatch stack pills: quiet type, a small icon with the label, an ink border, and a hard shadow.
- The Feedie wordmark links to the admin home. On a phone the menu icon sits before Feedie, All Apps sits on the right, and there is no line under that bar. The menu opens to the bottom of the screen with a short fade and slide.
- The app picker stays in the top-right corner, without an "App" label.
- The sidebar shows the name and role on one line, then the company name. The company is Healthy Steps LLC; the company name and the role are edited in Settings.
