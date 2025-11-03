import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

export default async function AuthCallbackPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  redirect("/auth/login?message=signin_failed");
}
