import { AddPersonForm, PersonControls } from "@/components/admin/people-forms";
import { HatchPanel, hatchRowTitle } from "@/components/admin/hatch";
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
        kicker="Access"
        title="People"
        description={
          owner
            ? "Console access for this workspace. The workspace always keeps one Owner."
            : "People who can sign in to this console. An Admin can edit their own profile from Settings."
        }
      />
      <div className="space-y-8 px-4 py-6 md:px-8">
        <HatchPanel>
        <ul>
          {people.map((person) => (
            <li key={person.id} className="flex flex-col gap-3 border-b border-[#0e0e1a]/15 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" data-person={person.email}>
              <div>
                <p className={hatchRowTitle}>{person.name}</p>
                <p className="text-sm text-[#5a5b70]">
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
        </HatchPanel>
        {owner ? (
          <HatchPanel>
            <div className="px-5 py-5">
              <AddPersonForm />
            </div>
          </HatchPanel>
        ) : null}
      </div>
    </>
  );
}
