import { CopyButton } from "@/components/admin/copy-button";

function MarkedCode({ text, secret }: { text: string; secret?: string }) {
  if (!secret || !text.includes(secret)) return text;
  const parts = text.split(secret);
  return parts.map((part, index) =>
    index === 0 ? (
      part
    ) : (
      <span key={index}>
        <span data-app-secret>{secret}</span>
        {part}
      </span>
    ),
  );
}

export function InstallCodeBlock({
  id,
  title,
  description,
  code,
  secret,
}: {
  id: "server" | "view";
  title: string;
  description: string;
  code: string;
  secret?: string;
}) {
  return (
    <section className="max-w-3xl rounded-[32px] border-2 border-[#0e0e1a] bg-white p-5 shadow-[5px_5px_0_#0e0e1a]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-[-0.03em] [font-family:var(--font-display)]">{title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-[#5a5b70]">{description}</p>
        </div>
        <CopyButton code={code} label={title.toLowerCase()} />
      </div>
      <pre
        data-install={id}
        className="mt-4 overflow-x-auto rounded-2xl border-2 border-[#0e0e1a] bg-[#fffcf2] p-4 text-xs leading-5 text-[#0e0e1a] [font-family:var(--font-mono)]"
      >
        <code>
          <MarkedCode text={code} secret={secret} />
        </code>
      </pre>
    </section>
  );
}
