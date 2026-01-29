import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { ReminderDock } from "@/components/ReminderDock";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className={cn("flex h-screen w-full bg-background")}>
      <AppSidebar />
      <div className={cn("flex flex-1 min-h-0 flex-col lg:flex-row lg:overflow-hidden")}>
        <main className={cn("flex flex-1 min-h-0 flex-col lg:overflow-hidden")}>
          {children}
        </main>
      </div>
      <ReminderDock />
    </div>
  );
}
