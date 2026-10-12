"use client";

import { useState } from "react";
import { setSelectedAppAction } from "@/app/(admin)/admin/(console)/actions";
import { hatchSelect } from "@/components/admin/hatch";

export function AppSelector({
  apps,
  selectedId,
  id = "app-selector",
}: {
  apps: { id: string; name: string }[];
  selectedId: string | null;
  id?: string;
}) {
  const [value, setValue] = useState(selectedId ?? "all");
  const [pending, setPending] = useState(false);

  return (
    <form action={setSelectedAppAction}>
      <select
        id={id}
        name="app"
        aria-label="App"
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
