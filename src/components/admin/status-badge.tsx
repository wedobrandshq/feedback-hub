import { Badge } from "@/components/ui/badge";
import type { FeedbackStatusName, FeedbackTypeName } from "@/domain/config";
import { STATUS_LABELS, TYPE_LABELS } from "@/domain/feedback";

const STATUS_CLASS: Record<FeedbackStatusName, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-950",
  reviewed: "border-amber-200 bg-amber-50 text-amber-950",
  linked: "border-violet-200 bg-violet-50 text-violet-950",
  closed: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: FeedbackStatusName }) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: FeedbackTypeName }) {
  return (
    <Badge variant="outline" className="text-foreground">
      {TYPE_LABELS[type]}
    </Badge>
  );
}
