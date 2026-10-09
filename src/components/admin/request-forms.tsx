"use client";

import { useActionState } from "react";
import {
  changelogAction,
  changeStatusAction,
  createRequestAction,
  linkFeedbackAction,
  publishRequestAction,
  publishUpdateAction,
  unlinkFeedbackAction,
  type ActionState,
} from "@/app/(admin)/admin/(console)/requests/actions";
import { ADMIN_ROADMAP_STATUSES, REQUEST_STATUSES, REQUEST_STATUS_LABELS, type RequestStatusName } from "@/domain/request";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initial: ActionState = { error: null };

export function CreateRequestForm({ feedbackId }: { feedbackId: string }) {
  const [state, action, pending] = useActionState(createRequestAction, initial);
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <input type="hidden" name="visibility" value="private" />
      <div className="space-y-1.5">
        <label htmlFor="request-title" className="text-sm font-medium">Title</label>
        <Input id="request-title" name="title" required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="request-description" className="text-sm font-medium">Description</label>
        <Textarea id="request-description" name="description" className="min-h-24" required />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="request-status" className="text-sm font-medium">Initial status</label>
        <select id="request-status" name="status" defaultValue="review" className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
          {REQUEST_STATUSES.map((status) => (
            <option key={status} value={status}>{REQUEST_STATUS_LABELS[status]}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-muted-foreground">Visibility starts private. Creating this request does not publish it.</p>
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create request"}</Button>
    </form>
  );
}

export function LinkRequestForm({
  feedbackId,
  matches,
}: {
  feedbackId: string;
  matches: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(linkFeedbackAction, initial);
  return (
    <div className="mt-6 space-y-3">
      <form className="flex gap-2" method="get">
        <Input name="request" placeholder="Search requests" aria-label="Search requests" />
        <Button type="submit" variant="outline">Search</Button>
      </form>
      {matches.length > 0 ? (
        <ul className="space-y-2">
          {matches.map((match) => (
            <li key={match.id}>
              <form action={action} className="flex items-center justify-between gap-3">
                <input type="hidden" name="feedbackId" value={feedbackId} />
                <input type="hidden" name="requestId" value={match.id} />
                <span className="text-sm">{match.title}</span>
                <Button type="submit" variant="outline" disabled={pending}>Link</Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
    </div>
  );
}

export function UnlinkRequestForm({ feedbackId }: { feedbackId: string }) {
  const [state, action, pending] = useActionState(unlinkFeedbackAction, initial);
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="feedbackId" value={feedbackId} />
      {state.error ? <p className="mb-2 text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Unlinking…" : "Unlink"}</Button>
    </form>
  );
}

export function PublishRequestForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(publishRequestAction, initial);
  return (
    <form action={action}>
      <input type="hidden" name="requestId" value={requestId} />
      {state.error ? <p className="mb-2 text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Publishing…" : "Publish"}</Button>
    </form>
  );
}

export function StatusForm({ requestId, status }: { requestId: string; status: RequestStatusName }) {
  const [state, action, pending] = useActionState(changeStatusAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <label htmlFor="status-next" className="text-sm font-medium">Status</label>
      <select id="status-next" name="status" defaultValue={status} className="mt-1.5 h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
        {REQUEST_STATUSES.map((item) => (
          <option key={item} value={item}>{REQUEST_STATUS_LABELS[item]}</option>
        ))}
      </select>
      <fieldset className="space-y-1 text-sm">
        <legend>Notify interested users?</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="notify" value="no" defaultChecked />
          Don’t notify
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="notify" value="yes" />
          Notify in the app
        </label>
      </fieldset>
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save status"}</Button>
    </form>
  );
}

export function RoadmapMoveForm({ requestId, status }: { requestId: string; status: RequestStatusName }) {
  const [state, action, pending] = useActionState(changeStatusAction, initial);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <div>
        <label htmlFor={`move-${requestId}`} className="text-xs text-muted-foreground">Status</label>
        <select
          id={`move-${requestId}`}
          name="status"
          defaultValue={status}
          className="mt-1 block h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          {ADMIN_ROADMAP_STATUSES.map((item) => (
            <option key={item} value={item}>{REQUEST_STATUS_LABELS[item]}</option>
          ))}
        </select>
      </div>
      <fieldset className="space-y-1 text-sm">
        <legend>Notify interested users?</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="notify" value="no" defaultChecked />
          Don’t notify
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="notify" value="yes" />
          Notify in the app
        </label>
      </fieldset>
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Moving…" : "Move"}</Button>
      {state.error ? <p className="w-full text-sm text-destructive" role="alert">{state.error}</p> : null}
    </form>
  );
}

export function UpdateForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(publishUpdateAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <label htmlFor="update-body" className="text-sm font-medium">Update</label>
      <Textarea id="update-body" name="body" className="min-h-24" placeholder="What should interested people know?" />
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Publishing…" : "Publish update"}</Button>
    </form>
  );
}

export function ChangelogForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(changelogAction, initial);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="requestId" value={requestId} />
      <label htmlFor="changelog-body" className="text-sm font-medium">Changelog</label>
      <Textarea id="changelog-body" name="body" className="min-h-20" placeholder="What was released?" />
      {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "Adding…" : "Add changelog entry"}</Button>
    </form>
  );
}
