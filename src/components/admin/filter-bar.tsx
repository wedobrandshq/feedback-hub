import Link from "next/link";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from "@/domain/config";
import { STATUS_LABELS, TYPE_LABELS } from "@/domain/feedback";
import { HatchPanel, hatchField, hatchPrimary, hatchSecondary, hatchSelect } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="px-4 pt-4 md:px-8">
      <HatchPanel>
        <form action="/admin/feedback" method="get" className="flex flex-wrap items-end gap-3 px-4 py-4">
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
            Search
            <Input name="q" defaultValue={q} placeholder="Message, name, or email" className={hatchField} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
            Type
            <select name="type" defaultValue={type} className={hatchSelect}>
              <option value="">All types</option>
              {FEEDBACK_TYPES.map((value) => (
                <option key={value} value={value}>
                  {TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
            Status
            <select name="status" defaultValue={status} className={hatchSelect}>
              <option value="">All statuses</option>
              {FEEDBACK_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
            From
            <Input name="from" type="date" defaultValue={from} className={hatchField} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
            To
            <Input name="to" type="date" defaultValue={to} className={hatchField} />
          </label>
          <Button type="submit" className={hatchPrimary}>Apply</Button>
          <Link href="/admin/feedback" className={hatchSecondary}>
            Clear
          </Link>
        </form>
      </HatchPanel>
    </div>
  );
}
