"use client";

import { useActionState, useState } from "react";
import { createAppAction, updateAppAction, type AppFormState } from "@/app/(admin)/admin/(console)/apps/actions";
import { APP_PLATFORMS, APP_STATUSES } from "@/domain/app";
import { hatchField, hatchPrimary, hatchSelect } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AppFormState = { error: null, saved: false };

export function CreateAppForm() {
  const [state, action, pending] = useActionState(createAppAction, initial);
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-md">
      <Button
        type="button"
        className={hatchPrimary}
        aria-expanded={open}
        aria-controls="add-app-form"
        onClick={() => setOpen((current) => !current)}
      >
        Add app
      </Button>
      {open ? (
        <form id="add-app-form" action={action} className="mt-4 space-y-4">
          <h2 className="text-lg font-extrabold tracking-[-0.03em] [font-family:var(--font-display)]">Add an app</h2>
          <div className="space-y-1.5">
            <Label htmlFor="new-app-name">Name</Label>
            <Input id="new-app-name" name="name" required className={hatchField} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-app-platform">Platform</Label>
            <select id="new-app-platform" name="platform" defaultValue="iOS" className={`${hatchSelect} w-full`}>
              {APP_PLATFORMS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" className={hatchPrimary} disabled={pending}>
            {pending ? "Adding…" : "Add app"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function EditAppForm({
  slug,
  name,
  platform,
  status,
}: {
  slug: string;
  name: string;
  platform: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(updateAppAction, initial);
  return (
    <form action={action} className="max-w-md space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <h2 className="text-lg font-extrabold tracking-[-0.03em] [font-family:var(--font-display)]">App</h2>
      <div className="space-y-1.5">
        <Label htmlFor="app-name">Name</Label>
        <Input id="app-name" name="name" defaultValue={name} required className={hatchField} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="app-platform">Platform</Label>
        <select id="app-platform" name="platform" defaultValue={platform} className={`${hatchSelect} w-full`}>
          {APP_PLATFORMS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="app-status">Status</Label>
        <select id="app-status" name="status" defaultValue={status} className={`${hatchSelect} w-full`}>
          {APP_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      <Button type="submit" className={hatchPrimary} disabled={pending}>
        {pending ? "Saving…" : "Save app"}
      </Button>
    </form>
  );
}
