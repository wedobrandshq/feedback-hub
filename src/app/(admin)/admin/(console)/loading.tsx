export default function HomeLoading() {
  return (
    <div className="px-6 py-5">
      <div className="h-7 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-14 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
