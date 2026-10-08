"use client";

import { useRef, useState } from "react";
import { submitDemoFeedback } from "@/app/(demo)/actions";
import { DEMO_KIND_OPTIONS } from "@/domain/feedback";
import type { SubmitFeedbackType } from "@/domain/config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Screen = "home" | "kind" | "message" | "done";

export function WillowFeedback({ name, plan }: { name: string; plan: string }) {
  const [screen, setScreen] = useState<Screen>("home");
  const [kind, setKind] = useState<SubmitFeedbackType | null>(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function replaceScreenshot(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = next ? URL.createObjectURL(next) : null;
    previewRef.current = url;
    setFile(next);
    setPreview(url);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kind) {
      setError("Choose what kind of feedback this is.");
      setScreen("kind");
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
      setScreen("done");
      return;
    }
    setError(result.error);
  }

  return (
    <div className="flex min-h-[680px] flex-col px-5 pt-4 pb-6">
      {screen === "home" ? (
        <div className="flex flex-1 flex-col">
          <p className="text-xs text-[#6a7268]">{name} · {plan}</p>
          <h2 className="mt-8 text-[2rem] leading-none font-semibold tracking-tight text-[#1c241c]">Feedback</h2>
          <p className="mt-3 text-lg text-[#3d463d]">Help us make Willow better.</p>
          <div className="mt-auto pt-10">
            <Button
              type="button"
              className="h-12 w-full bg-[#1f3d32] text-[#f4f1ea] hover:bg-[#1f3d32]/90"
              onClick={() => {
                setError(null);
                setScreen("kind");
              }}
            >
              Share feedback
            </Button>
          </div>
        </div>
      ) : null}

      {screen === "kind" ? (
        <div className="flex flex-1 flex-col">
          <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={() => setScreen("home")}>
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
              onClick={() => setScreen("message")}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {screen === "message" ? (
        <form className="flex flex-1 flex-col" onSubmit={onSubmit}>
          <button type="button" className="self-start text-sm text-[#1f3d32]" onClick={() => setScreen("kind")}>
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

      {screen === "done" ? (
        <div className="flex flex-1 flex-col">
          <h2 className="mt-16 text-2xl font-semibold tracking-tight text-[#1c241c]">
            Thanks for helping us improve Willow.
          </h2>
          <p className="mt-3 text-base leading-7 text-[#3d463d]">If the team responds, you’ll get an update.</p>
          <div className="mt-auto pt-10">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full"
              onClick={() => {
                setScreen("home");
                setKind(null);
                setBody("");
                replaceScreenshot(null);
                setError(null);
              }}
            >
              Send more feedback
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
