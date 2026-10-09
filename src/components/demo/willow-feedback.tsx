"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markDemoNotificationsRead, markDemoThreadRead, replyDemoMessage, submitDemoFeedback } from "@/app/(demo)/actions";
import { DemoCatalogScreens } from "@/components/demo/demo-catalog-screens";
import type { DemoCatalog } from "@/server/demo-catalog";
import type { DemoMailbox } from "@/domain/conversation";
import { DEMO_KIND_OPTIONS, formatDateTime } from "@/domain/feedback";
import type { SubmitFeedbackType } from "@/domain/config";
import { FeedbackHoldRegion } from "@/host/feedback-hold-region";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type HostScreen = "host" | "messages" | "thread" | "requests" | "request" | "roadmap" | "updates" | "changelog";
type FeedbackStep = "kind" | "message" | "done";

export function WillowFeedback({
  name,
  plan,
  mailbox,
  catalog,
}: {
  name: string;
  plan: string;
  mailbox: DemoMailbox;
  catalog: DemoCatalog;
}) {
  const [hostScreen, setHostScreen] = useState<HostScreen>("host");
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep | null>(null);
  const [walks, setWalks] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [kind, setKind] = useState<SubmitFeedbackType | null>(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replyPending, setReplyPending] = useState(false);
  const router = useRouter();
  const thread = mailbox.conversations.find((conversation) => conversation.id === threadId) ?? null;

  function replaceScreenshot(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = next ? URL.createObjectURL(next) : null;
    previewRef.current = url;
    setFile(next);
    setPreview(url);
  }

  function closeFeedback() {
    setFeedbackStep(null);
    setKind(null);
    setBody("");
    replaceScreenshot(null);
    setError(null);
  }

  function openFeedback() {
    setError(null);
    setKind(null);
    setBody("");
    replaceScreenshot(null);
    setFeedbackStep("kind");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kind) {
      setError("Choose what kind of feedback this is.");
      setFeedbackStep("kind");
      return;
    }
    if (body.trim().length === 0) {
      setError("Tell us a bit more before sending.");
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("type", kind);
    formData.set("body", body);
    if (file) formData.set("screenshot", file);
    const result = await submitDemoFeedback(formData);
    setPending(false);
    if (result.ok) {
      setFeedbackStep("done");
      router.refresh();
      return;
    }
    setError(result.error);
  }

  return (
    <div className="relative flex h-full min-h-full flex-col px-5 pt-4 pb-6">
      {hostScreen === "host" ? (
        <div className="flex flex-1 flex-col">
          <p className="text-xs text-[#6a7268]">{name} · {plan}</p>
          <h2 className="mt-6 text-[2rem] leading-none font-semibold tracking-tight text-[#1c241c]">Willow</h2>
          <p className="mt-2 text-sm text-[#3d463d]">A short walk still counts.</p>
          <FeedbackHoldRegion
            className="mt-6 rounded-2xl border-2 border-dashed border-[#1f3d32] bg-white px-4 py-5 text-left"
            label="Today's walk. Tap to log a walk. Hold to share feedback."
            onOpenFeedback={openFeedback}
            onTap={() => setWalks((count) => count + 1)}
          >
            <p className="text-xs font-medium tracking-[0.14em] text-[#1f3d32] uppercase">Marked region</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-[#1c241c]">Today&apos;s walk</p>
            <p className="mt-1 text-sm text-[#3d463d]" data-walk-count={walks}>
              {walks === 1 ? "1 walk logged" : `${walks} walks logged`}
            </p>
            <p className="mt-3 text-sm text-[#6a7268]">Tap to log it. Hold to share feedback.</p>
          </FeedbackHoldRegion>
          {catalog.requests.length > 0 ? (
            <section className="mt-5">
              <h3 className="text-xs font-medium tracking-[0.14em] text-[#6a7268] uppercase">Popular requests</h3>
              <ul className="mt-2 space-y-1">
                {[...catalog.requests]
                  .sort((left, right) => right.voteCount - left.voteCount)
                  .slice(0, 3)
                  .map((request) => (
                    <li key={request.id}>
                      <button
                        type="button"
                        className="text-sm text-[#1c241c]"
                        onClick={() => {
                          setRequestId(request.id);
                          setHostScreen("request");
                        }}
                      >
                        {request.title} · {request.voteCount}
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
          <div className="mt-4 rounded-2xl border border-[#e2dcd0] bg-white/70 px-4 py-5" data-host-surface="">
            <p className="text-sm font-medium text-[#1c241c]">This week</p>
            <p className="mt-1 text-sm text-[#3d463d]">4,280 steps. Holding here stays in Willow.</p>
          </div>
          <div className="mt-auto space-y-2 pt-8">
            <Button type="button" variant="outline" className="h-11 w-full bg-white" onClick={() => setHostScreen("requests")}>
              View all requests
            </Button>
            <Button type="button" variant="outline" className="h-11 w-full bg-white" onClick={() => setHostScreen("roadmap")}>
              What’s coming
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-between bg-white"
              onClick={() => {
                setHostScreen("updates");
                void markDemoNotificationsRead().then(() => router.refresh());
              }}
            >
              <span>Updates</span>
              {catalog.unreadCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#1f3d32] px-1.5 text-xs text-[#f4f1ea]">
                  {catalog.unreadCount}
                </span>
              ) : null}
            </Button>
            <Button type="button" variant="outline" className="h-11 w-full bg-white" onClick={() => setHostScreen("changelog")}>
              What’s new
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full justify-between bg-white"
              onClick={() => {
                setError(null);
                setHostScreen("messages");
                router.refresh();
              }}
            >
              <span>Messages</span>
              {mailbox.unreadCount > 0 ? (
                <span
                  className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#1f3d32] px-1.5 text-xs text-[#f4f1ea]"
                  aria-label={`${mailbox.unreadCount} unread ${mailbox.unreadCount === 1 ? "reply" : "replies"}`}
                >
                  {mailbox.unreadCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      ) : null}

      {hostScreen === "requests" || hostScreen === "request" || hostScreen === "roadmap" || hostScreen === "updates" || hostScreen === "changelog" ? (
        <DemoCatalogScreens
          screen={hostScreen}
          catalog={catalog}
          requestId={requestId}
          onBack={() => setHostScreen(hostScreen === "request" ? "requests" : "host")}
          onOpenRequest={(id) => {
            setRequestId(id);
            setHostScreen("request");
          }}
        />
      ) : null}

      {feedbackStep === "kind" ? (
        <div className="absolute inset-0 z-10 flex flex-col bg-[#f3f0e8] px-5 pt-4 pb-6">
          <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={closeFeedback}>
            Back
          </button>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">What kind of feedback?</h2>
          <fieldset className="mt-6 space-y-2">
            <legend className="sr-only">What kind of feedback?</legend>
            {DEMO_KIND_OPTIONS.map((option) => {
              const selected = kind === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex min-h-12 cursor-pointer items-center rounded-xl border px-4 text-sm ${
                    selected ? "border-[#1f3d32] bg-white" : "border-[#e2dcd0] bg-white/70"
                  }`}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={option.value}
                    checked={selected}
                    onChange={() => setKind(option.value)}
                    className="mr-3 accent-[#1f3d32]"
                  />
                  {option.label}
                </label>
              );
            })}
          </fieldset>
          <div className="mt-auto pt-8">
            <Button
              type="button"
              disabled={!kind}
              className="h-12 w-full bg-[#1f3d32] text-[#f4f1ea] hover:bg-[#1f3d32]/90"
              onClick={() => setFeedbackStep("message")}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {feedbackStep === "message" ? (
        <form className="absolute inset-0 z-10 flex flex-col bg-[#f3f0e8] px-5 pt-4 pb-6" onSubmit={onSubmit}>
          <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={() => setFeedbackStep("kind")}>
            Back
          </button>
          <label htmlFor="feedback-body" className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">
            Tell us more
          </label>
          <Textarea
            id="feedback-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="mt-4 min-h-40 bg-white"
            placeholder="What should we know?"
          />
          <div className="mt-4">
            <input
              id="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                replaceScreenshot(event.target.files?.[0] ?? null);
                setError(null);
              }}
            />
            {preview ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected screenshot" className="max-h-40 rounded-lg border border-[#e2dcd0]" />
                <button type="button" className="text-sm text-[#1f3d32]" onClick={() => replaceScreenshot(null)}>
                  Remove screenshot
                </button>
              </div>
            ) : (
              <label htmlFor="screenshot" className="inline-flex h-10 cursor-pointer items-center text-sm font-medium text-[#1f3d32]">
                Add screenshot
              </label>
            )}
          </div>
          {error ? (
            <p className="mt-3 text-sm text-[#8a2e24]" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-auto pt-8">
            <Button
              type="submit"
              disabled={pending}
              className="h-12 w-full bg-[#1f3d32] text-[#f4f1ea] hover:bg-[#1f3d32]/90"
            >
              {pending ? "Sending…" : "Submit"}
            </Button>
          </div>
        </form>
      ) : null}

      {feedbackStep === "done" ? (
        <div className="absolute inset-0 z-10 flex flex-col bg-[#f3f0e8] px-5 pt-4 pb-6">
          <h2 className="mt-16 text-2xl font-semibold tracking-tight text-[#1c241c]">
            Thanks for helping us improve Willow.
          </h2>
          <p className="mt-3 text-base leading-7 text-[#3d463d]">If the team responds, you’ll get an update.</p>
          <div className="mt-auto space-y-3 pt-10">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full"
              onClick={() => {
                setFeedbackStep(null);
                setHostScreen("messages");
                setError(null);
                router.refresh();
              }}
            >
              Messages
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full"
              onClick={() => {
                setKind(null);
                setBody("");
                replaceScreenshot(null);
                setError(null);
                setFeedbackStep("kind");
              }}
            >
              Send more feedback
            </Button>
          </div>
        </div>
      ) : null}

      {hostScreen === "messages" ? (
        <div className="flex flex-1 flex-col">
          <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={() => setHostScreen("host")}>
            Back
          </button>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">Messages</h2>
          {mailbox.conversations.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-[#3d463d]">
              No messages yet. Share feedback and the team can reply here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-[#e2dcd0]">
              {mailbox.conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 py-3 text-left"
                    onClick={() => {
                      setThreadId(conversation.id);
                      setReply("");
                      setReplyError(null);
                      setHostScreen("thread");
                      void markDemoThreadRead(conversation.id).then(() => router.refresh());
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-[#1c241c]">{conversation.preview}</span>
                      <span className="mt-1 block text-xs text-[#6a7268]">{conversation.updatedLabel}</span>
                    </span>
                    {conversation.unreadCount > 0 ? (
                      <span
                        className="mt-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#1f3d32] px-1.5 text-xs text-[#f4f1ea]"
                        aria-label={`${conversation.unreadCount} unread`}
                      >
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {hostScreen === "thread" && thread ? (
        <div className="flex flex-1 flex-col">
          <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={() => setHostScreen("messages")}>
            Back
          </button>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-[#1c241c]">Conversation</h2>
          <ol className="mt-4 space-y-4">
            {thread.messages.map((message) => (
              <li key={message.id}>
                <p className="text-xs text-[#6a7268]">
                  {message.senderType === "user" ? "You" : message.senderName}
                  <span aria-hidden> · </span>
                  <time dateTime={message.createdAt}>{formatDateTime(new Date(message.createdAt))}</time>
                </p>
                <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-[#1c241c]">{message.body}</p>
              </li>
            ))}
          </ol>
          {thread.closed ? (
            <p className="mt-6 text-sm text-[#3d463d]">The team closed this conversation.</p>
          ) : (
            <form
              className="mt-6"
              onSubmit={async (event) => {
                event.preventDefault();
                if (reply.trim().length === 0) {
                  setReplyError("Write a reply before sending.");
                  return;
                }
                setReplyPending(true);
                setReplyError(null);
                const formData = new FormData();
                formData.set("conversationId", thread.id);
                formData.set("body", reply);
                const result = await replyDemoMessage(formData);
                setReplyPending(false);
                if (result.ok) {
                  setReply("");
                  router.refresh();
                  return;
                }
                setReplyError(result.error);
              }}
            >
              <label htmlFor="user-reply" className="text-sm font-medium text-[#1c241c]">
                Reply
              </label>
              <Textarea
                id="user-reply"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                className="mt-2 min-h-24 bg-white"
                placeholder="Write a reply"
              />
              {replyError ? (
                <p className="mt-2 text-sm text-[#8a2e24]" role="alert">
                  {replyError}
                </p>
              ) : null}
              <Button
                type="submit"
                disabled={replyPending}
                className="mt-3 h-11 w-full bg-[#1f3d32] text-[#f4f1ea] hover:bg-[#1f3d32]/90"
              >
                {replyPending ? "Sending…" : "Send"}
              </Button>
            </form>
          )}
        </div>
      ) : null}

      {hostScreen === "thread" && !thread ? (
        <div className="flex flex-1 flex-col">
          <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={() => setHostScreen("messages")}>
            Back
          </button>
          <p className="mt-6 text-sm text-[#8a2e24]" role="alert">
            This conversation is not available.
          </p>
        </div>
      ) : null}
    </div>
  );
}
