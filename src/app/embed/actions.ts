"use server";

import { revalidatePath } from "next/cache";
import { readDemoSubmission } from "@/domain/demo-submission";
import { DomainError } from "@/domain/errors";
import { readEmbedActor } from "@/server/embed";
import { removeVoteForActor, voteOnRequestForActor } from "@/server/requests";
import { submitFeedbackForActor } from "@/server/submit-feedback";

export type EmbedActionResult = { ok: true } | { ok: false; error: string };

function refresh(paths: string[]) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Called outside a Next request in tests.
    }
  }
}

function fail(error: unknown, fallback: string): EmbedActionResult {
  if (error instanceof DomainError && error.code !== "unauthorized") {
    return { ok: false, error: error.message };
  }
  if (error instanceof DomainError) return { ok: false, error: error.message };
  console.error(error);
  return { ok: false, error: fallback };
}

export async function submitEmbedFeedback(_previous: EmbedActionResult, formData: FormData): Promise<EmbedActionResult> {
  try {
    const actor = await readEmbedActor(String(formData.get("session") ?? ""));
    const submission = await readDemoSubmission(formData);
    await submitFeedbackForActor({
      appId: actor.appId,
      userId: actor.id,
      type: submission.type,
      body: submission.body,
      context: {
        appVersion: actor.appVersion,
        osVersion: actor.osVersion,
        device: actor.device,
        locale: actor.locale,
      },
      attachment: submission.attachment,
    });
    refresh(["/embed", "/admin/inbox", "/admin/feedback"]);
    return { ok: true };
  } catch (error) {
    return fail(error, "We couldn’t send your feedback. Try again.");
  }
}

export async function voteEmbedRequest(_previous: EmbedActionResult, formData: FormData): Promise<EmbedActionResult> {
  try {
    const actor = await readEmbedActor(String(formData.get("session") ?? ""));
    const requestId = String(formData.get("requestId") ?? "");
    const input = { appId: actor.appId, userId: actor.id, requestId };
    if (formData.get("intent") === "remove") await removeVoteForActor(input);
    else await voteOnRequestForActor(input);
    refresh(["/embed"]);
    return { ok: true };
  } catch (error) {
    return fail(error, "We couldn’t save that vote. Try again.");
  }
}
