import { cn } from "cn";

export const hatchSticker =
  "inline-block rounded-full border-2 border-[#0e0e1a] bg-[#c6ff4f] px-2.5 py-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase shadow-[3px_3px_0_#0e0e1a] [font-family:var(--font-mono)]";

export const hatchTitle =
  "text-3xl leading-[0.95] font-extrabold tracking-[-0.045em] text-[#0e0e1a] [font-family:var(--font-display)] md:text-4xl";

export const hatchBody = "text-base leading-6 font-normal text-[#5a5b70]";

export const hatchRowTitle = "text-base leading-6 font-medium text-[#0e0e1a]";

export const hatchPrimary =
  "h-auto rounded-full border-2 border-[#0e0e1a] bg-[#c6ff4f] px-4 py-1.5 text-[15px] leading-5 font-extrabold text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] [font-family:var(--font-display)] hover:bg-[#c6ff4f]";

export const hatchStrong =
  "h-auto rounded-full border-2 border-[#0e0e1a] bg-[#2f6bff] px-4 py-1.5 text-[15px] leading-5 font-extrabold text-white shadow-[3px_3px_0_#0e0e1a] [font-family:var(--font-display)] hover:bg-[#2f6bff]";

export const hatchSecondary =
  "h-auto rounded-full border-2 border-[#0e0e1a] bg-white px-3.5 py-1.5 text-sm leading-5 font-medium text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] hover:bg-[#fffcf2]";

export const hatchField =
  "h-10 rounded-full border-2 border-[#0e0e1a] bg-white px-3 text-sm text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] focus-visible:ring-0";

export const hatchArea =
  "rounded-2xl border-2 border-[#0e0e1a] bg-white text-sm text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] focus-visible:ring-0";

export const hatchSelect =
  "h-10 rounded-full border-2 border-[#0e0e1a] bg-white px-3 text-sm font-medium text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a]";

export const hatchHead =
  "h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]";

export const hatchDataRow = "relative border-[#0e0e1a]/15 hover:bg-[#fffcf2]";

export function hatchPill(active: boolean) {
  return `inline-flex shrink-0 items-center rounded-full border-2 border-[#0e0e1a] px-3.5 py-1.5 text-sm leading-5 font-medium text-[#0e0e1a] ${
    active ? "bg-[#c6ff4f] shadow-[3px_3px_0_#0e0e1a]" : "bg-white"
  }`;
}

export function HatchPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[16px] shadow-[5px_5px_0_#0e0e1a]", className)}>
      <div className="overflow-hidden rounded-[16px] border-2 border-[#0e0e1a] bg-white">{children}</div>
    </div>
  );
}
