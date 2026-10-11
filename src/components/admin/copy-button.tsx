"use client";

import { useState } from "react";
import { hatchSecondary } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";

export function CopyButton({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={hatchSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : `Copy ${label}`}
    </Button>
  );
}
