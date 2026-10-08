export default function InboxLoading() {
  return (
    <div className="px-6 py-5">
      <div className="h-7 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-11 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
