"use client";

export default function DemoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-full bg-[#e4e0d6] px-6 py-16 text-[#1c241c]">
      <h1 className="text-xl font-semibold">Couldn’t open Willow</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#3d463d]">
        Something went wrong while loading messages. Try again.
      </p>
      <button
        type="button"
        className="mt-6 h-11 rounded-lg bg-[#1f3d32] px-4 text-sm text-[#f4f1ea]"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
