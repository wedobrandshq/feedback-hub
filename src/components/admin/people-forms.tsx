"use client";

import { useActionState } from "react";
import {
  addPersonAction,
  removePersonAction,
  setRoleAction,
  type PeopleState,
} from "@/app/(admin)/admin/(console)/people/actions";
import { CONSOLE_ROLES, consoleRoleLabel } from "@/domain/console";
import { hatchField, hatchPrimary, hatchSecondary, hatchSelect } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: PeopleState = { error: null, saved: false };

export function AddPersonForm() {
  const [state, action, pending] = useActionState(addPersonAction, initial);
  return (
    <form action={action} className="max-w-md space-y-4">
      <h2 className="text-lg font-extrabold tracking-[-0.03em] [font-family:var(--font-display)]">Add a person</h2>
      <div className="space-y-1.5">
        <Label htmlFor="person-name">Name</Label>
        <Input id="person-name" name="name" autoComplete="off" required className={hatchField} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="person-email">Email</Label>
        <Input id="person-email" name="email" type="email" autoComplete="off" required className={hatchField} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="person-password">Password</Label>
        <Input id="person-password" name="password" type="password" autoComplete="new-password" required className={hatchField} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="person-role">Role</Label>
        <select id="person-role" name="role" defaultValue="admin" className={hatchSelect}>
          {CONSOLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {consoleRoleLabel(role)}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="text-sm text-muted-foreground">Added.</p> : null}
      <Button type="submit" className={hatchPrimary} disabled={pending}>
        {pending ? "Adding…" : "Add person"}
      </Button>
    </form>
  );
}

export function PersonControls({
  personId,
  role,
  onlyOwner,
}: {
  personId: string;
  role: string;
  onlyOwner: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(setRoleAction, initial);
  const [removeState, removeAction, removePending] = useActionState(removePersonAction, initial);

  if (onlyOwner) {
    return <p className="text-sm text-muted-foreground">Only owner</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <form action={roleAction} className="flex items-center gap-2">
        <input type="hidden" name="personId" value={personId} />
        <label htmlFor={`role-${personId}`} className="sr-only">
          Role
        </label>
        <select id={`role-${personId}`} name="role" defaultValue={role} className={hatchSelect}>
          {CONSOLE_ROLES.map((item) => (
            <option key={item} value={item}>
              {consoleRoleLabel(item)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm" className={hatchSecondary} disabled={rolePending}>
          {rolePending ? "Saving…" : "Save role"}
        </Button>
      </form>
      <form action={removeAction}>
        <input type="hidden" name="personId" value={personId} />
        <Button type="submit" variant="outline" size="sm" className={hatchSecondary} disabled={removePending}>
          {removePending ? "Removing…" : "Remove"}
        </Button>
      </form>
      {roleState.error ? (
        <p className="text-sm text-destructive" role="alert">
          {roleState.error}
        </p>
      ) : null}
      {removeState.error ? (
        <p className="text-sm text-destructive" role="alert">
          {removeState.error}
        </p>
      ) : null}
    </div>
  );
}
