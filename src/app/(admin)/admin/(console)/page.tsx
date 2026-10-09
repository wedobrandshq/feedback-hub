import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { feedbackDeltaSentence } from "@/domain/admin";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { getAdminHome } from "@/server/admin-home";

export const instant = false;

export const metadata = { title: "Home" };

function Signal({ label, value, name }: { label: string; value: number; name: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight" data-signal={name}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  const selected = await getSelectedApp(admin.workspaceId);
  const home = await getAdminHome({ workspaceId: admin.workspaceId, appId: selected?.id ?? null });
  const quiet =
    home.signals.feedback === 0 &&
    home.signals.newRequests === 0 &&
    home.signals.conversations === 0 &&
    home.signals.votes === 0 &&
    home.signals.released === 0 &&
    home.trending.length === 0 &&
    home.attention.openConversations === 0 &&
    home.attention.needsReplyCount === 0;

  return (
    <>
      <PageHeader
        title="Home"
        description={
          selected
            ? `What ${selected.name} users are telling us right now. Counts are the last 30 days.`
            : "What users are telling us right now, across every app. Counts are the last 30 days."
        }
      />
      {quiet ? (
        <EmptyState
          title="No feedback yet"
          description="No feedback yet. Connect your first app or send test feedback."
          action={
            <Link href="/demo" className={buttonVariants()}>
              Send test feedback
            </Link>
          }
        />
      ) : (
        <div className="space-y-10 px-4 py-6 md:px-6">
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Product signals</h2>
            <dl className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              <Signal label="Feedback" value={home.signals.feedback} name="feedback" />
              <Signal label="New requests" value={home.signals.newRequests} name="requests" />
              <Signal label="Conversations" value={home.signals.conversations} name="conversations" />
              <Signal label="Votes" value={home.signals.votes} name="votes" />
              <Signal label="Released" value={home.signals.released} name="released" />
            </dl>
            <p className="mt-4 text-sm text-muted-foreground" data-signal="feedback-delta">
              {feedbackDeltaSentence(home.signals.feedback, home.signals.feedbackPrior)}
            </p>
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Trending requests</h2>
            {home.trending.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No requests received a vote in the last 30 days.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {home.trending.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                    <div>
                      <Link href={`/admin/requests/${request.id}`} className="text-sm font-medium">
                        {request.title}
                      </Link>
                      {!selected ? <p className="text-xs text-muted-foreground">{request.appName}</p> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.votesInWindow} {request.votesInWindow === 1 ? "vote" : "votes"} in 30 days
                      {" · "}
                      {request.feedbackCount} feedback
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Needs attention</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <span data-signal="needs-reply">{home.attention.needsReplyCount}</span>
              {" need a reply · "}
              <span data-signal="open-conversations">{home.attention.openConversations}</span>
              {" open"}
              {home.attention.attentionTruncated ? " · showing the latest open conversations" : ""}
            </p>
            {home.attention.needsReplyCount === 0 ? (
              <p className="mt-3 text-sm">You’re all caught up. No conversations currently need a reply.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {home.attention.needsReply.map((row) => (
                  <li key={row.id} className="py-3">
                    <Link href={`/admin/inbox/${row.id}`} className="text-sm font-medium">
                      {row.user}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{row.preview}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
