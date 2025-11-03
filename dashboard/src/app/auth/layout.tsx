import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nebula Cloud Control | Access",
  description: "Authenticate to access your Nebula cloud workspace.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-[1fr_1.1fr]">
      <section className="hidden md:flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white p-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Nebula Cloud Control</h1>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Spin up Azure resources, orchestrate CI/CD and manage team access with a console that keeps credits, compliance and automation in check.
          </p>
        </div>
        <footer className="text-xs text-white/50">
          &copy; {new Date().getFullYear()} Nebula Operations. All rights reserved.
        </footer>
      </section>

      <section className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in or create your Nebula account to orchestrate Azure resources.
            </p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
