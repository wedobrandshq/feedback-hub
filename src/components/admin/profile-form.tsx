"use client";

import { useActionState, useLayoutEffect } from "react";
import { updateProfileAction, type ProfileState } from "@/app/(admin)/admin/(console)/settings/actions";
import { CONSOLE_ROLES, consoleRoleLabel } from "@/domain/console";
import { HatchPanel, hatchField, hatchPrimary, hatchSelect } from "@/components/admin/hatch";
import { restoreFields } from "@/components/admin/restore-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ProfileState = { error: null, saved: false, fields: null };

export function ProfileForm({
  name,
  email,
  role,
  workspaceName,
  canManage,
  onlyOwner,
}: {
  name: string;
  email: string;
  role: string;
  workspaceName: string;
  canManage: boolean;
  onlyOwner: boolean;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const fields = state.fields;
  useLayoutEffect(() => {
    if (!state.error || !fields) return;
    const form = document.getElementById("profile-form");
    if (!(form instanceof HTMLFormElement)) return;
    restoreFields(form, {
      workspaceName: fields.workspaceName,
      ...(fields.role ? { role: fields.role } : {}),
      name: fields.name,
      email: fields.email,
      currentPassword: fields.currentPassword,
      nextPassword: fields.nextPassword,
      passwordConfirm: fields.passwordConfirm,
    });
  }, [state.error, fields]);

  return (
    <div className="px-4 py-6 md:px-8">
      <HatchPanel className="max-w-md">
        <form id="profile-form" action={action} className="space-y-4 px-5 py-5">
          {canManage ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="workspace-name">Company</Label>
                <Input
                  id="workspace-name"
                  name="workspaceName"
                  defaultValue={fields?.workspaceName || workspaceName}
                  required
                  className={hatchField}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-role">Role</Label>
                <select
                  id="profile-role"
                  name="role"
                  defaultValue={fields?.role || role}
                  disabled={onlyOwner}
                  className={hatchSelect}
                >
                  {CONSOLE_ROLES.map((item) => (
                    <option key={item} value={item}>
                      {consoleRoleLabel(item)}
                    </option>
                  ))}
                </select>
                {onlyOwner ? (
                  <p className="text-xs text-[#5a5b70]">The workspace needs at least one owner.</p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5a5b70]">
              {workspaceName} · {consoleRoleLabel(role)}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" name="name" defaultValue={fields?.name ?? name} autoComplete="name" required className={hatchField} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" name="email" type="email" defaultValue={fields?.email ?? email} autoComplete="email" required className={hatchField} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              defaultValue={fields?.currentPassword ?? ""}
              className={hatchField}
            />
            <p className="text-xs text-[#5a5b70]">Required only when you set a new password.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next-password">New password</Label>
            <Input
              id="next-password"
              name="nextPassword"
              type="password"
              autoComplete="new-password"
              defaultValue={fields?.nextPassword ?? ""}
              className={hatchField}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-password-confirm">Retype password</Label>
            <Input
              id="profile-password-confirm"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              defaultValue={fields?.passwordConfirm ?? ""}
              className={hatchField}
            />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.saved ? <p className="text-sm text-[#5a5b70]">Saved.</p> : null}
          <Button type="submit" className={hatchPrimary} disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </HatchPanel>
    </div>
  );
}
