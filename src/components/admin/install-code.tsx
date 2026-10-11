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
    <section className="max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <CopyButton code={code} label={title.toLowerCase()} />
      </div>
      <pre
        data-install={id}
        className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs leading-5"
      >
        <code>
          <MarkedCode text={code} secret={secret} />
        </code>
      </pre>
    </section>
  );
}
