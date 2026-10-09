import { connection } from "next/server";
import { EmbedWindow } from "@/components/embed/embed-window";
import { DomainError } from "@/domain/errors";
import { readEmbedActor } from "@/server/embed";
import { listPublicRequestsForActor } from "@/server/requests";

export const instant = false;
export const maxDuration = 60;

export const metadata = {
  title: "Feedback",
  description: "Send feedback, vote on requests, and see the roadmap.",
};

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const session = Array.isArray(params.session) ? params.session[0] : params.session;
  if (!session) {
    return <EmbedNotice>This window needs a session from your server.</EmbedNotice>;
  }

  try {
    const actor = await readEmbedActor(session);
    const requests = await listPublicRequestsForActor({ appId: actor.appId, userId: actor.id });
    return (
      <div className="h-dvh">
        <EmbedWindow
          session={session}
          requests={requests.map((request) => ({
            id: request.id,
            title: request.title,
            description: request.description,
            status: request.status,
            voteCount: request.voteCount,
            voted: request.voted,
          }))}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return <EmbedNotice>{error.message}</EmbedNotice>;
    }
    throw error;
  }
}

function EmbedNotice({ children }: { children: string }) {
  return (
    <main data-fh-panel className="flex min-h-dvh items-center bg-[#f3f0e8] px-6 text-[#1c241c]">
      <p className="text-sm leading-6">{children}</p>
    </main>
  );
}
