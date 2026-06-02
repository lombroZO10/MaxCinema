import { redirect } from "next/navigation";

export default function LegacyAdminMoviesPage() {
  redirect("/admin/content/movies");
}
