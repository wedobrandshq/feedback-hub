import { LoginForm } from "@/components/admin/login-form";
import { HatchPanel, hatchBody, hatchSticker, hatchTitle } from "@/components/admin/hatch";
import { WORKSPACE_NAME } from "@/domain/config";
import { seededAdminEmail, seededAdminPassword } from "@/domain/secrets";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const showLocalHint = process.env.NODE_ENV !== "production";

  return (
    <main className="flex min-h-dvh flex-col bg-white p-3 text-[#0e0e1a] md:p-5">
      <div className="flex min-h-[calc(100dvh-1.5rem)] flex-1 flex-col rounded-[32px] border-2 border-[#0e0e1a] bg-[#fffcf2] md:min-h-[calc(100dvh-2.5rem)]">
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <HatchPanel className="w-full max-w-sm">
            <div className="px-6 py-8">
              <p className={hatchSticker}>Feedback Hub</p>
              <h1 className={`mt-4 ${hatchTitle}`}>Sign in to {WORKSPACE_NAME}</h1>
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
        </div>
        <footer className="mt-auto px-5 pt-10 pb-5 md:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t-2 border-[#0e0e1a] pt-4">
            <p className="text-sm font-medium text-[#0e0e1a]">Feedie</p>
            <p className="text-sm text-[#5a5b70]">{WORKSPACE_NAME}</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
