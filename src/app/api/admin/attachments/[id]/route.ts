import { NextResponse } from "next/server";
import { getAttachmentForAdmin } from "@/server/feedback-queries";
import { readAttachment } from "@/server/attachments";
import { prisma } from "@/server/db";
import { readSessionAdminId } from "@/server/auth/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const adminId = await readSessionAdminId();
  if (!adminId) return new NextResponse("Unauthorized", { status: 401 });

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { workspaceId: true },
  });
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await context.params;
  const attachment = await getAttachmentForAdmin({
    workspaceId: admin.workspaceId,
    attachmentId: id,
  });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await readAttachment(attachment.storageKey);
    const fileName = attachment.fileName.replace(/["\r\n]/g, "");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": attachment.contentType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
