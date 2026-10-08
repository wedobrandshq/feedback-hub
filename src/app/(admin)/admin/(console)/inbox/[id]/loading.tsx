export default function ConversationLoading() {
  return (
    <div className="px-6 py-5">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
