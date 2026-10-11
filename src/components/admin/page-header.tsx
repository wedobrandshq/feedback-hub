import { hatchBody, hatchSticker, hatchTitle } from "@/components/admin/hatch";

export function PageHeader({
  title,
  description,
  kicker,
  actions,
}: {
  title: string;
  description?: string;
  kicker?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 px-4 pt-8 pb-2 md:flex-row md:items-end md:justify-between md:px-8">
      <div>
        <p className={hatchSticker}>{kicker ?? title}</p>
        <h1 className={`mt-4 ${hatchTitle}`}>{title}</h1>
        {description ? <p className={`mt-3 max-w-2xl ${hatchBody}`}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2 pb-1">{actions}</div> : null}
    </header>
  );
}
