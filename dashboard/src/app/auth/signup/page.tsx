import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { getSession } from "@/lib/supabase/server";

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <Card className="shadow-xl border-border/60">
      <CardHeader>
        <CardTitle className="text-xl">Create your Nebula account</CardTitle>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Already onboard? <Link className="underline ml-1" href="/auth/login">Sign in</Link>.
      </CardFooter>
    </Card>
  );
}
