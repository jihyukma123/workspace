import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Bell, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { ReminderPanelContent } from "@/components/ReminderPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function ReminderDock() {
  const location = useLocation();
  const { reminders, selectedProjectId } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const hasIncompleteReminders = useMemo(() => {
    if (!selectedProjectId) {
      return false;
    }
    return reminders.some(
      (reminder) => reminder.projectId === selectedProjectId && reminder.status !== "done",
    );
  }, [reminders, selectedProjectId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg",
            "transition-all duration-200",
          )}
          aria-label="Open reminders"
        >
          <Bell className={cn("h-5 w-5")} />
          {hasIncompleteReminders ? (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive",
                "ring-2 ring-background",
              )}
            />
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className={cn("bg-transparent")} />
        <DialogPrimitive.Content
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-[360px] max-w-[calc(100vw-3rem)]",
            "max-h-[calc(100vh-6rem)]",
            "rounded-lg border border-border bg-background text-foreground shadow-lg",
            "overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-all duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("absolute right-3 top-3 h-8 w-8")}
              aria-label="Close reminders"
            >
              <X className={cn("h-4 w-4")} />
            </Button>
          </DialogClose>
          <ReminderPanelContent />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
