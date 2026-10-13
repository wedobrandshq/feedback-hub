"use client";

import { useActionState, useLayoutEffect, useState } from "react";
import {
  addPersonAction,
  removePersonAction,
  setRoleAction,
  type PeopleState,
} from "@/app/(admin)/admin/(console)/people/actions";
import { CONSOLE_ROLES, consoleRoleLabel } from "@/domain/console";
import { Disclose } from "@/components/admin/disclose";
import { restoreFields } from "@/components/admin/restore-fields";
import { hatchField, hatchPrimary, hatchSecondary, hatchSelect } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: PeopleState = { error: null, saved: false, fields: null };

export function AddPersonForm({ apps }: { apps: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addPersonAction, initial);
  const [open, setOpen] = useState(false);
  const fields = state.fields;
  useLayoutEffect(() => {
    if (!state.error || !fields) return;
    const form = document.getElementById("add-person-form");
    if (form instanceof HTMLFormElement) {
      restoreFields(form, {
        name: fields.name,
        email: fields.email,
        password: fields.password,
        passwordConfirm: fields.passwordConfirm,
        role: fields.role,
        appIds: fields.appIds,
      });
    }
  }, [state.error, fields]);
  return (
    <div className="max-w-md">
      <Button
        type="button"
        className={hatchPrimary}
        aria-expanded={open}
        aria-controls="add-person-form"
        onClick={() => setOpen((current) => !current)}
      >
        Add person
      </Button>
      <Disclose open={open}>
        <form id="add-person-form" action={action} className="space-y-4 pt-4">
          <h2 className="text-lg font-extrabold tracking-[-0.03em] [font-family:var(--font-display)]">Add a person</h2>
          <div className="space-y-1.5">
            <Label htmlFor="person-name">Name</Label>
            <Input id="person-name" name="name" autoComplete="off" required defaultValue={fields?.name ?? ""} className={hatchField} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-email">Email</Label>
            <Input id="person-email" name="email" type="email" autoComplete="off" required defaultValue={fields?.email ?? ""} className={hatchField} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-password">Password</Label>
            <Input id="person-password" name="password" type="password" autoComplete="new-password" required defaultValue={fields?.password ?? ""} className={hatchField} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-password-confirm">Retype password</Label>
            <Input
              id="person-password-confirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              required
              defaultValue={fields?.passwordConfirm ?? ""}
              className={hatchField}
            />
          </div>
          <div className="space-y-2">
            <Label>Apps</Label>
            <div className="space-y-2">
              {apps.map((app) => (
                <label key={app.id} className="flex cursor-pointer items-center gap-2.5 text-sm font-normal leading-6 text-[#0e0e1a]">
                  <span className="relative grid size-5 shrink-0 place-items-center">
                    <input
                      type="checkbox"
                      name="appIds"
                      value={app.id}
                      defaultChecked={fields?.appIds.includes(app.id) ?? false}
                      className="peer col-start-1 row-start-1 size-5 appearance-none rounded-md border-2 border-[#0e0e1a] bg-white checked:bg-[#c6ff4f] focus-visible:shadow-[3px_3px_0_#0e0e1a] focus-visible:outline-none"
                    />
                    <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none col-start-1 row-start-1 hidden size-3.5 peer-checked:block">
                      <path d="M3.2 8.2 6.4 11.2 12.8 4.6" fill="none" stroke="#0e0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {app.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="person-role">Role</Label>
            <select id="person-role" name="role" defaultValue={fields?.role || "admin"} className={`${hatchSelect} w-full`}>
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
            {pending ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </Disclose>
    </div>
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
