import { AddPersonForm, PersonControls } from "@/components/admin/people-forms";
import { PageHeader } from "@/components/admin/page-header";
import { consoleRoleLabel } from "@/domain/console";
import { requireAdmin } from "@/server/auth/admin";
import { listConsolePeople } from "@/server/console-people";

export const instant = false;

export const metadata = { title: "People" };

export default async function PeoplePage() {
  const admin = await requireAdmin();
  const people = await listConsolePeople(admin.workspaceId);
  const ownerCount = people.filter((person) => person.role === "owner").length;
  const owner = admin.role === "owner";

  return (
    <>
      <PageHeader
        title="People"
        description={
          owner
            ? "Console access for this workspace. The workspace always keeps one Owner."
            : "People who can sign in to this console. An Admin can edit their own profile from Settings."
        }
      />
      <div className="space-y-10 px-4 py-6 md:px-6">
        <ul className="divide-y divide-border">
          {people.map((person) => (
            <li key={person.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" data-person={person.email}>
              <div>
                <p className="text-sm font-medium">{person.name}</p>
                <p className="text-sm text-muted-foreground">
                  {person.email} · {consoleRoleLabel(person.role)}
                </p>
              </div>
              {owner ? (
                <PersonControls
                  personId={person.id}
                  role={person.role}
                  onlyOwner={person.role === "owner" && ownerCount <= 1}
                />
              ) : null}
            </li>
          ))}
        </ul>
        {owner ? <AddPersonForm /> : null}
      </div>
    </>
  );
}
