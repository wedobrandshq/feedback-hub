import { hatchSticker } from "@/components/admin/hatch";
import type { FeedbackStatusName, FeedbackTypeName } from "@/domain/config";
import { STATUS_LABELS, TYPE_LABELS } from "@/domain/feedback";

export function StatusBadge({ status }: { status: FeedbackStatusName }) {
  return <span className={hatchSticker}>{STATUS_LABELS[status]}</span>;
}

export function TypeBadge({ type }: { type: FeedbackTypeName }) {
  return <span className={hatchSticker}>{TYPE_LABELS[type]}</span>;
}
