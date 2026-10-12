import { hatchChip } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
import type { FeedbackStatusName, FeedbackTypeName } from "@/domain/config";
import { STATUS_LABELS, TYPE_LABELS } from "@/domain/feedback";

export function StatusBadge({ status }: { status: FeedbackStatusName }) {
  return (
    <span className={hatchChip(status)}>
      <WithMarker kind="status">{STATUS_LABELS[status]}</WithMarker>
    </span>
  );
}

export function TypeBadge({ type }: { type: FeedbackTypeName }) {
  return (
    <span className={hatchChip(type)}>
      <WithMarker kind="type">{TYPE_LABELS[type]}</WithMarker>
    </span>
  );
}
