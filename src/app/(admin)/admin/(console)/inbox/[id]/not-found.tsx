import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function ConversationNotFound() {
  return (
    <EmptyState
      title="Conversation not found"
      description="This conversation is not in the workspace."
      action={
        <Link href="/admin/inbox" className={buttonVariants({ variant: "outline" })}>
          Back to inbox
        </Link>
      }
    />
  );
}
