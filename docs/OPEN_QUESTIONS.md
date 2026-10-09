# Open questions

These are ambiguities in the product spec for slice 1. The implementation picks the smallest option that does not change the product rules in `docs/PRODUCT.md`.

## Close event name

Section 54 lists `feedback.reviewed` and does not name an event for closing feedback. Mark reviewed writes `feedback.reviewed` and sets status `reviewed`. Close writes `feedback.closed` and sets status `closed`, so the activity log can tell the two actions apart. Status values stay the ones in section 9.

## Close from new

Mark reviewed and Close are separate actions. The spec does not say Close must follow reviewed. Close is allowed from `new` or `reviewed`. It is refused from `closed` and from `linked`. Mark reviewed is allowed only from `new`. This slice has no reopen action and never sets `linked`.

## Feedback title

The model includes `title`. The submit flow is one text field, “Tell us more.” The exact text is stored in `body` and `title` stays null. The list shows a shortened display of `body`. That display is not stored.

## Type `problem`

Section 9 lists idea, problem, improvement, bug, and other. The four submit choices map to idea, bug, improvement, and other. `problem` remains a valid stored type and is not offered in the demo. The submit service rejects it.

## Seeded platforms

Section 7 lists platforms and does not say which one Willow or Earn It uses. Both seeded apps are iOS.

## Limits

The spec does not set a message length or screenshot rules. Blank or whitespace-only messages are rejected. Any other message is stored exactly, with no trimming. Body length is capped at 10,000 characters. One screenshot up to 5 MB is accepted after its bytes match PNG, JPEG, WEBP, or GIF. The schema can hold more than one attachment; the form offers one.

## Source

`source` has no enumerated values. Submissions are stored as `in_app`. The client cannot set it.

## Demo context

The demo host attaches app version `2.4.1`, OS `iOS 18.6`, device `iPhone 16`, and locale `en-US` on the server for the seeded Willow user. The browser cannot supply or change that context. A real SDK would capture the live device.

## Plan is current, not snapshotted

Section 9 snapshots app version, OS, device, and locale. Plan stays on the user record and is shown from that record. A later identify can change it. The feedback row does not copy plan.

## Empty-state link

Section 70’s example includes an Integration guide. Apps and SDK setup are outside this slice, so the empty feedback state links to the Willow demo instead.

## List order, dates, and cap

Newest feedback is first. The date filter is an inclusive UTC calendar day. Admin timestamps are shown in UTC. The list shows at most 200 rows.

## App selector and detail

The selector filters the list. A feedback URL still opens inside the workspace when the selector is narrower. The detail shows which app the message belongs to.

## Identify updates

A later identify for the same app and external user id updates only the fields it sends. Omitted fields stay as they were. `last_seen_at` always moves forward.

## One conversation per feedback

Section 66 says a feedback item has zero or one conversation. This slice creates that conversation when the feedback is submitted, with the first in-app message body equal to the feedback body. Feedback submitted before this rule is not backfilled.

## Conversation open and closed

Section 31 says an admin can close and reopen a conversation. It does not name a status. The conversation is `open` or `closed`. Closing feedback and closing its conversation are separate actions.

## Needs reply

The inbox filter Needs reply is not defined as a formula. A conversation needs a reply when it is open and the latest message is from the user, including the first message created with the feedback. An admin reply clears it until the user replies again. A closed conversation does not need a reply.

## Unread and read_at

Section 12 has one `read_at` on a message. That field cannot record the user and the admin separately. `read_at` is when the other party opened a screen that shows the message body. The user’s unread badge counts admin messages with `read_at` null. The admin Unread filter is conversations with a user message whose `read_at` is null. Sending a message does not set `read_at`.

## Reopen event name

Section 54 names `conversation.closed` and does not name an event for reopen. Reopen writes `conversation.reopened` on the conversation so the activity log can tell it apart from close. That name is not a spec term.

## Reply length and channel

The spec does not set a message length. A reply uses the same rule as feedback: blank text is rejected, anything else is stored exactly, and the cap is 10,000 characters. This slice writes `in_app` only. `email` stays on the channel enum and is not sent. `system` stays on the sender enum and is not used.

## Closed conversations do not take new messages

The spec does not say whether a closed conversation can receive a reply. A reply is refused until an admin reopens it. Close writes `conversation.closed`.

## Inbox order

Newest activity is first. Activity is the conversation’s updated time, which moves when a message is sent or the conversation is closed or reopened. The list shows at most 200 conversations. The Willow Messages list shows at most 50. The default inbox filter is All. Needs reply uses the empty copy from section 70 when nothing in that filter needs a reply.

## Where a reply is sent

Reply on feedback detail and the composer on the conversation both call the same server rule. Link to Request and Create Request are not built. The conversation sidebar says there is no linked request. A separate user profile page is a later slice, so the user is shown on the conversation itself. Internal classification is not shown.

## Requests

A feedback item links to one request. Linking a second request is refused until the first link is removed. The original feedback text is not edited. Creating a request always stores visibility `private`, even though the form names visibility. Publish is the only way to make it public. There is no unpublish action. The initial status defaults to Review. Title and description are stored exactly, rejected when blank, and capped at 10,000 characters like other text.

The admin list sorts by Updated, newest first, unless Feedback, Votes, or Created is chosen. Users on the list are unique authors of linked feedback. Votes on the list are the vote count. Unique voters are shown separately on the request. With the unique vote constraint those two vote numbers match, and they stay separate fields.

A published request is visible in that app even while its status is Review or Under consideration. The demo does not show those two words. Roadmap in the demo is Planned, In progress, and Recently released. Voting is allowed on any public request in the same app. A private request, or a request from another app, is not found. Unlinking feedback whose status is `linked` sets that status back to `reviewed`. Closed feedback stays closed. One changelog entry is allowed per released request.

`released_at` is set when the status becomes Released and is left in place if the status changes again. Status changes always write `request.status_changed` and do not notify anyone by themselves. Notify is offered on the status form and only sends when the new status is Planned, In progress, Released, or Not planned. Recipients are the linked feedback authors, the voters, and the conversation participants, deduplicated. The channel is in-app. The notice text is the request title plus “is now” and the status label. Opening Updates marks those notices read.

## Host entry

The spec says the host app decides where Feedback Hub opens and does not name a gesture. This demo marks one region in code with `FeedbackHoldRegion`. A pointer that stays inside that region for 500 milliseconds opens the existing submit window over the host. Releasing sooner runs the host action. Leaving the region before 500 milliseconds does neither. The rest of the screen has no hold region. The window does not ask for email, device, or app version.

## What the user is shown

The Willow Messages entry lists that user’s conversations in Willow. The unread badge is for replies from the team. Opening a thread marks those replies read. The demo still identifies Maya Chen on the server. A posted user id or app secret is ignored.
