"use client";

import { useState } from "react";
import { setSelectedAppAction } from "@/app/(admin)/admin/(console)/actions";

export function AppSelector({
  apps,
  selectedId,
}: {
  apps: { id: string; name: string }[];
  selectedId: string | null;
}) {
  const [value, setValue] = useState(selectedId ?? "all");
  const [pending, setPending] = useState(false);

  return (
    <form action={setSelectedAppAction} className="flex items-center gap-2">
      <label htmlFor="app-selector" className="text-sm text-muted-foreground">
        App
      </label>
      <select
        id="app-selector"
        name="app"
        value={value}
        disabled={pending}
        className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          setPending(true);
          const formData = new FormData();
          formData.set("app", next);
          void setSelectedAppAction(formData).finally(() => setPending(false));
        }}
      >
        <option value="all">All Apps</option>
        {apps.map((app) => (
          <option key={app.id} value={app.id}>
            {app.name}
          </option>
        ))}
      </select>
    </form>
  );
}
