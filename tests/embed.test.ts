import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/embed/session/route";
import { submitEmbedFeedback } from "@/app/embed/actions";
import { willowAppSecret } from "@/domain/secrets";
import { prisma } from "@/server/db";
import { issueEmbedSession, readEmbedActor } from "@/server/embed";
import { seedDatabase } from "@/server/seed";

const willowSecret = willowAppSecret();

async function clearProduct() {
  await prisma.notification.deleteMany();
  await prisma.changelogEntry.deleteMany();
  await prisma.requestUpdate.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.feedbackSuggestion.deleteMany();
  await prisma.requestSummary.deleteMany();
  await prisma.feedbackRequest.deleteMany();
  await prisma.request.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.feedbackAttachment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await seedDatabase();
});

beforeEach(async () => {
  await clearProduct();
});

afterAll(async () => {
  await clearProduct();
  await prisma.$disconnect();
});

describe("embed session", () => {
  it("identifies the host user and ignores a different user id on submit", async () => {
    const session = await issueEmbedSession({
      appSecret: willowSecret,
      externalUserId: "usr_maya_chen",
      email: "maya.chen@example.com",
      name: "Maya Chen",
    });
    expect(session).not.toContain(willowSecret);
    const actor = await readEmbedActor(session);

    const formData = new FormData();
    formData.set("session", session);
    formData.set("type", "idea");
    formData.set("body", "Please remember this came from the window.");
    formData.set("userId", "usr_someone_else");
    formData.set("externalUserId", "usr_someone_else");
    const result = await submitEmbedFeedback({ ok: true }, formData);
    expect(result).toEqual({ ok: true });

    const stored = await prisma.feedback.findFirstOrThrow({
      where: { body: "Please remember this came from the window." },
      include: { user: true },
    });
    expect(stored.userId).toBe(actor.id);
    expect(stored.user.externalUserId).toBe("usr_maya_chen");
    expect(await prisma.user.count({ where: { externalUserId: "usr_someone_else" } })).toBe(0);
  });

  it("rejects a session whose user id was edited", async () => {
    const session = await issueEmbedSession({
      appSecret: willowSecret,
      externalUserId: "usr_maya_chen",
      name: "Maya Chen",
    });
    const [header, body, signature] = session.split(".");
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as { sub: string };
    payload.sub = "usr_someone_else";
    const edited = `${header}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${signature}`;
    await expect(readEmbedActor(edited)).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("returns only a session from the identify call", async () => {
    const denied = await POST(
      new Request("http://localhost/api/embed/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "usr_maya_chen" }),
      }),
    );
    expect(denied.status).toBe(401);

    const response = await POST(
      new Request("http://localhost/api/embed/session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${willowSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "usr_maya_chen",
          email: "maya.chen@example.com",
          name: "Maya Chen",
          plan: "Plus",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const json = (await response.json()) as { session?: string; error?: string };
    expect(json.error).toBeUndefined();
    expect(typeof json.session).toBe("string");
    expect(JSON.stringify(json)).not.toContain(willowSecret);
    const actor = await readEmbedActor(json.session ?? "");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: actor.id } });
    expect(user.externalUserId).toBe("usr_maya_chen");
    expect(user.name).toBe("Maya Chen");
  });
});
