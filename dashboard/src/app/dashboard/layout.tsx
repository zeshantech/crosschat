import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardSidebar } from "@/components/dashboard/layout/sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
   <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
       <DashboardHeader />
       <Separator />
         <main className="flex flex-1 flex-col gap-4 p-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}