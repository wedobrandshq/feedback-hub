import { LoginForm } from "@/components/admin/login-form";
import { HatchPanel, hatchBody, hatchSticker, hatchTitle } from "@/components/admin/hatch";
import { seededAdminEmail, seededAdminPassword } from "@/domain/secrets";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const showLocalHint = process.env.NODE_ENV !== "production";

  return (
    <main className="flex min-h-full items-center justify-center bg-[#fffcf2] px-4 py-16 text-[#0e0e1a]">
      <HatchPanel className="w-full max-w-sm">
      <div className="px-6 py-8">
        <p className={hatchSticker}>Feedback Hub</p>
        <h1 className={`mt-4 ${hatchTitle}`}>Sign in to Healthy Steps</h1>
        <p className={`mt-3 ${hatchBody}`}>Admin access for the workspace that owns Willow and Earn It.</p>
        <LoginForm />
        {showLocalHint ? (
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Seeded owner: {seededAdminEmail()}
            <br />
            Password: {seededAdminPassword()}
          </p>
        ) : null}
      </div>
      </HatchPanel>
    </main>
  );
}
