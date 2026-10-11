import { adminFontClassName } from "@/app/(admin)/admin/fonts";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${adminFontClassName} min-h-full`}>{children}</div>;
}
