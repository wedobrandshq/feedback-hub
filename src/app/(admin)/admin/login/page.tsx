import { LoginForm } from "@/components/admin/login-form";
import { seededAdminEmail, seededAdminPassword } from "@/domain/secrets";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const showLocalHint = process.env.NODE_ENV !== "production";

  return (
    <main className="flex min-h-full items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">Feedback Hub</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in to Healthy Steps</h1>
        <p className="mt-2 text-sm text-muted-foreground">Admin access for the workspace that owns Willow and Earn It.</p>
        <LoginForm />
        {showLocalHint ? (
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Seeded owner: {seededAdminEmail()}
            <br />
            Password: {seededAdminPassword()}
          </p>
        ) : null}
      </div>
    </main>
  );
}
