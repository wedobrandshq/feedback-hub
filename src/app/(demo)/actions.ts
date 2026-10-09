"use server";

import { revalidatePath } from "next/cache";
import { readDemoReply } from "@/domain/demo-reply";
import { WILLOW_DEMO_USER } from "@/domain/willow-demo";
import { willowAppSecret } from "@/domain/secrets";
import { readDemoSubmission } from "@/domain/demo-submission";
import { DomainError } from "@/domain/errors";
import { markConversationReadByUser, replyAsUser } from "@/server/conversations";
import { markNotificationsRead, removeVote, voteOnRequest } from "@/server/requests";
import { identifyUser } from "@/server/identify-user";
import { submitFeedback } from "@/server/submit-feedback";

export type DemoSubmitResult = { ok: true } | { ok: false; error: string };

export async function submitDemoFeedback(formData: FormData): Promise<DemoSubmitResult> {
  try {
    const submission = await readDemoSubmission(formData);
    const appSecret = willowAppSecret();
    await identifyUser({
      appSecret,
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
    await submitFeedback({
      appSecret,
      externalUserId: WILLOW_DEMO_USER.externalUserId,
      type: submission.type,
      body: submission.body,
      context: {
        appVersion: WILLOW_DEMO_USER.appVersion,
        osVersion: WILLOW_DEMO_USER.osVersion,
        device: WILLOW_DEMO_USER.device,
        locale: WILLOW_DEMO_USER.locale,
      },
      attachment: submission.attachment,
    });
    revalidatePath("/demo");
    revalidatePath("/admin/inbox");
    revalidatePath("/admin/feedback");
    return { ok: true };
  } catch (error) {
    if (error instanceof DomainError && error.code === "validation") {
      return { ok: false, error: error.message };
    }
    console.error(error);
    return { ok: false, error: "We couldn’t send your feedback. Try again." };
  }
}

export async function replyDemoMessage(formData: FormData): Promise<DemoSubmitResult> {
  try {
    const reply = readDemoReply(formData);
    await replyAsUser({
      appSecret: willowAppSecret(),
      externalUserId: WILLOW_DEMO_USER.externalUserId,
      conversationId: reply.conversationId,
      body: reply.body,
    });
    revalidatePath("/demo");
    revalidatePath("/admin/inbox");
    return { ok: true };
  } catch (error) {
    if (error instanceof DomainError && (error.code === "validation" || error.code === "conflict")) {
      return { ok: false, error: error.message };
    }
    console.error(error);
    return { ok: false, error: "We couldn’t send your reply. Try again." };
  }
}

export async function voteDemoRequest(formData: FormData): Promise<DemoSubmitResult> {
  try {
    const requestId = String(formData.get("requestId") ?? "");
    const input = {
      appSecret: willowAppSecret(),
      externalUserId: WILLOW_DEMO_USER.externalUserId,
      requestId,
    };
    if (formData.get("intent") === "remove") await removeVote(input);
    else await voteOnRequest(input);
    revalidatePath("/demo");
    return { ok: true };
  } catch (error) {
    if (error instanceof DomainError && (error.code === "validation" || error.code === "conflict" || error.code === "not_found")) {
      return { ok: false, error: error.message };
    }
    console.error(error);
    return { ok: false, error: "We couldn’t save that vote. Try again." };
  }
}

export async function markDemoNotificationsRead(): Promise<void> {
  try {
    await markNotificationsRead({
      appSecret: willowAppSecret(),
      externalUserId: WILLOW_DEMO_USER.externalUserId,
    });
    revalidatePath("/demo");
  } catch (error) {
    if (error instanceof DomainError) return;
    throw error;
  }
}

export async function markDemoThreadRead(conversationId: string): Promise<void> {
  try {
    await markConversationReadByUser({
      appSecret: willowAppSecret(),
      externalUserId: WILLOW_DEMO_USER.externalUserId,
      conversationId,
    });
    revalidatePath("/demo");
  } catch (error) {
    if (error instanceof DomainError) return;
    throw error;
  }
}
