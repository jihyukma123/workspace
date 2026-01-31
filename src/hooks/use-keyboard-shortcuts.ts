import { useEffect, useCallback } from "react";

type TabType = "kanban" | "wiki" | "memo" | "issues" | "calendar";

interface KeyboardShortcutsOptions {
  onNewItem?: () => void;
  onTabChange?: (tab: TabType) => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

const TAB_MAP: Record<string, TabType> = {
  "1": "kanban",
  "2": "wiki",
  "3": "memo",
  "4": "issues",
  "5": "calendar",
};

export function useKeyboardShortcuts({
  onNewItem,
  onTabChange,
  onShowHelp,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cmd/Ctrl + N: New item
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewItem?.();
        return;
      }

      // Cmd/Ctrl + 1-5: Tab switch
      if ((e.metaKey || e.ctrlKey) && TAB_MAP[e.key]) {
        e.preventDefault();
        onTabChange?.(TAB_MAP[e.key]);
        return;
      }

      // Don't process other shortcuts while editing
      if (isEditable) return;

      // ? or Shift + /: Show help
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        onShowHelp?.();
        return;
      }
    },
    [enabled, onNewItem, onTabChange, onShowHelp],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { keys: ["⌘", "N"], description: "새 항목 생성 (Task/Issue/Wiki)" },
  { keys: ["⌘", "1"], description: "Kanban 탭" },
  { keys: ["⌘", "2"], description: "Wiki 탭" },
  { keys: ["⌘", "3"], description: "Memo 탭" },
  { keys: ["⌘", "4"], description: "Issues 탭" },
  { keys: ["⌘", "5"], description: "Calendar 탭" },
  { keys: ["?"], description: "단축키 도움말" },
];
