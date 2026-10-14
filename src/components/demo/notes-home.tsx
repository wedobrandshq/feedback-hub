import { hatchField, hatchLift, hatchTitle } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV = [
  { label: "Home", icon: HomeIcon, current: true },
  { label: "Support", icon: SupportIcon, current: false },
  { label: "Settings", icon: SettingsIcon, current: false },
] as const;

const ACTIONS = [
  { label: "Record audio", icon: MicIcon },
  { label: "Web link", icon: LinkIcon },
  { label: "PDF file or text", icon: FileIcon },
  { label: "Upload audio", icon: UploadIcon },
] as const;

export function NotesHome() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fffcf2] text-[#0e0e1a] md:flex-row">
      <aside className="shrink-0 border-b-2 border-[#0e0e1a] md:flex md:w-60 md:flex-col md:border-r-2 md:border-b-0">
        <nav aria-label="Notes" className="flex gap-2 overflow-x-auto px-4 py-4 md:flex-col md:px-3 md:pt-6">
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-current={item.current ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[17px] leading-[26px] font-medium text-[#0e0e1a] ${hatchLift} ${
                item.current
                  ? "border-[#0e0e1a] bg-[#c6ff4f] shadow-[3px_3px_0_#0e0e1a]"
                  : "border-transparent hover:border-[#0e0e1a] hover:bg-white hover:shadow-[2px_2px_0_#0e0e1a]"
              }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <h1 className={hatchTitle}>New note</h1>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ACTIONS.map((action) => (
              <li key={action.label}>
                <button
                  type="button"
                  className={`flex h-full w-full flex-col items-start rounded-[32px] border-2 border-[#0e0e1a] bg-white px-5 py-6 text-left shadow-[5px_5px_0_#0e0e1a] ${hatchLift} hover:shadow-[5px_5px_0_#0e0e1a] focus-visible:shadow-[5px_5px_0_#0e0e1a]`}
                >
                  <span className="grid size-12 place-items-center rounded-2xl border-2 border-[#0e0e1a] bg-[#c6ff4f] shadow-[3px_3px_0_#0e0e1a]">
                    <action.icon />
                  </span>
                  <span className="mt-5 text-lg leading-6 font-extrabold tracking-[-0.03em] [font-family:var(--font-display)]">
                    {action.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <h2 className="mt-10 text-2xl leading-none font-extrabold tracking-[-0.04em] [font-family:var(--font-display)]">
            My notes
          </h2>
          <article className="mt-4 rounded-[32px] shadow-[5px_5px_0_#0e0e1a]">
            <div className="flex items-center gap-4 rounded-[32px] border-2 border-[#0e0e1a] bg-white px-5 py-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-[#0e0e1a] bg-[#fffcf2] shadow-[3px_3px_0_#0e0e1a]">
                <FileIcon />
              </span>
              <div className="min-w-0">
                <h3 className="text-base leading-6 font-medium">Welcome to your notes</h3>
                <p className="mt-0.5 text-sm text-[#5a5b70]">Just now</p>
              </div>
            </div>
          </article>
        </main>
        <form className="border-t-2 border-[#0e0e1a] px-4 py-4 md:px-8" action="#">
          <div className="flex items-center gap-3">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Ask anything about your notes</span>
              <Input
                name="ask"
                placeholder="Ask anything about your notes"
                className={`${hatchField} w-full placeholder:text-[#5a5b70]`}
              />
            </label>
            <Button type="submit" className="size-10 rounded-full border-2 border-[#0e0e1a] bg-[#c6ff4f] p-0 text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] hover:bg-[#c6ff4f]" aria-label="Ask">
              <ArrowIcon />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4">
      <path d="M2.5 7.2 8 2.8l5.5 4.4V13a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V7.2Z" fill="none" stroke="#0e0e1a" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6.5 14V9.5h3V14" fill="none" stroke="#0e0e1a" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4">
      <circle cx="8" cy="8" r="5.2" fill="none" stroke="#0e0e1a" strokeWidth="1.6" />
      <circle cx="8" cy="8" r="1.6" fill="none" stroke="#0e0e1a" strokeWidth="1.6" />
      <path d="M8 2.8V4.4M8 11.6v1.6M2.8 8H4.4M11.6 8h1.6" stroke="#0e0e1a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4">
      <circle cx="8" cy="8" r="2.1" fill="none" stroke="#0e0e1a" strokeWidth="1.6" />
      <path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" stroke="#0e0e1a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="#0e0e1a" strokeWidth="1.8" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.2M9 20.2h6" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <path d="M10 13.5a4 4 0 0 0 5.7.4l2.2-2.2a4 4 0 0 0-5.7-5.6L11 7.3" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.4l-2.2 2.2a4 4 0 0 0 5.7 5.6L13 16.7" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3.8V8h4.2M8.5 12.5h7M8.5 16h5" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6">
      <path d="M12 15.5V4.5M8 8.2 12 4.2l4 4" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15.5v3.2A1.8 1.8 0 0 0 6.8 20.5h10.4a1.8 1.8 0 0 0 1.8-1.8v-3.2" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4">
      <path d="M8 12.5V3.5M4.5 7 8 3.5 11.5 7" fill="none" stroke="#0e0e1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
