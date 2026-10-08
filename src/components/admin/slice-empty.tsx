import { PageHeader } from "@/components/admin/page-header";

export function SliceEmpty({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <p className="px-4 py-10 text-sm text-muted-foreground md:px-6">This area is not in the current slice.</p>
    </>
  );
}
