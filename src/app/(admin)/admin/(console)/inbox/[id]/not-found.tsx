import Link from "next/link";
import { hatchSecondary } from "@/components/admin/hatch";
import { EmptyState } from "@/components/admin/empty-state";

export default function ConversationNotFound() {
  return (
    <EmptyState
      title="Conversation not found"
      description="This conversation is not in the workspace."
      action={
        <Link href="/admin/inbox" className={hatchSecondary}>
          Back to inbox
        </Link>
      }
    />
  );
}
