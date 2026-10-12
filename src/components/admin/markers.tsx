export function AttentionIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4.8v3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function TypeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path
        d="M2.8 8.2 7.4 3.2h5.4v5.4L7.6 13.6 2.8 8.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10.2" cy="5.6" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function StatusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <rect x="2.6" y="2.6" width="10.8" height="10.8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 8.2 7.1 10.2 11.1 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WithMarker({
  kind,
  children,
}: {
  kind: "attention" | "type" | "status";
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {kind === "attention" ? <AttentionIcon /> : kind === "type" ? <TypeIcon /> : <StatusIcon />}
      {children}
    </span>
  );
}
