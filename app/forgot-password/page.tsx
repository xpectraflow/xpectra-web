import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return <ForgotPasswordForm />;
}
