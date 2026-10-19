"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HatchPanel, hatchLift, hatchRowTitle, hatchSelect } from "@/components/admin/hatch";

// Lists show as a table from md up. Below md each row is a card, and the
// column-header sort becomes a select plus a direction button.

export function MobileCards({ children }: { children: React.ReactNode }) {
  return (
    <HatchPanel clip className="md:hidden">
      <ul className="divide-y divide-[#0e0e1a]">{children}</ul>
    </HatchPanel>
  );
}

export function MobileCard({
  href,
  title,
  subtitle,
  chips,
  meta,
}: {
  href: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  chips?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <li className="relative px-5 py-4 hover:bg-[#fffcf2]">
      <Link href={href} className={`${hatchRowTitle} block after:absolute after:inset-0`}>
        {title}
      </Link>
      {subtitle ? <div className="mt-1 text-xs leading-4 text-[#5a5b70]">{subtitle}</div> : null}
      {chips ? <div className="mt-3 flex flex-wrap items-center gap-2">{chips}</div> : null}
      {meta ? <div className="mt-3 text-xs leading-4 text-[#5a5b70]">{meta}</div> : null}
    </li>
  );
}

export function MobileSort({
  options,
  value,
  dir,
  flipHref,
}: {
  options: { value: string; label: string; href: string }[];
  value: string;
  dir: "asc" | "desc";
  flipHref: string;
}) {
  const router = useRouter();
  return (
    <div className="mb-4 flex items-center gap-2 md:hidden">
      <label htmlFor="mobile-sort" className="text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
        Sort
      </label>
      <select
        id="mobile-sort"
        value={value}
        className={`${hatchSelect} min-w-0 flex-1`}
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value);
          if (option) router.push(option.href);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Link
        href={flipHref}
        aria-label={dir === "asc" ? "Sorted ascending, switch to descending" : "Sorted descending, switch to ascending"}
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#0e0e1a] bg-white text-base text-[#0e0e1a] hover:shadow-[2px_2px_0_#0e0e1a] ${hatchLift}`}
      >
        <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span>
      </Link>
    </div>
  );
}
