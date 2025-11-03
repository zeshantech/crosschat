import { ThemeProvider } from "@/components/theme-provider";
import react from "react";
import { Toaster } from "sonner";

export const Provider = ({ children }: { children: react.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster  />
      {children}
    </ThemeProvider>
  );
};
