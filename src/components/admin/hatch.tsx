import { cn } from "cn";

export const hatchSticker =
  "inline-block rounded-full border-2 border-[#0e0e1a] bg-[#c6ff4f] px-2.5 py-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase shadow-[3px_3px_0_#0e0e1a] [font-family:var(--font-mono)]";

const hatchChipBase =
  "inline-block rounded-full border-2 border-[#0e0e1a] px-2.5 py-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase shadow-[3px_3px_0_#0e0e1a] [font-family:var(--font-mono)]";

const CHIP_BACKGROUNDS: Record<string, string> = {
  idea: "bg-[#6fd9ff]",
  planned: "bg-[#6fd9ff]",
  bug: "bg-[#ff4d3d]",
  not_planned: "bg-[#ff4d3d]",
  closed: "bg-[#ff4d3d]",
  improvement: "bg-[#3ddc97]",
  in_progress: "bg-[#3ddc97]",
  other: "bg-[#b388ff]",
  under_consideration: "bg-[#b388ff]",
  new: "bg-[#ffc531]",
  review: "bg-[#ffc531]",
  needs_reply: "bg-[#ffc531]",
  reviewed: "bg-[#2f6bff]",
  released: "bg-[#2f6bff]",
  linked: "bg-[#c6ff4f]",
};

export function hatchChip(tone: string) {
  return `${hatchChipBase} ${CHIP_BACKGROUNDS[tone] ?? "bg-[#fffcf2]"}`;
}

export const hatchTitle =
  "text-3xl leading-[0.95] font-extrabold tracking-[-0.045em] text-[#0e0e1a] [font-family:var(--font-display)] md:text-4xl";

export const hatchBody = "text-base leading-6 font-normal text-[#5a5b70]";

export const hatchRowTitle = "text-base leading-6 font-medium text-[#0e0e1a]";

export const hatchLift =
  "transition-[translate,box-shadow] duration-200 ease-out hover:[translate:-2px_-2px] focus-visible:[translate:-2px_-2px] active:translate-none active:not-aria-[haspopup]:translate-none";

const hatchButton =
  `shadow-none ${hatchLift} active:shadow-none focus-visible:border-2 focus-visible:ring-0`;

export const hatchPrimary =
  `h-auto rounded-full border-2 border-[#0e0e1a] bg-[#c6ff4f] px-6 py-2 text-[15px] leading-5 font-extrabold text-[#0e0e1a] [font-family:var(--font-display)] hover:bg-[#c6ff4f] focus-visible:border-[#0e0e1a] hover:shadow-[3px_3px_0_#0e0e1a] focus-visible:shadow-[3px_3px_0_#0e0e1a] ${hatchButton}`;

export const hatchStrong =
  `h-auto rounded-full border-2 border-[#0e0e1a] bg-[#2f6bff] px-6 py-2 text-[15px] leading-5 font-extrabold text-white [font-family:var(--font-display)] hover:bg-[#2f6bff] focus-visible:border-[#0e0e1a] hover:shadow-[3px_3px_0_#0e0e1a] focus-visible:shadow-[3px_3px_0_#0e0e1a] ${hatchButton}`;

export const hatchSecondary =
  `h-auto rounded-full border-2 border-[#0e0e1a] bg-white px-3.5 py-1.5 text-sm leading-5 font-medium text-[#0e0e1a] hover:bg-white hover:text-[#0e0e1a] focus-visible:border-[#0e0e1a] hover:shadow-[2px_2px_0_#0e0e1a] focus-visible:shadow-[2px_2px_0_#0e0e1a] ${hatchButton}`;

export const hatchField =
  "h-10 rounded-full border-2 border-[#0e0e1a] bg-white px-3 text-sm text-[#0e0e1a] shadow-none outline-none focus-visible:border-2 focus-visible:border-[#0e0e1a] focus-visible:ring-0 focus-visible:shadow-[5px_5px_0_#0e0e1a]";

export const hatchArea =
  "rounded-2xl border-2 border-[#0e0e1a] bg-white text-sm text-[#0e0e1a] shadow-none outline-none focus-visible:border-2 focus-visible:border-[#0e0e1a] focus-visible:ring-0 focus-visible:shadow-[5px_5px_0_#0e0e1a]";

export const hatchSelect =
  "h-10 rounded-full border-2 border-[#0e0e1a] bg-white px-3 text-sm font-medium text-[#0e0e1a] shadow-none outline-none focus:border-2 focus:border-[#0e0e1a] focus:shadow-[5px_5px_0_#0e0e1a] focus:outline-none focus:ring-0 focus-visible:border-2 focus-visible:ring-0 focus-visible:shadow-[5px_5px_0_#0e0e1a]";

export const hatchHead =
  "h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]";

export const hatchDataRow = "relative border-[#0e0e1a] hover:bg-[#fffcf2]";

export function hatchPill(active: boolean) {
  return `inline-flex shrink-0 items-center rounded-full border-2 border-[#0e0e1a] px-3.5 py-1.5 text-sm leading-5 font-medium text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] hover:shadow-[3px_3px_0_#0e0e1a] ${hatchLift} ${
    active ? "bg-[#c6ff4f]" : "bg-white"
  }`;
}

export const hatchWash = {
  white: "bg-white",
  lilac: "bg-[#ede6ff]",
  mint: "bg-[#e2fbef]",
  sky: "bg-[#e4eeff]",
} as const;

export function HatchPanel({
  children,
  className,
  wash = "white",
  clip = false,
}: {
  children: React.ReactNode;
  className?: string;
  wash?: keyof typeof hatchWash;
  clip?: boolean;
}) {
  return (
    <div className={cn("rounded-[32px] shadow-[5px_5px_0_#0e0e1a]", className)}>
      <div
        className={cn(
          "rounded-[32px] border-2 border-[#0e0e1a]",
          hatchWash[wash],
          clip ? "overflow-hidden" : "overflow-visible",
        )}
      >
        {children}
      </div>
    </div>
  );
}
