import { BODY_MAX_LENGTH, SUBMIT_FEEDBACK_TYPES, type SubmitFeedbackType } from "@/domain/config";
import { DomainError } from "@/domain/errors";

export type DemoSubmission = {
  type: SubmitFeedbackType;
  body: string;
  attachment: {
    fileName: string;
    bytes: Buffer;
  } | null;
};

function isSubmitType(value: string): value is SubmitFeedbackType {
  return (SUBMIT_FEEDBACK_TYPES as readonly string[]).includes(value);
}

export async function readDemoSubmission(formData: FormData): Promise<DemoSubmission> {
  const typeValue = formData.get("type");
  const bodyValue = formData.get("body");

  if (typeof typeValue !== "string" || !isSubmitType(typeValue)) {
    throw new DomainError("Choose what kind of feedback this is.", "validation");
  }
  if (typeof bodyValue !== "string" || bodyValue.trim().length === 0) {
    throw new DomainError("Tell us a bit more before sending.", "validation");
  }
  if (bodyValue.length > BODY_MAX_LENGTH) {
    throw new DomainError("Feedback needs to be 10,000 characters or less.", "validation");
  }

  const file = formData.get("screenshot");
  if (!(file instanceof File) || file.size === 0) {
    return { type: typeValue, body: bodyValue, attachment: null };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  return {
    type: typeValue,
    body: bodyValue,
    attachment: { fileName: file.name || "screenshot", bytes },
  };
}
