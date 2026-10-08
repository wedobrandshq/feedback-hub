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
