"use client";

import { useState } from "react";
import { setSelectedAppAction } from "@/app/(admin)/admin/(console)/actions";
import { hatchSelect } from "@/components/admin/hatch";

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
      <label htmlFor="app-selector" className="text-sm font-medium text-[#0e0e1a]">
        App
      </label>
      <select
        id="app-selector"
        name="app"
        value={value}
        disabled={pending}
        className={hatchSelect}
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
