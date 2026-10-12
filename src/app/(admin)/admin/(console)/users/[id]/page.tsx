import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { PreviewList } from "@/components/admin/show-more";
import { hatchSticker } from "@/components/admin/hatch";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge, TypeBadge } from "@/components/admin/status-badge";
import { feedbackPreview, formatDateTime, userLabel } from "@/domain/feedback";
import { requireAdmin } from "@/server/auth/admin";
import { getAdminUser } from "@/server/admin-users";

export const instant = false;

export const metadata = { title: "User" };

function ContextRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-t border-[#0e0e1a] py-2 text-sm first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value || "—"}</dd>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const detail = await getAdminUser({ workspaceId: admin.workspaceId, userId: id, adminId: admin.id });
  if (!detail) notFound();
  const { user, events } = detail;

  return (
    <>
      <PageHeader
        kicker="User"
        title={userLabel(user)}
        description={`${user.app.name}${user.plan ? ` · ${user.plan}` : ""}`}
      />
      <div className="grid gap-10 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="space-y-10">
          <section>
            <h2 className={hatchSticker}>Feedback</h2>
            {user.feedback.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No feedback yet.</p>
            ) : (
              <PreviewList>
                {user.feedback.map((item) => (
                  <li key={item.id} className="py-3">
                    <Link href={`/admin/feedback/${item.id}`} className="text-sm font-medium">
                      {feedbackPreview(item.body)}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <TypeBadge type={item.type} />
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </PreviewList>
            )}
          </section>
          <section>
            <h2 className={hatchSticker}>Conversations</h2>
            {user.conversations.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              <PreviewList>
                {user.conversations.map((item) => (
                  <li key={item.id} className="py-3">
                    <Link href={`/admin/inbox/${item.id}`} className="text-sm font-medium capitalize">
                      {item.status}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{feedbackPreview(item.feedback.body)}</p>
                  </li>
                ))}
              </PreviewList>
            )}
          </section>
          <section>
            <h2 className={hatchSticker}>Votes</h2>
            {user.votes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No votes yet.</p>
            ) : (
              <PreviewList>
                {user.votes.map((vote) => (
                  <li key={vote.id} className="py-3">
                    <Link href={`/admin/requests/${vote.request.id}`} className="text-sm font-medium">
                      {vote.request.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(vote.createdAt)}</p>
                  </li>
                ))}
              </PreviewList>
            )}
          </section>
          <section>
            <h2 className={hatchSticker}>Activity</h2>
            <div className="mt-4">
              <ActivityFeed events={events} />
            </div>
          </section>
        </div>
        <aside>
          <h2 className={hatchSticker}>Context</h2>
          <dl className="mt-3">
            <ContextRow label="Email" value={user.email} />
            <ContextRow label="User ID" value={user.externalUserId} />
            <ContextRow label="Device" value={user.device} />
            <ContextRow label="OS" value={user.osVersion} />
            <ContextRow label="App version" value={user.appVersion} />
            <ContextRow label="Locale" value={user.locale} />
            <ContextRow label="Created" value={formatDateTime(user.createdAt)} />
            <ContextRow label="Last seen" value={formatDateTime(user.lastSeenAt)} />
          </dl>
          <p className="mt-6 text-sm">
            <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
              Back to users
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
