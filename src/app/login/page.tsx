import { AuthPanel } from "@/components/auth/AuthPanel";
import { signInAction } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <AuthPanel action={signInAction} error={error} mode="login" />;
}
