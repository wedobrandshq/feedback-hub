"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitEmbedFeedback, voteEmbedRequest, type EmbedActionResult } from "@/app/embed/actions";
import { DEMO_KIND_OPTIONS } from "@/domain/feedback";
import type { SubmitFeedbackType } from "@/domain/config";
import { publicStatusLabel, type RequestStatusName } from "@/domain/request";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type RequestRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  voteCount: number;
  voted: boolean;
};

const TABS = [
  { id: "feedback", label: "Feedback" },
  { id: "requests", label: "Requests" },
  { id: "roadmap", label: "Roadmap" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function EmbedWindow({ session, requests }: { session: string; requests: RequestRow[] }) {
  const [tab, setTab] = useState<Tab>("feedback");
  const [requestId, setRequestId] = useState<string | null>(null);
  const open = requests.find((request) => request.id === requestId) ?? null;

  return (
    <main data-fh-panel className="flex h-full min-h-full flex-col bg-[#f3f0e8] text-[#1c241c]">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-2 pb-4">
        {tab === "feedback" ? <FeedbackForm session={session} /> : null}
        {tab === "requests" ? (
          open ? (
            <RequestDetail session={session} request={open} onBack={() => setRequestId(null)} />
          ) : (
            <RequestList requests={requests} onOpen={setRequestId} />
          )
        ) : null}
        {tab === "roadmap" ? <Roadmap requests={requests} onOpen={(id) => { setRequestId(id); setTab("requests"); }} /> : null}
      </div>
      <nav aria-label="Feedback Hub" className="grid grid-cols-3 gap-2 border-t border-[#e2dcd0] px-3 py-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? "page" : undefined}
            className={`h-10 rounded-full text-sm ${tab === item.id ? "bg-[#1f3d32] text-[#f4f1ea]" : "text-[#3d463d]"}`}
            onClick={() => {
              setTab(item.id);
              if (item.id !== "requests") setRequestId(null);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}

function FeedbackForm({ session }: { session: string }) {
  const [kind, setKind] = useState<SubmitFeedbackType | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Thanks for the feedback.</h1>
        <p className="mt-3 text-sm leading-6 text-[#3d463d]">The team can read it in Feedback Hub.</p>
      </div>
    );
  }

  return (
    <form
      className="flex min-h-full flex-col"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!kind) {
          setError("Choose what kind of feedback this is.");
          return;
        }
        setPending(true);
        setError(null);
        const formData = new FormData(event.currentTarget);
        formData.set("type", kind);
        formData.set("session", session);
        const result = await submitEmbedFeedback({ ok: true }, formData);
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setDone(true);
      }}
    >
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">What kind of feedback?</h1>
      <fieldset className="mt-5 space-y-2">
        <legend className="sr-only">What kind of feedback?</legend>
        {DEMO_KIND_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-12 cursor-pointer items-center rounded-xl border px-4 text-sm ${
              kind === option.value ? "border-[#1f3d32] bg-white" : "border-[#e2dcd0] bg-white/70"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={option.value}
              checked={kind === option.value}
              onChange={() => setKind(option.value)}
              className="mr-3 accent-[#1f3d32]"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <label htmlFor="feedback-body" className="mt-6 text-sm font-medium">
        Tell us more
      </label>
      <Textarea
        id="feedback-body"
        name="body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="mt-2 min-h-32 bg-white"
        placeholder="What should we know?"
      />
      <div className="mt-4">
        <label htmlFor="screenshot" className="text-sm font-medium text-[#1f3d32]">
          Add screenshot
        </label>
        <input id="screenshot" name="screenshot" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="mt-2 block text-sm" />
      </div>
      {error ? (
        <p className="mt-3 text-sm text-[#8a2e24]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-6 h-12 w-full bg-[#1f3d32] text-[#f4f1ea] hover:bg-[#1f3d32]/90">
        {pending ? "Sending…" : "Submit"}
      </Button>
    </form>
  );
}

function statusText(status: string) {
  return publicStatusLabel(status as RequestStatusName);
}

function RequestList({ requests, onOpen }: { requests: RequestRow[]; onOpen: (id: string) => void }) {
  return (
    <>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Requests</h1>
      {requests.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-[#3d463d]">No public requests yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#e2dcd0]">
          {requests.map((request) => {
            const status = statusText(request.status);
            return (
              <li key={request.id}>
                <button type="button" className="w-full py-3 text-left" onClick={() => onOpen(request.id)}>
                  <span className="block text-sm">{request.title}</span>
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

function RequestDetail({
  session,
  request,
  onBack,
}: {
  session: string;
  request: RequestRow;
  onBack: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const status = statusText(request.status);
  return (
    <>
      <button type="button" className="text-sm text-[#1f3d32]" onClick={onBack}>
        Back
      </button>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{request.title}</h1>
      <p className="mt-2 text-sm text-[#6a7268]">
        {status ? `${status} · ` : ""}
        {request.voteCount} {request.voteCount === 1 ? "vote" : "votes"}
      </p>
      <p className="mt-4 text-sm leading-6 whitespace-pre-wrap">{request.description}</p>
      <form
        className="mt-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const formData = new FormData();
          formData.set("session", session);
          formData.set("requestId", request.id);
          if (request.voted) formData.set("intent", "remove");
          const result: EmbedActionResult = await voteEmbedRequest({ ok: true }, formData);
          setPending(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        }}
      >
        {error ? (
          <p className="mb-2 text-sm text-[#8a2e24]" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="h-11 w-full bg-[#1f3d32] text-[#f4f1ea] hover:bg-[#1f3d32]/90">
          {pending ? "Saving…" : request.voted ? "Remove vote" : "Vote"}
        </Button>
      </form>
    </>
  );
}

function Roadmap({ requests, onOpen }: { requests: RequestRow[]; onOpen: (id: string) => void }) {
  const sections = [
    { status: "planned", label: "Planned" },
    { status: "in_progress", label: "In progress" },
    { status: "released", label: "Released" },
  ] as const;
  return (
    <>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Roadmap</h1>
      {sections.map((section) => {
        const items = requests.filter((request) => request.status === section.status);
        return (
          <section key={section.status} className="mt-5">
            <h2 className="text-xs font-medium tracking-[0.14em] text-[#6a7268] uppercase">{section.label}</h2>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-[#3d463d]">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {items.map((request) => (
                  <li key={request.id}>
                    <button type="button" className="text-sm" onClick={() => onOpen(request.id)}>
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
