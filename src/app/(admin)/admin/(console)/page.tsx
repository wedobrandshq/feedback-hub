import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { HatchPanel, hatchBody, hatchRowTitle, hatchSticker, hatchStrong } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
import { PageHeader } from "@/components/admin/page-header";
import { feedbackDeltaSentence } from "@/domain/admin";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { getAdminHome } from "@/server/admin-home";

export const instant = false;

export const metadata = { title: "Home" };

function Signal({ label, value, name }: { label: string; value: number; name: string }) {
  return (
    <div>
      <p className="text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#0e0e1a] [font-family:var(--font-display)]" data-signal={name}>
        {value}
      </p>
    </div>
  );
}

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  const selected = await getSelectedApp(admin.workspaceId, admin.id);
  const home = await getAdminHome({ workspaceId: admin.workspaceId, appId: selected?.id ?? null, adminId: admin.id });
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
        kicker="Today"
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
            <Link href="/demo" className={hatchStrong}>
              Send test feedback
            </Link>
          }
        />
      ) : (
        <div className="space-y-8 px-4 py-6 md:px-8">
          <HatchPanel wash="lilac">
            <section className="px-5 py-5">
            <h2 className={hatchSticker}>Product signals</h2>
            <dl className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              <Signal label="Feedback" value={home.signals.feedback} name="feedback" />
              <Signal label="New requests" value={home.signals.newRequests} name="requests" />
              <Signal label="Conversations" value={home.signals.conversations} name="conversations" />
              <Signal label="Votes" value={home.signals.votes} name="votes" />
              <Signal label="Released" value={home.signals.released} name="released" />
            </dl>
            <p className={`mt-5 ${hatchBody}`} data-signal="feedback-delta">
              {feedbackDeltaSentence(home.signals.feedback, home.signals.feedbackPrior)}
            </p>
            </section>
          </HatchPanel>
          <HatchPanel wash="mint">
            <section className="px-5 py-5">
            <h2 className={hatchSticker}>Most voted</h2>
            <p className={`mt-4 ${hatchBody}`}>Votes in the last 30 days.</p>
            {home.trending.length === 0 ? (
              <p className="mt-3 text-sm text-[#5a5b70]">No requests received a vote in the last 30 days.</p>
            ) : (
              <ul className="mt-3">
                {home.trending.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[#0e0e1a] py-3">
                    <div>
                      <Link href={`/admin/requests/${request.id}`} className={hatchRowTitle}>
                        {request.title}
                      </Link>
                      {!selected ? <p className="text-xs text-[#5a5b70]">{request.appName}</p> : null}
                    </div>
                    <p className="text-sm text-[#5a5b70]">
                      {request.votesInWindow} {request.votesInWindow === 1 ? "vote" : "votes"} in 30 days
                      {" · "}
                      {request.feedbackCount} feedback
                    </p>
                  </li>
                ))}
              </ul>
            )}
            </section>
          </HatchPanel>
          <HatchPanel wash="sky">
            <section className="px-5 py-5">
            <h2 className={hatchSticker}>
              <WithMarker kind="attention">Needs attention</WithMarker>
            </h2>
            <p className={`mt-4 ${hatchBody}`}>
              <span data-signal="needs-reply">{home.attention.needsReplyCount}</span>
              {" need a reply · "}
              <span data-signal="open-conversations">{home.attention.openConversations}</span>
              {" open"}
              {home.attention.attentionTruncated ? " · showing the latest open conversations" : ""}
            </p>
            {home.attention.needsReplyCount === 0 ? (
              <p className="mt-3 text-sm">You’re all caught up. No conversations currently need a reply.</p>
            ) : (
              <ul className="mt-3">
                {home.attention.needsReply.map((row) => (
                  <li key={row.id} className="border-t border-[#0e0e1a] py-3">
                    <Link href={`/admin/inbox/${row.id}`} className={hatchRowTitle}>
                      {row.user}
                    </Link>
                    <p className="mt-1 text-sm text-[#5a5b70]">{row.preview}</p>
                  </li>
                ))}
              </ul>
            )}
            </section>
          </HatchPanel>
        </div>
      )}
    </>
  );
}
