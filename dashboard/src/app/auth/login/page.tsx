import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/supabase/server";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <Card className="shadow-xl border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-2 text-sm text-muted-foreground">
        <p>
          Forgot your password? <Link className="underline" href="/auth/reset-password">Reset it</Link>.
        </p>
        <p>
          New to Nebula? <Link className="underline" href="/auth/signup">Create an account</Link>.
        </p>
      </CardFooter>
    </Card>
  );
}
