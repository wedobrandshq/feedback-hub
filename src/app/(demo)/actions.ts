"use server";

import { WILLOW_DEMO_USER } from "@/domain/willow-demo";
import { willowAppSecret } from "@/domain/secrets";
import { readDemoSubmission } from "@/domain/demo-submission";
import { DomainError } from "@/domain/errors";
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
    return { ok: true };
  } catch (error) {
    if (error instanceof DomainError && error.code === "validation") {
      return { ok: false, error: error.message };
    }
    console.error(error);
    return { ok: false, error: "We couldn’t send your feedback. Try again." };
  }
}
