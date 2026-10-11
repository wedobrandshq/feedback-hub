"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "@/app/(admin)/admin/(console)/settings/actions";
import { consoleRoleLabel } from "@/domain/console";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ProfileState = { error: null, saved: false };

export function ProfileForm({
  name,
  email,
  role,
  workspaceName,
}: {
  name: string;
  email: string;
  role: string;
  workspaceName: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);

  return (
    <form action={action} className="max-w-md space-y-4 px-4 py-6 md:px-6">
      <p className="text-sm text-muted-foreground">
        {workspaceName} · {consoleRoleLabel(role)}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" name="name" defaultValue={name} autoComplete="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" name="email" type="email" defaultValue={email} autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" />
        <p className="text-xs text-muted-foreground">Required only when you set a new password.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="next-password">New password</Label>
        <Input id="next-password" name="nextPassword" type="password" autoComplete="new-password" />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
