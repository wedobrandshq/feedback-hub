import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { FeedbackActions } from "@/components/admin/feedback-actions";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateTime, userLabel } from "@/domain/feedback";
import { requireAdmin } from "@/server/auth/admin";
import { getFeedbackDetail } from "@/server/feedback-queries";

export const metadata = { title: "Feedback" };

function ContextRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-border py-2 text-sm first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

export default async function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const detail = await getFeedbackDetail({ workspaceId: admin.workspaceId, feedbackId: id });
  if (!detail) notFound();

  const { feedback, events } = detail;

  return (
    <>
      <PageHeader
        title="Feedback"
        description={`${feedback.app.name} · ${formatDateTime(feedback.createdAt)}`}
        actions={<FeedbackActions key={feedback.status} feedbackId={feedback.id} status={feedback.status} />}
      />
      <div className="grid gap-10 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:px-6">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Original feedback</h2>
            <p className="mt-3 text-base leading-7 whitespace-pre-wrap">{feedback.body}</p>
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
