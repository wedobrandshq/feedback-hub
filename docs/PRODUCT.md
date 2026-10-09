# Feedback Hub — Master Product Specification — Version 1.0

Source of truth for product behavior. Do not invent business logic. If implementation reveals an ambiguity, document it. If a decision materially changes product behavior, update this specification.

## Confirmed decision — 9 October 2026

Willow’s phone does not include What’s new or Updates. It keeps hold-to-open feedback, requests with voting, one roadmap, and Messages. Popular requests and View all requests stay. That roadmap is the user’s status view: Planned, In progress, and Released. There is not a second roadmap screen.

An admin status change writes the event and moves the request. It does not ask whether to notify, and it does not send an in-app notification. The admin Changelog stays the release note on a Released request. The admin Roadmap stays.

## 1. Product overview

Feedback Hub is a centralized feedback management platform for multiple mobile applications.

The platform allows mobile app users to:

- submit feedback
- report problems
- suggest improvements
- request new features
- see existing feature requests
- vote for feature requests
- see the status of requests
- receive replies from the product team
- continue conversations with the product team
- see what is planned, in progress, or released
- receive updates when something they requested or voted for changes

The admin uses a web application to:

- receive feedback from all connected applications
- identify the user who submitted each piece of feedback
- reply directly to the user
- manage conversations
- categorize feedback
- connect multiple feedback submissions to one product request
- create and manage feature requests
- see how many users independently reported a need
- see how many users voted for a request
- publish request statuses
- manage a product roadmap
- notify interested users when a request changes
- analyze feedback trends
- eventually use AI to classify, group, summarize, and detect duplicate feedback

The fundamental product loop is:

USER → FEEDBACK → CONVERSATION → PRODUCT REQUEST → VOTES → PRODUCT DECISION → ROADMAP → DEVELOPMENT → RELEASE → USER NOTIFICATION

The system must preserve this loop throughout the architecture.

## 2. Core product principle

Feedback and Feature Requests are NOT the same thing.

### Feedback

Feedback is an original message submitted by an individual user.

Example: “I would love to see how my mood changed during the last week.”

This message must always remain stored exactly as submitted. It belongs to one app, one user, one feedback record.

Feedback may optionally be linked to a Product Request.

### Product Request

A Product Request represents a broader product need shared by multiple users.

Example: Weekly Mood Summary

The request may contain 37 individual feedback submissions, 143 votes, 28 conversations.

Feedback must never be destroyed when it is connected or merged into a Product Request. The original user message always remains available.

## 3. Multi-app architecture

The system must support multiple applications from the beginning.

Structure: Workspace → Apps → Users, Feedback, Conversations, Requests, Votes, Roadmap, Notifications

Example workspace: Healthy Steps. Apps: Willow, Earn It, App 3, App 4.

Every major database object must include an app relationship where appropriate.

The admin must be able to work in Single App Mode (example: Willow only) and All Apps Mode (aggregated information from every application).

Requests normally belong to one application. Cross-app requests may be considered later but are not required for V1.

## 4. User identification

Feedback should normally NOT be anonymous when the host application already knows the user.

The host application identifies the user through the Feedback SDK.

Conceptual call: `Feedback.identify({ userId, email, name, plan })`

The SDK should automatically attach available context: app ID, user ID, email, name, account creation date, subscription plan, app version, OS version, device model, locale, timezone, session ID.

Not every field is required. The system must work even if only user ID is available.

## 5. Main data model

Core entities: Workspace, App, User, Feedback, FeedbackAttachment, Conversation, Message, Request, RequestFeedback, Vote, RequestUpdate, Notification, Event.

## 6. Workspace

A Workspace is the highest-level organizational object. Example: Healthy Steps LLC.

A Workspace contains applications, admin users, and workspace settings.

V1 can assume one workspace per admin account, but architecture should not prevent multiple workspaces later.

## 7. App

Each connected product is represented as an App.

Fields: id, workspace_id, name, slug, icon, platform, status, created_at, updated_at.

Possible platform values: iOS, Android, Web, Cross-platform.

One application may eventually have multiple platform SDKs.

## 8. User

A User represents an end user of one of the connected applications.

Fields: id, app_id, external_user_id, email, name, plan, locale, timezone, app_version, os_version, device, created_at, last_seen_at, metadata.

The system should allow custom metadata. Examples: subscription_status, country, onboarding_variant, experiment_group, lifetime_value.

Do not hardcode every future user property into the database schema. Use metadata where appropriate.

## 9. Feedback

Feedback is the core incoming signal.

Fields: id, app_id, user_id, type, title, body, status, source, created_at, updated_at.

Possible types: idea, problem, improvement, bug, other.

Possible internal statuses: new, reviewed, linked, closed.

Feedback should also store contextual information captured at submission time: app_version_at_submission, os_version_at_submission, device_at_submission, locale_at_submission.

This is important because the user’s current environment may later change.

## 10. Feedback attachments

Users should be able to attach screenshots. V1 should support images and screenshots. Future versions may support screen recordings, video, and files.

Attachments belong to Feedback.

## 11. Conversations

Every feedback submission should be capable of becoming a conversation.

A conversation connects App, User, Feedback, and Messages.

The admin must be able to reply directly to the user. The user must be able to reply back.

Conversation channels may eventually include in-app and email. For V1, in-app messaging should be the primary channel. Email support should be architecturally possible.

## 12. Message

A Message belongs to a Conversation.

Fields: id, conversation_id, sender_type, sender_id, body, channel, created_at, read_at.

Possible sender types: user, admin, system.

Possible channels: in_app, email.

Messages should be shown chronologically.

## 13. Request

A Request represents a consolidated product need. Example: Dark Mode.

Fields: id, app_id, title, description, status, visibility, created_at, updated_at, released_at.

Requests may contain feedback submissions, votes, conversations, and updates.

## 14. Request status

Use a small, controlled status system.

Internal statuses: Review, Under consideration.

Public roadmap statuses: Planned, In progress, Released.

Terminal status: Not planned.

Do not expose every internal state to users. Review may remain completely internal.

The public user experience should focus primarily on: Under consideration, Planned, In progress, Released, Not planned.

## 15. Request visibility

A Request may be private or public.

Private means visible only to admins. Public means visible to users through the mobile application.

Creating a Request from feedback must NOT automatically make it public. Admin explicitly controls publication.

## 16. Feedback → Request relationship

Many Feedback records may belong to one Request.

Example request Dark Mode linked to feedback #1002 “Please add dark mode.”, #1045 “The app is too bright at night.”, #1123 “Could you make a black theme?”, #1198 “Night mode please.”

All original feedback remains preserved. The Request aggregates these signals.

Important metrics, which must not be treated as the same metric: feedback_count, unique_feedback_users, vote_count, unique_voters, conversation_count.

## 17. Voting

Users can vote for public Requests.

Rules: one user can cast a maximum of one vote per Request. A user can remove their vote. Voting should not require additional authentication if the host app already identifies the user.

Vote entity: id, request_id, user_id, created_at. Unique constraint: request_id + user_id.

## 18. Feedback count vs vote count

These metrics must remain separate.

Example: Weekly Mood Summary — 37 feedback submissions, 143 votes. 37 users independently expressed the need through feedback. 143 users explicitly supported the consolidated request.

Both signals are valuable but represent different user behavior. Never combine them into one generic popularity number.

## 19. User mobile experience

The feedback functionality will live inside existing mobile applications. It should feel like a native part of the host app.

Main entry: Feedback.

Possible screen:

Feedback. Help us make [App] better. [ Share feedback ]

Popular requests, for example Dark mode 284, Apple Watch support 197, Weekly mood summary 143, Custom reminders 96. [ View all requests ]

## 20. Submit feedback flow

Step 1: Ask what kind of feedback the user wants to send. Options: I have an idea, Something isn’t working, Something could be better, Other.

Step 2: Text input. Example label: Tell us more.

Step 3: Optional screenshot. [ Add screenshot ]

Step 4: Submit.

The form should remain deliberately simple. Do not ask users to manually enter device, OS, app version, email, or account ID if this information is already available from the host application.

## 21. Duplicate request suggestion

Eventually, when the user types feedback, the system should search existing public Requests.

Example: user types “I wish the app had dark mode.” The system may show Similar requests: Dark Mode, 284 people voted, [ Vote ], [ Continue with my feedback ].

Never prevent the user from submitting their own feedback. The user may still have unique context worth preserving.

## 22. Feedback submission confirmation

After submission, thank the user. Example: Thanks for helping us improve [App]. If appropriate, tell them they will receive an update if the team responds. Do not promise that every feature will be implemented.

## 23. Requests — mobile

Users should be able to browse public Requests. Possible filters: Popular, Newest, Planned, In progress, Released. V1 does not need complex filtering.

Each item should show title, status, vote count, and whether the current user voted.

## 24. Request detail — mobile

Example: Weekly Mood Summary, 143 votes, status Planned, description, Vote or Voted, and updates.

The user should NOT see internal admin notes, internal prioritization, private feedback from other users, email addresses, individual user identities, or internal AI analysis.

## 25. Roadmap — mobile

Keep the roadmap simple. Sections: PLANNED, IN PROGRESS, RECENTLY RELEASED.

Do not build a complex Kanban interface for users.

## 26. User messages

Users should have a way to see conversations with the product team. Possible entry: Messages. Unread replies should have a badge.

## 27. Admin web application

The admin experience is a separate web application.

Primary navigation:

HOME: Home

COMMUNICATION: Inbox, Feedback

PRODUCT: Requests, Roadmap, Changelog

USERS: Users

SYSTEM: Apps, Settings

Keep navigation simple. Do not create unnecessary nested navigation.

## 28. Global app selector

Admin must be able to switch between All Apps, Willow, Earn It, and so on.

The currently selected App affects Home, Inbox, Feedback, Requests, Roadmap, Users, and analytics.

When All Apps is selected, aggregate where logically possible.

## 29. Admin home

Home answers: “What are users telling us right now?” Do not make it a generic analytics dashboard.

Primary sections: Product Signals, Trending Requests, Emerging Topics, Needs Attention.

AI-driven Emerging Topics can be added after sufficient data exists.

## 30. Admin inbox

Inbox is the communication center. Primary purpose: show conversations requiring admin attention.

Filters: All, Unread, Needs reply, Closed.

The inbox should prioritize communication rather than product organization.

## 31. Conversation detail

Conversation detail should provide context without requiring navigation away from the conversation.

Suggested layout: left/main conversation messages; right user context, feedback context, linked Request.

Admin should be able to reply, close conversation, reopen conversation, link Request, unlink Request, view User, and view original Feedback.

## 32. Admin feedback list

Feedback is different from Inbox. Inbox organizes communication. Feedback organizes product signals.

Columns: Feedback, User, App, Type, Request, Status, Created.

Filters: App, Type, Status, Request, Date, Search.

Possible future filters: plan, app version, country, segment.

## 33. Feedback detail

Feedback detail should display original feedback, user, submission context, attachments, linked Request, conversation, internal classification, and activity.

Actions: Reply, Link to Request, Create Request, Change type, Mark reviewed, Close.

## 34. Create request from feedback

Admin may select Create Request. Form: Title, Description, Visibility, Initial status. The originating Feedback automatically becomes linked. Visibility is private initially. Admin can publish later.

## 35. Link feedback to existing request

Admin can search Requests. Selecting a Request creates the relationship. Do not modify or delete the original Feedback.

## 36. Request list — admin

Columns: Request, Status, Visibility, Feedback, Users, Votes, Conversations, Created, Updated.

Allow sorting by Feedback, Votes, Updated, Created.

Potential future sorting: growth, paying users, trend velocity.

## 37. Request detail — admin

Central product intelligence screen. Header with status and visibility. Metrics: Votes, Feedback, Conversations. Sections: Overview, Feedback, Conversations, Updates, Activity.

## 38. Request overview

Display title, description, status, visibility, key metrics, created date, last updated. Eventually AI summary, trend, user segments, related Requests.

## 39. Request feedback tab

Show every Feedback linked to the Request. Each item includes user, feedback text, date, app version, plan if available, conversation indicator. Clicking feedback opens Feedback Detail.

## 40. Request conversations tab

Show conversations connected with Feedback belonging to the Request. Admin can quickly contact users who requested the feature.

## 41. Request updates

Admins can publish updates related to a Request. Updates may be visible to users.

RequestUpdate fields: id, request_id, body, visibility, created_at, published_at.

## 42. Roadmap — admin

Admin roadmap organizes public Requests. Sections: Under consideration, Planned, In progress, Released.

Requests may be moved between statuses. Changing status creates an Event and does not send an in-app notification. The confirmed decision at the top of this document is the rule.

## 43. Changelog

Changelog represents released improvements. A Released Request may generate a Changelog entry. Changelog is secondary to Requests and Roadmap. Keep V1 implementation simple.

## 44. Users — admin

Columns: User, App, Plan, Feedback, Votes, Conversations, Last seen.

Search by name, email, external ID. Filters: App, Plan, Activity.

## 45. User detail

Lightweight product CRM view. Header with name, app, plan. Context: email, external ID, device, OS, app version, locale, created, last seen. Sections: Feedback, Conversations, Votes, Activity.

Do NOT attempt to build a full CRM. The purpose is product context.

## 46. Apps

Apps screen manages connected applications. Each App should display name, icon, platform, status, SDK status, last event received.

Actions: Open, Settings, Integration instructions.

## 47. App settings

Possible settings: App name, App icon, Public feedback enabled, Voting enabled, Roadmap enabled, Messages enabled, Notifications enabled, SDK keys.

Do not expose unnecessary configuration in V1.

## 48. SDK

The product requires an SDK layer for integration into host applications. Initial priority: iOS.

Conceptual capabilities: configure(), identify(), reset(), openFeedback(), submitFeedback(), openRequests(), openRequest(), vote(), unvote(), openRoadmap(), openMessages().

The exact API should be designed during technical implementation.

## 49. SDK user context

The SDK should automatically capture safe technical context: app version, OS version, device model, locale, timezone.

The host app supplies account information. The SDK must not collect unrelated personal information.

## 50. SDK UI strategy

The SDK should allow Feedback Hub functionality to feel integrated with the host app. Initial implementation may use ready-made screens. Long term, support theme colors, font preferences, light/dark appearance, corner radius, navigation appearance.

The host application should not have to rebuild the feedback system.

## 51. Notifications

Users can become interested in a Request through submitting Feedback linked to it, voting, or participating in a Conversation.

Possible channels: in-app, push, email. V1 priority: in-app. Push can follow once host-app integration is ready.

## 52. Notification events

Potential events: admin replied, Request changed to Planned, Request changed to In Progress, Request Released, new Request update.

Admin should control mass product notifications. Do not automatically send email or push messages on every status change.

## 53. Release feedback loop

When status changes to Released, the system asks whether to publish an update and lets the admin choose recipients and channels. Avoid duplicate notifications to the same user.

## 54. Event log

Important actions should create Events. Examples: feedback.created, feedback.reviewed, feedback.linked, feedback.unlinked, conversation.created, message.sent, conversation.closed, request.created, request.published, request.status_changed, request.voted, request.unvoted, request.update_published, notification.sent.

This event system will later power analytics and auditing.

## 55. Activity history

Important entities should expose Activity generated from Events where possible.

## 56. AI — product philosophy

AI should organize information. AI should NOT autonomously make product decisions.

AI responsibilities: classification, topic extraction, duplicate detection, Request matching, clustering, summarization, trend detection, sentiment analysis, translation.

AI should initially suggest actions rather than execute destructive actions.

## 57. AI feedback classification

Pipeline: New Feedback → detect language → classify type → extract topics → analyze sentiment → search existing Requests → suggest Request match → store AI metadata.

Admin can accept or reject suggestions.

## 58. Duplicate detection

AI must not silently merge feedback in V1. Admin actions: Link, Create new Request, Ignore.

## 59. AI request summary

For Requests with many feedback submissions, generate a summary. The summary should be clearly identifiable as generated analysis. Original Feedback must always remain accessible.

## 60. Emerging topics

Later AI should detect clusters that do not yet have Requests. This should be considered post-core functionality.

## 61. Search

Global search should eventually search Feedback, Requests, Users, Conversations. For V1, individual page search is sufficient. Do not block V1 on universal search.

## 62. Permissions

Initial roles: Owner, Admin. Future: Product, Support, Viewer.

V1 may use only Owner/Admin but architecture should support roles later.

## 63. Privacy

Private user feedback must never automatically become publicly visible.

When Feedback becomes linked to a public Request, the Request title and description may be public. The original Feedback remains private unless explicitly designed otherwise.

Never publicly expose user name, email, device identifiers, private conversation, raw Feedback, internal notes, or AI metadata.

## 64. Security

All admin routes require authentication.

App SDK requests require valid app credentials.

Users must only access data belonging to their own App context.

A user must not be able to impersonate another user simply by changing a client-side user ID.

Technical architecture must account for trusted user identity verification.

Never put privileged server secrets inside the mobile SDK.

## 65. API design principles

Use a clear API boundary between Admin Web, Backend, and Mobile SDK.

Do not allow Admin Web to directly manipulate database tables.

All important mutations should go through server-side logic so validation, authorization, events, notifications, analytics, and business rules remain consistent.

## 66. Database principles

Use relational data for core entities.

Likely relationships:

- Workspace 1:N Apps
- App 1:N Users
- App 1:N Feedback
- User 1:N Feedback
- Feedback 0..1 Conversation
- Request N:M Feedback
- Request 1:N Votes
- User 1:N Votes
- Request 1:N RequestUpdates
- Conversation 1:N Messages

Avoid storing important relationships only inside JSON. Metadata can use JSON where appropriate.

## 67. Important database constraints

Enforce:

- one Vote per User per Request
- Feedback always belongs to an App
- Request always belongs to an App
- User belongs to an App
- Messages always belong to a Conversation
- Deleting a Request must not delete original Feedback
- Deleting/unlinking a relationship must not destroy original Feedback

Prefer soft deletion for important user-generated data.

## 68. Product signals

Do not create one artificial popularity score in V1.

Keep raw signals understandable. For every Request show separately: Votes, Feedback, Unique Feedback Users, Conversations, Recent Feedback, Recent Votes.

## 69. Admin home metrics

Useful metrics: Feedback received, Feedback change vs previous period, Open conversations, Needs reply, New Requests, Votes, Released Requests, Trending Requests.

Do not overload Home with charts. The goal is actionability.

## 70. Empty states

Every screen needs useful empty states.

Examples:

- No feedback yet. Connect your first app or send test feedback. [ Integration guide ]
- No requests yet. Create a Request from user feedback instead of creating speculative roadmap items.
- You’re all caught up. No conversations currently need a reply.

## 71. Loading / error states

Every data-driven screen must implement loading, empty, error, and success. Do not build interfaces that only work with mock data.

## 72. Design philosophy

Admin Web should feel like a serious modern product tool: clean, minimal, dense enough for productive work, strong typography, subtle separators, large amounts of whitespace where appropriate, minimal decorative elements, no unnecessary gradients, no excessive rounded cards, no dashboard full of floating boxes.

Prioritize hierarchy over decoration.

## 73. Admin layout

Desktop-first. Left navigation. Main content area. Optional right contextual panel where appropriate.

Tables should be used when information is naturally tabular. Avoid converting every dataset into cards.

## 74. Mobile SDK design

Mobile screens should follow host application styling where possible. Use native-feeling components.

Feedback submission should require very little effort. Avoid long forms, complex categories, technical terminology, and product-management terminology.

Users should never need to understand what a “Request entity” is.

## 75. Terminology

Internal/admin terminology: Feedback, Request, Conversation, Vote, Roadmap, Update, User, App.

Externally, user-facing language may be softer: Feedback, Ideas, Requests, What’s coming, Messages, What’s new.

Do not expose technical system terminology unnecessarily.

## 76. MVP — required

The first production-capable version must support: multi-app architecture, user identification, feedback submission, screenshot attachment, feedback context capture, admin feedback list, feedback detail, admin inbox, conversation, admin reply, user in-app reply, create request, link feedback to request, request list, request detail, public/private requests, voting, request statuses, basic roadmap, user requests screen, user request detail, basic notifications, user detail, apps management, event logging, authentication, basic permissions.

## 77. Post-MVP

Do NOT prioritize these before the core loop works: advanced AI clustering, automatic merging, advanced sentiment analysis, complex analytics, NPS, CSAT, surveys, public community, comments between users, Jira integration, Linear integration, Slack integration, advanced CRM, complex changelog, advanced segmentation, automatic AI replies, custom workflows, complex permissions, Android SDK, Web SDK.

## 78. First implementation vertical slice

Do not attempt to build the entire platform at once.

First vertical slice: Mobile user → Submit Feedback → API → Database → Admin Feedback List → Feedback Detail.

This must work end-to-end with real persisted data.

## 79. Second vertical slice

Feedback → Conversation → Admin reply → User receives reply → User replies → Admin Inbox.

## 80. Third vertical slice

Feedback → Create or Link Request → Publish Request → User sees Request → User votes → Admin sees Vote.

## 81. Fourth vertical slice

Request → Planned → In Progress → Released → Publish Update → Notify interested users.

## 82. Fifth vertical slice

Add intelligence: classification, duplicate suggestions, Request matching, AI summaries, clusters, trends, Product Signals. Only implement this after sufficient real feedback exists.

## 83. Admin navigation V1

HOME: Home

COMMUNICATION: Inbox, Feedback

PRODUCT: Requests, Roadmap, Changelog

USERS: Users

SYSTEM: Apps, Settings

Do not add additional primary navigation without a clear requirement.

## 84. Mobile navigation

Feedback Hub does NOT need to become a main navigation system inside host apps. The host app decides where Feedback Hub is opened.

The SDK provides screens/modules such as Feedback Home, Submit Feedback, Requests, Request Detail, Roadmap, Messages.

The host app can expose these from Settings, Profile, Help, or another suitable location.

## 85. Source of truth

Product specifications are the source of truth. Do not invent business logic because it seems convenient during implementation.

If implementation reveals an ambiguity, document it. If a decision materially changes product behavior, update the specification. Do not silently introduce new concepts.

## 86. Engineering rule

Do not optimize prematurely. Prefer simple architecture, clear relationships, typed interfaces, predictable state, small reusable components, explicit business rules, and testable services over unnecessary abstractions.

## 87. UI engineering rule

Do not duplicate visual patterns. Create reusable components for recurring UI such as PageHeader, Metric, Table, StatusBadge, UserAvatar, FilterBar, EmptyState, FeedbackItem, RequestItem, ConversationThread, MessageComposer, ActivityFeed, AppSelector, ConfirmDialog.

Use a coherent design system.

## 88. Business logic rule

Business logic must not live only inside UI components. Vote uniqueness, Request publication, Feedback linking, status transitions, notification recipients, and conversation state must be enforced server-side.

## 89. Mock data

Mock data may be used during UI development. Mock data must be clearly separated from production data access. Do not design architecture around hardcoded examples. Every screen should eventually operate against real API responses.

## 90. Testing priorities

Critical flows requiring tests: Submit Feedback, Identify User, Link Feedback to Request, Unlink Feedback, Create Request, Publish Request, Vote, Unvote, Send admin reply, Send user reply, Change Request status, Publish Request update, Notify interested users, Authorization between Apps, Vote uniqueness.

## 91. Auditability

For important product actions, we should be able to answer who did this, what changed, and when. Event logging is part of the foundation rather than an analytics afterthought.

## 92. Product success

The product is successful if an admin can answer what users are asking for, how many users are asking, what exactly they are saying, which users can be contacted, whether the team can talk to them directly, which requests are gaining interest, what the team decided to build, what is currently being built, and who should be notified on release.

A user can answer whether the company received the feedback, whether they can reply, whether other people want the same thing, whether the user can vote, whether it is planned, whether it is being built, and whether it was released.

## 93. Primary product loop

USER SUBMITS FEEDBACK → ADMIN RECEIVES IT → ADMIN CAN TALK TO USER → FEEDBACK IS LINKED TO PRODUCT NEED → OTHER USERS CAN VOTE → TEAM CHANGES PRODUCT STATUS → FEATURE IS BUILT → FEATURE IS RELEASED → INTERESTED USERS ARE NOTIFIED → USER SEES THAT THEIR FEEDBACK MATTERED

Every major product decision should strengthen this loop.

## 94. Implementation order

1. Project foundation
2. Authentication
3. Workspace
4. Apps
5. Users
6. Feedback API
7. Feedback mobile UI
8. Admin Feedback
9. Conversations
10. Admin Inbox
11. Requests
12. Feedback ↔ Request relationships
13. Voting
14. Public Requests mobile UI
15. Roadmap
16. Request updates
17. Notifications
18. User Detail
19. Admin Home
20. Event-based analytics
21. AI layer

Do not start AI before the core product loop is stable.

## 95. Initial project structure

Recommended conceptual structure:

```
feedback-hub/
  apps/admin-web/
  apps/demo-app/
  packages/sdk-ios/
  packages/api-client/
  packages/ui/
  packages/shared/
  backend/
  docs/PRODUCT.md
  docs/DATA_MODEL.md
  docs/USER_FLOWS.md
  docs/ADMIN_SPEC.md
  docs/IN_APP_SPEC.md
  docs/DESIGN_SYSTEM.md
  docs/ARCHITECTURE.md
  docs/IMPLEMENTATION_PLAN.md
  README.md
  AGENTS.md
```

Exact structure may change based on selected technical stack, but separation of concerns should remain.

## 96. Cursor / agent instruction

Before implementing a feature:

1. Read the relevant specification.
2. Identify affected entities.
3. Identify existing reusable components.
4. Identify business rules.
5. Identify authorization implications.
6. Identify event logging requirements.
7. Implement the smallest complete vertical slice.
8. Test loading, empty, error, and success states.
9. Test the real data flow.
10. Do not invent additional product behavior.

When unsure about product behavior, stop and request clarification rather than making a significant product decision autonomously.

## 97. Do not do

Do not turn Feedback Hub into customer support software, Jira, or a social network.

Do not allow users to publicly comment on each other’s feedback in V1.

Do not automatically publish raw feedback.

Do not automatically merge feedback destructively.

Do not automatically send mass notifications without admin control.

Do not combine feedback count and votes into one misleading metric.

Do not delete original feedback when Requests are changed.

Do not put critical business logic only in frontend code.

Do not build AI before the underlying workflow works.

Do not overcomplicate V1 with integrations.

## 98. Product vision

Feedback Hub should become the place where product teams understand the relationship between what users say, who says it, how often the problem occurs, how many users support a solution, what the team decided, and what ultimately shipped.

It is not simply a suggestion box. It is a continuous product feedback loop connecting users directly with product development.

## 99. V1 definition of done

V1 is complete when a real-world scenario works without mock data:

A user opens one of our mobile apps. The user submits feedback. The feedback reaches the backend. The admin sees it in the web application. The admin can see who submitted it and relevant app/device context. The admin replies. The user receives the reply inside the mobile application. The user can answer. The admin can create a Product Request from that feedback. The admin can publish the Request. Other users can see it. Other users can vote. The admin sees those votes. Additional feedback can be linked to the same Request. The admin changes the Request to Planned, then In Progress, then Released. The admin publishes an update. Interested users receive a notification. The users can see that the Request has been released. The complete history remains available to the admin.

## 100. Final principle

Always preserve the chain: USER → SIGNAL → CONTEXT → CONVERSATION → PRODUCT NEED → DECISION → DELIVERY → COMMUNICATION

If a proposed feature does not improve this chain, question whether it belongs in the core product.
