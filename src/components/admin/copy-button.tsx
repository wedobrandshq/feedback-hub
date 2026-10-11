"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
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
