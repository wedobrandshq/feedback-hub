"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { voteDemoRequest } from "@/app/(demo)/actions";
import type { DemoCatalog } from "@/server/demo-catalog";
import { publicStatusLabel, type RequestStatusName } from "@/domain/request";
import { formatDateTime } from "@/domain/feedback";
import { Button } from "@/components/ui/button";

export function DemoCatalogScreens({
  screen,
  catalog,
  requestId,
  onBack,
  onOpenRequest,
}: {
  screen: "requests" | "request" | "roadmap" | "updates" | "changelog";
  catalog: DemoCatalog;
  requestId: string | null;
  onBack: () => void;
  onOpenRequest: (id: string) => void;
}) {
  const request = catalog.requests.find((item) => item.id === requestId) ?? null;
  return (
    <div className="flex flex-1 flex-col">
      <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={onBack}>
        Back
      </button>
      {screen === "requests" ? (
        <RequestList catalog={catalog} onOpenRequest={onOpenRequest} />
      ) : null}
      {screen === "request" ? (
        request ? <RequestDetail request={request} /> : <p className="mt-6 text-sm text-[#8a2e24]">This request is not available.</p>
      ) : null}
      {screen === "roadmap" ? <Roadmap catalog={catalog} onOpenRequest={onOpenRequest} /> : null}
      {screen === "updates" ? <Updates catalog={catalog} onOpenRequest={onOpenRequest} /> : null}
      {screen === "changelog" ? <Changelog catalog={catalog} /> : null}
    </div>
  );
}

function statusText(status: string) {
  return publicStatusLabel(status as RequestStatusName);
}

function RequestList({
  catalog,
  onOpenRequest,
}: {
  catalog: DemoCatalog;
  onOpenRequest: (id: string) => void;
}) {
  return (
    <>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">Requests</h2>
      {catalog.requests.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-[#3d463d]">No public requests yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#e2dcd0]">
          {catalog.requests.map((request) => {
            const status = statusText(request.status);
            return (
              <li key={request.id}>
                <button type="button" className="w-full py-3 text-left" onClick={() => onOpenRequest(request.id)}>
                  <span className="block text-sm text-[#1c241c]">{request.title}</span>
                  <span className="mt-1 block text-xs text-[#6a7268]">
                    {status ? `${status} · ` : ""}
                    {request.voteCount} {request.voteCount === 1 ? "vote" : "votes"}
                    {request.voted ? " · You voted" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function RequestDetail({ request }: { request: DemoCatalog["requests"][number] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const status = statusText(request.status);
  return (
    <>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">{request.title}</h2>
      <p className="mt-2 text-sm text-[#6a7268]">
        {status ? `${status} · ` : ""}
        {request.voteCount} {request.voteCount === 1 ? "vote" : "votes"}
      </p>
      <p className="mt-4 text-sm leading-6 whitespace-pre-wrap text-[#1c241c]">{request.description}</p>
      <form
        className="mt-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const formData = new FormData();
          formData.set("requestId", request.id);
          if (request.voted) formData.set("intent", "remove");
          const result = await voteDemoRequest(formData);
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
      >
        {error ? <p className="mb-2 text-sm text-[#8a2e24]" role="alert">{error}</p> : null}
        <Button type="submit" disabled={pending} className="h-11 w-full bg-[#1f3d32] text-[#f4f1ea] hover:bg-[#1f3d32]/90">
          {pending ? "Saving…" : request.voted ? "Remove vote" : "Vote"}
        </Button>
      </form>
      {request.updates.length > 0 ? (
        <section className="mt-6">
          <h3 className="text-sm font-medium text-[#1c241c]">Updates</h3>
          <ul className="mt-2 space-y-3">
            {request.updates.map((update) => (
              <li key={update.id}>
                <p className="text-sm whitespace-pre-wrap text-[#1c241c]">{update.body}</p>
                {update.publishedAt ? (
                  <p className="mt-1 text-xs text-[#6a7268]">{formatDateTime(new Date(update.publishedAt))}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function Roadmap({
  catalog,
  onOpenRequest,
}: {
  catalog: DemoCatalog;
  onOpenRequest: (id: string) => void;
}) {
  const sections = [
    { status: "planned", label: "Planned" },
    { status: "in_progress", label: "In progress" },
    { status: "released", label: "Recently released" },
  ] as const;
  return (
    <>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">What’s coming</h2>
      {sections.map((section) => {
        const items = catalog.requests.filter((request) => request.status === section.status);
        return (
          <section key={section.status} className="mt-5">
            <h3 className="text-xs font-medium tracking-[0.14em] text-[#6a7268] uppercase">{section.label}</h3>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-[#3d463d]">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {items.map((request) => (
                  <li key={request.id}>
                    <button type="button" className="text-sm text-[#1c241c]" onClick={() => onOpenRequest(request.id)}>
                      {request.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}

function Updates({
  catalog,
  onOpenRequest,
}: {
  catalog: DemoCatalog;
  onOpenRequest: (id: string) => void;
}) {
  return (
    <>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">Updates</h2>
      {catalog.notifications.length === 0 ? (
        <p className="mt-4 text-sm text-[#3d463d]">No updates yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {catalog.notifications.map((item) => (
            <li key={item.id}>
              {item.requestId ? (
                <button type="button" className="text-left text-sm text-[#1c241c]" onClick={() => onOpenRequest(item.requestId as string)}>
                  {item.body}
                </button>
              ) : (
                <p className="text-sm text-[#1c241c]">{item.body}</p>
              )}
              <p className="mt-1 text-xs text-[#6a7268]">{formatDateTime(new Date(item.createdAt))}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Changelog({ catalog }: { catalog: DemoCatalog }) {
  return (
    <>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">What’s new</h2>
      {catalog.changelog.length === 0 ? (
        <p className="mt-4 text-sm text-[#3d463d]">Nothing released yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {catalog.changelog.map((entry) => (
            <li key={entry.id}>
              <p className="text-sm font-medium text-[#1c241c]">{entry.title}</p>
              <p className="mt-1 text-sm whitespace-pre-wrap text-[#3d463d]">{entry.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
