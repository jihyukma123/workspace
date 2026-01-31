import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { KEYBOARD_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("bg-popover border-border max-w-md")}>
        <DialogHeader>
          <DialogTitle
            className={cn("font-mono text-lg font-bold text-primary")}
          >
            키보드 단축키
          </DialogTitle>
        </DialogHeader>
        <div className={cn("space-y-3 pt-2")}>
          {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between py-2 px-3",
                "rounded-lg bg-muted/30",
                "transition-all duration-200 hover:bg-muted/50",
              )}
            >
              <span className={cn("text-sm text-foreground")}>
                {shortcut.description}
              </span>
              <div className={cn("flex items-center gap-1")}>
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className={cn(
                      "min-w-[24px] h-6 px-2",
                      "flex items-center justify-center",
                      "rounded border border-border bg-background",
                      "text-xs font-mono text-muted-foreground",
                      "shadow-sm",
                    )}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className={cn("text-xs text-muted-foreground text-center pt-2")}>
          Press <kbd className="px-1 py-0.5 rounded border text-xs">?</kbd>{" "}
          anytime to show this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
