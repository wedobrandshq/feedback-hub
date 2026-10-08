import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function FeedbackNotFound() {
  return (
    <EmptyState
      title="Feedback not found"
      description="This message doesn’t exist in the workspace, or it is no longer available."
      action={
        <Link href="/admin/feedback" className={buttonVariants({ variant: "outline" })}>
          Back to feedback
        </Link>
      }
    />
  );
}
