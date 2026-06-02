import { MemberStudio } from "@/components/admin/users/MemberStudio";
import { getAdminUserIndex } from "@/services/admin/admin-user-service";

export default async function AdminUsersPage() {
  const index = await getAdminUserIndex();
  return <MemberStudio index={index} />;
}
