import Link from "next/link";
import { notFound } from "next/navigation";
import { ConversationActions } from "@/components/admin/conversation-actions";
import { ConversationThread } from "@/components/admin/conversation-thread";
import { MessageComposer } from "@/components/admin/message-composer";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TYPE_LABELS, formatDateTime, userLabel } from "@/domain/feedback";
import { requireAdmin } from "@/server/auth/admin";
import { getAdminConversation } from "@/server/conversations";

export const metadata = { title: "Conversation" };

function ContextRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-t border-border py-2 text-sm first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const conversation = await getAdminConversation({
    workspaceId: admin.workspaceId,
    conversationId: id,
  });
  if (!conversation) notFound();

  return (
    <>
      <PageHeader
        title={userLabel(conversation.user)}
        description={`${conversation.app.name} · ${formatDateTime(conversation.updatedAt)}`}
        actions={
          <ConversationActions
            key={conversation.status}
            conversationId={conversation.id}
            status={conversation.status}
          />
        }
      />
      <div className="grid gap-10 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-6">
        <div className="min-w-0 space-y-8">
          <section aria-label="Messages">
            <ConversationThread messages={conversation.messages} />
          </section>
          <section>
            {conversation.status === "open" ? (
              <MessageComposer conversationId={conversation.id} />
            ) : (
              <p className="text-sm text-muted-foreground">This conversation is closed. Reopen it to reply.</p>
            )}
          </section>
          <p className="text-sm">
            <Link href="/admin/inbox" className="text-muted-foreground hover:text-foreground">
              Back to inbox
            </Link>
          </p>
        </div>
        <aside className="space-y-8 lg:border-l lg:border-border lg:pl-6">
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">User</h2>
            <dl className="mt-2">
              <ContextRow label="Name" value={userLabel(conversation.user)} />
              <ContextRow label="Email" value={conversation.user.email} />
              <ContextRow label="Plan" value={conversation.user.plan} />
              <ContextRow label="User ID" value={conversation.user.externalUserId} />
              <ContextRow label="App" value={conversation.app.name} />
            </dl>
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Feedback</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm">{TYPE_LABELS[conversation.feedback.type]}</span>
              <StatusBadge status={conversation.feedback.status} />
            </div>
            <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">{conversation.feedback.body}</p>
            <dl className="mt-3">
              <ContextRow label="App version" value={conversation.feedback.appVersionAtSubmission} />
              <ContextRow label="OS" value={conversation.feedback.osVersionAtSubmission} />
              <ContextRow label="Device" value={conversation.feedback.deviceAtSubmission} />
              <ContextRow label="Locale" value={conversation.feedback.localeAtSubmission} />
            </dl>
            <p className="mt-3 text-sm">
              <Link
                href={`/admin/feedback/${conversation.feedback.id}`}
                className="text-muted-foreground hover:text-foreground"
              >
                View original feedback
              </Link>
            </p>
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Request</h2>
            <p className="mt-3 text-sm text-muted-foreground">No linked request.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
