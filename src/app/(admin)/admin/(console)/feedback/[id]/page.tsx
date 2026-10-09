import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { ConversationThread } from "@/components/admin/conversation-thread";
import { FeedbackActions } from "@/components/admin/feedback-actions";
import { CreateRequestForm, LinkRequestForm, UnlinkRequestForm } from "@/components/admin/request-forms";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { SuggestionPanel } from "@/components/admin/suggestion-panel";
import { formatDateTime, userLabel } from "@/domain/feedback";
import { requireAdmin } from "@/server/auth/admin";
import { getAdminThreadForFeedback } from "@/server/conversations";
import { getFeedbackDetail } from "@/server/feedback-queries";
import { searchRequests } from "@/server/requests";
import { ensureFeedbackSuggestion } from "@/server/suggestions";

export const metadata = { title: "Feedback" };
export const instant = false;
export const maxDuration = 60;

function ContextRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-border py-2 text-sm first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FeedbackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requestQuery = first(query.request) ?? "";
  await ensureFeedbackSuggestion(id).catch(() => undefined);
  const [detail, thread] = await Promise.all([
    getFeedbackDetail({ workspaceId: admin.workspaceId, feedbackId: id }),
    getAdminThreadForFeedback({ workspaceId: admin.workspaceId, feedbackId: id }),
  ]);
  if (!detail) notFound();

  const { feedback, events } = detail;
  const matches = requestQuery
    ? await searchRequests({ workspaceId: admin.workspaceId, appId: feedback.appId, query: requestQuery })
    : [];

  return (
    <>
      <PageHeader
        title="Feedback"
        description={`${feedback.app.name} · ${formatDateTime(feedback.createdAt)}`}
        actions={
          <FeedbackActions
            key={`${feedback.status}-${thread?.status ?? "none"}`}
            feedbackId={feedback.id}
            status={feedback.status}
            conversation={thread ? { id: thread.id, status: thread.status } : null}
          />
        }
      />
      <div className="grid gap-10 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-6">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Original feedback</h2>
            <p className="mt-3 text-base leading-7 whitespace-pre-wrap">{feedback.body}</p>
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Conversation</h2>
            {thread ? (
              <div className="mt-3 space-y-4">
                <ConversationThread messages={thread.messages} />
                <p className="text-sm">
                  <Link href={`/admin/inbox/${thread.id}`} className="text-muted-foreground hover:text-foreground">
                    Open in Inbox
                  </Link>
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No conversation for this feedback.</p>
            )}
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Screenshot</h2>
            {feedback.attachments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No screenshot.</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {feedback.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/attachments/${attachment.id}`}
                      alt={attachment.fileName}
                      className="max-h-96 rounded-md border border-border"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">{attachment.fileName}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Activity</h2>
            <div className="mt-4">
              <ActivityFeed events={events} />
            </div>
          </section>
          <p className="text-sm">
            <Link href="/admin/feedback" className="text-muted-foreground hover:text-foreground">
              Back to feedback
            </Link>
          </p>
        </div>
        <aside className="space-y-8 lg:border-l lg:border-border lg:pl-6">
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Request</h2>
            {feedback.requestLink ? (
              <div className="mt-3">
                <Link href={`/admin/requests/${feedback.requestLink.request.id}`} className="text-sm font-medium">
                  {feedback.requestLink.request.title}
                </Link>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{feedback.requestLink.request.visibility}</p>
                <UnlinkRequestForm feedbackId={feedback.id} />
              </div>
            ) : (
              <div className="mt-3">
                {feedback.suggestion ? (
                  <SuggestionPanel
                    feedbackId={feedback.id}
                    suggestion={{
                      status: feedback.suggestion.status,
                      suggestedType: feedback.suggestion.suggestedType,
                      topics: feedback.suggestion.topics,
                      similarity: feedback.suggestion.similarity,
                      model: feedback.suggestion.model,
                      request: feedback.suggestion.request,
                    }}
                  />
                ) : null}
                <h3 className="text-sm font-medium">Create request</h3>
                <CreateRequestForm feedbackId={feedback.id} />
                <h3 className="mt-6 text-sm font-medium">Link to request</h3>
                <LinkRequestForm feedbackId={feedback.id} matches={matches} />
              </div>
            )}
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Status</h2>
            <div className="mt-3">
              <StatusBadge status={feedback.status} />
            </div>
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">User</h2>
            <dl className="mt-2">
              <ContextRow label="Name" value={userLabel(feedback.user)} />
              <ContextRow label="Email" value={feedback.user.email} />
              <ContextRow label="Plan" value={feedback.user.plan} />
              <ContextRow label="User ID" value={feedback.user.externalUserId} />
              <ContextRow label="App" value={feedback.app.name} />
            </dl>
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">At submission</h2>
            <dl className="mt-2">
              <ContextRow label="App version" value={feedback.appVersionAtSubmission} />
              <ContextRow label="OS" value={feedback.osVersionAtSubmission} />
              <ContextRow label="Device" value={feedback.deviceAtSubmission} />
              <ContextRow label="Locale" value={feedback.localeAtSubmission} />
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
