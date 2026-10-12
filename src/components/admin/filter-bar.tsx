import Link from "next/link";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES } from "@/domain/config";
import { STATUS_LABELS, TYPE_LABELS } from "@/domain/feedback";
import { HatchPanel, hatchField, hatchPrimary, hatchSecondary, hatchSelect } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FilterBar({
  q,
  type,
  status,
  from,
  to,
  sort,
  dir,
}: {
  q: string;
  type: string;
  status: string;
  from: string;
  to: string;
  sort: string;
  dir: string;
}) {
  return (
    <div className="px-4 pt-4 md:px-8">
      <HatchPanel>
        <form action="/admin/feedback" method="get" className="flex flex-wrap items-end gap-3 px-4 py-4">
          {sort !== "created" || dir !== "desc" ? (
            <>
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="dir" value={dir} />
            </>
          ) : null}
          <label className="flex w-full min-w-0 flex-1 flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)] sm:min-w-48">
            Search
            <Input name="q" defaultValue={q} placeholder="Message, name, or email" className={hatchField} />
          </label>
          <label className="flex w-full min-w-0 flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)] sm:w-auto">
            <WithMarker kind="type">Type</WithMarker>
            <select name="type" defaultValue={type} className={`${hatchSelect} w-full sm:w-auto`}>
              <option value="">All types</option>
              {FEEDBACK_TYPES.map((value) => (
                <option key={value} value={value}>
                  {TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-full min-w-0 flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)] sm:w-auto">
            <WithMarker kind="status">Status</WithMarker>
            <select name="status" defaultValue={status} className={`${hatchSelect} w-full sm:w-auto`}>
              <option value="">All statuses</option>
              {FEEDBACK_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-full min-w-0 flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)] sm:w-auto">
            From
            <Input name="from" type="date" defaultValue={from} className={`${hatchField} hatch-date w-full min-w-0 sm:w-40`} />
          </label>
          <label className="flex w-full min-w-0 flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)] sm:w-auto">
            To
            <Input name="to" type="date" defaultValue={to} className={`${hatchField} hatch-date w-full min-w-0 sm:w-40`} />
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
