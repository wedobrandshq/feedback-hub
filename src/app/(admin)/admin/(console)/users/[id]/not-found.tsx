import { EmptyState } from "@/components/admin/empty-state";

export default function UserNotFound() {
  return <EmptyState title="User was not found" description="That person is not in this workspace." />;
}
