export default function DemoLoading() {
  return (
    <div className="min-h-full bg-[#e4e0d6]">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4 px-4 py-16">
        <div className="h-8 w-32 animate-pulse rounded bg-[#d5d0c4]" />
        <div className="h-[760px] animate-pulse rounded-[2.6rem] bg-[#d5d0c4]" />
      </div>
    </div>
  );
}
