import { redirect } from "next/navigation";

export default function LegacyNewMoviePage() {
  redirect("/admin/content/new");
}
