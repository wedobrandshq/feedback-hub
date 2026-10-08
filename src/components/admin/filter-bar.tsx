import Link from "next/link";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from "@/domain/config";
import { STATUS_LABELS, TYPE_LABELS } from "@/domain/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "h-8 rounded-lg border border-input bg-background px-2 text-sm";

export function FilterBar({
  q,
  type,
  status,
  from,
  to,
}: {
  q: string;
  type: string;
  status: string;
  from: string;
  to: string;
}) {
  return (
    <form action="/admin/feedback" method="get" className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3 md:px-6">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs text-muted-foreground">
        Search
        <Input name="q" defaultValue={q} placeholder="Message, name, or email" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Type
        <select name="type" defaultValue={type} className={selectClass}>
          <option value="">All types</option>
          {FEEDBACK_TYPES.map((value) => (
            <option key={value} value={value}>
              {TYPE_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Status
        <select name="status" defaultValue={status} className={selectClass}>
          <option value="">All statuses</option>
          {FEEDBACK_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        From
        <Input name="from" type="date" defaultValue={from} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        To
        <Input name="to" type="date" defaultValue={to} />
      </label>
      <Button type="submit">Apply</Button>
      <Link href="/admin/feedback" className="inline-flex h-8 items-center px-2 text-sm text-muted-foreground hover:text-foreground">
        Clear
      </Link>
    </form>
  );
}
