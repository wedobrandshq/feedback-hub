import { adminFontClassName } from "@/app/(admin)/admin/fonts";
import { NotesHome } from "@/components/demo/notes-home";

export const instant = false;

export const metadata = {
  title: "Notes",
  description: "A notes home drawn in the Feedie system.",
};

export default function Demo1Page() {
  return (
    <div className={`${adminFontClassName} min-h-full`}>
      <NotesHome />
    </div>
  );
}
