"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearSessionCookie, setSessionCookie } from "@/server/auth/session";
import { prisma } from "@/server/db";

export type LoginState = { error: string | null };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const admin = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
  const matches = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
  if (!admin || !matches) {
    return { error: "Email or password is incorrect." };
  }
  await setSessionCookie(admin.id);
  redirect("/admin/feedback");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
