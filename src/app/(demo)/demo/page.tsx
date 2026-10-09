import Link from "next/link";
import { connection } from "next/server";
import { WillowFeedback } from "@/components/demo/willow-feedback";
import { WILLOW_DEMO_USER } from "@/domain/willow-demo";
import { willowAppSecret } from "@/domain/secrets";
import { issueEmbedSession } from "@/server/embed";

export const instant = false;
export const maxDuration = 60;

export const metadata = {
  title: "Feedback · Willow",
  description: "Share feedback inside Willow.",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  await searchParams;
  const session = await issueEmbedSession({
    appSecret: willowAppSecret(),
    externalUserId: WILLOW_DEMO_USER.externalUserId,
    email: WILLOW_DEMO_USER.email,
    name: WILLOW_DEMO_USER.name,
    plan: WILLOW_DEMO_USER.plan,
    locale: WILLOW_DEMO_USER.locale,
    timezone: WILLOW_DEMO_USER.timezone,
    appVersion: WILLOW_DEMO_USER.appVersion,
    osVersion: WILLOW_DEMO_USER.osVersion,
    device: WILLOW_DEMO_USER.device,
  });

  return (
    <div className="min-h-full bg-[#e4e0d6]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-8 lg:flex-row lg:items-start lg:justify-center lg:gap-20 lg:py-14">
        <aside className="w-full max-w-sm lg:sticky lg:top-14 lg:pt-10">
          <p className="text-xs font-medium tracking-[0.16em] text-[#6d675c] uppercase">Host app</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1c241c]">Willow</h1>
          <p className="mt-3 text-sm leading-6 text-[#4c534b]">
            This phone is Willow. The icon is the host’s trigger. A tap opens the Feedback Hub window. Holding the
            walk card opens that same window. A tap on the card logs a walk. The app credential stays on the server.
          </p>
          <Link href="/admin/login" className="mt-5 inline-block text-sm font-medium text-[#1f3d32] underline-offset-4 hover:underline">
            Open admin
          </Link>
        </aside>
        <div className="w-full max-w-[420px] rounded-[2.6rem] bg-[#1c1c1c] p-3 shadow-[0_24px_60px_rgba(28,28,28,0.28)]">
          <div className="flex h-[760px] flex-col overflow-hidden rounded-[2.1rem] bg-[#f3f0e8]">
            <div className="flex justify-center pt-3">
              <div className="h-6 w-28 rounded-full bg-[#1c1c1c]" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <WillowFeedback name={WILLOW_DEMO_USER.name} plan={WILLOW_DEMO_USER.plan} />
            </div>
            <div className="flex justify-center pb-3">
              <div className="h-1.5 w-28 rounded-full bg-[#1c1c1c]/80" />
            </div>
          </div>
        </div>
      </div>
      <script src="/embed.js" data-session={session} />
    </div>
  );
}
