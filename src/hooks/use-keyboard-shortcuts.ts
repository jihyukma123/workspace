import { useEffect, useCallback } from "react";

interface KeyboardShortcutsOptions {
  onNewItem?: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNewItem,
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

      // Don't process other shortcuts while editing
      if (isEditable) return;

      // ? or Shift + /: Show help
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        onShowHelp?.();
        return;
      }
    },
    [enabled, onNewItem, onShowHelp],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export const KEYBOARD_SHORTCUTS = [
  { keys: ["⌘", "N"], description: "새 항목 생성 (Task/Issue/Wiki)" },
  { keys: ["⌘", "1"], description: "상단 메뉴 1번 (Kanban)" },
  { keys: ["⌘", "2"], description: "상단 메뉴 2번 (Wiki)" },
  { keys: ["⌘", "3"], description: "상단 메뉴 3번 (Memo)" },
  { keys: ["⌘", "4"], description: "상단 메뉴 4번 (Issues)" },
  { keys: ["⌘", "5"], description: "상단 메뉴 5번 (Calendar)" },
  { keys: ["⌘", "6"], description: "상단 메뉴 6번 (Trash)" },
  { keys: ["?"], description: "단축키 도움말" },
];
