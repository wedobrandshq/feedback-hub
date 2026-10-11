import { HatchPanel, hatchBody, hatchSticker, hatchTitle } from "@/components/admin/hatch";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-6 md:px-8">
      <HatchPanel className="max-w-xl">
        <div className="px-6 py-10">
          <p className={hatchSticker}>Empty</p>
          <h2 className={`mt-4 ${hatchTitle}`}>{title}</h2>
          <p className={`mt-3 max-w-md ${hatchBody}`}>{description}</p>
          {action ? <div className="mt-5">{action}</div> : null}
        </div>
      </HatchPanel>
    </div>
  );
}
