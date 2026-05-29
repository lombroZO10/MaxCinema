import { AuthPanel } from "@/components/auth/AuthPanel";
import { signUpAction } from "@/app/auth/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <AuthPanel action={signUpAction} error={error} mode="register" />;
}
