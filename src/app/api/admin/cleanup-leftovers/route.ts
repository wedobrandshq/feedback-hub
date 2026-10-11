import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { removeVerificationLeftovers } from "@/server/cleanup-leftovers";

export const instant = false;

export async function POST() {
  const admin = await requireAdmin();
  if (admin.role !== "owner" || admin.email !== "owner@healthysteps.example") {
    return Response.json({ error: "Only the owner can do that." }, { status: 401 });
  }
  try {
    const result = await removeVerificationLeftovers(admin.workspaceId);
    return Response.json(result);
  } catch (error) {
    if (error instanceof DomainError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
