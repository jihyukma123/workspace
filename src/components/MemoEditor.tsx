import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StickyNote,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { AppInput } from "@/components/ui/app-input";
import { Button, buttonVariants } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { BlockEditor } from "@/components/editor/BlockEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { createEmptyWorkspaceDocument } from "@/lib/editor/documentSchema";
import { toast } from "@/hooks/use-toast";

export function MemoEditor() {
  const {
    selectedProjectId,
    memos,
    selectedMemoId,
    setSelectedMemoId,
    setSelectedProject,
    addMemo,
    updateMemoDraft,
    saveMemo,
    deleteMemo,
  } = useWorkspaceStore();

  const projectMemos = useMemo(
    () => memos.filter((memo) => memo.projectId === selectedProjectId),
    [memos, selectedProjectId],
  );

  const activeMemo =
    projectMemos.find((memo) => memo.id === selectedMemoId) ?? null;
  const activeMemoId = activeMemo?.id ?? null;
  const [isMemoSubmitting, setIsMemoSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const memoSubmitLock = useRef(false);
  const toggleShortcutLabel = "⌘B";

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((previous) => !previous);
  }, []);

  useEffect(() => {
    const handleShortcut = () => {
      if (!selectedProjectId || memoSubmitLock.current) return;
      handleAddMemoRef.current?.();
    };
    window.addEventListener("shortcut:new-memo", handleShortcut);
    return () =>
      window.removeEventListener("shortcut:new-memo", handleShortcut);
  }, [selectedProjectId]);

  useEffect(() => {
    setIsDeleteDialogOpen(false);
  }, [selectedMemoId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey || event.key !== "Backspace") {
        return;
      }
      if (event.repeat) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        !!target &&
        (target.isContentEditable ||
          !!target.closest(
            'input, textarea, select, [contenteditable="true"], [role="textbox"]',
          ));
      if (isEditableTarget) {
        return;
      }

      if (!activeMemoId) {
        return;
      }

      event.preventDefault();
      setIsDeleteDialogOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMemoId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }
      if (event.repeat || event.key.toLowerCase() !== "b") {
        return;
      }

      event.preventDefault();
      handleToggleSidebar();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleSidebar]);

  const handleAddMemoRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }
    if (!projectMemos.length) {
      if (selectedMemoId !== null) {
        setSelectedMemoId(null);
      }
      return;
    }
    if (!activeMemo) {
      setSelectedMemoId(projectMemos[0].id);
    }
  }, [
    activeMemo,
    projectMemos,
    selectedMemoId,
    selectedProjectId,
    setSelectedMemoId,
  ]);

  useEffect(() => {
    if (
      !activeMemo ||
      activeMemo.status !== "unsaved" ||
      !activeMemo.title.trim()
    ) {
      return;
    }
    const timer = setTimeout(() => {
      void saveMemo(activeMemo.id, {
        title: activeMemo.title,
        document: activeMemo.document,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeMemo, saveMemo]);

  const formatTime = (date: Date | null) => {
    if (!date) {
      return "—";
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const statusCopy = !activeMemo
    ? "No memo selected"
    : activeMemo.status === "saved"
      ? "All changes saved"
      : activeMemo.status === "saving"
        ? "Saving changes..."
        : "Unsaved changes";

  const statusDotClass = cn(
    "w-2 h-2 rounded-full transition-all duration-200",
    activeMemo?.status === "saved" && "bg-status-done",
    activeMemo?.status === "saving" && "bg-status-progress animate-pulse",
    activeMemo?.status === "unsaved" && "bg-status-todo",
    !activeMemo && "bg-muted",
  );

  const handleAddMemo = async () => {
    if (!selectedProjectId) {
      return;
    }
    if (memoSubmitLock.current) {
      return;
    }
    memoSubmitLock.current = true;
    const now = new Date();
    setIsMemoSubmitting(true);
    try {
      const created = await addMemo({
        id: `memo-${now.getTime()}`,
        projectId: selectedProjectId,
        title: "Untitled Memo",
        document: createEmptyWorkspaceDocument(),
        contentText: "",
        createdAt: now,
        updatedAt: null,
        status: "unsaved",
      });
      if (!created) {
        return;
      }
    } finally {
      setIsMemoSubmitting(false);
      memoSubmitLock.current = false;
    }
  };

  handleAddMemoRef.current = handleAddMemo;

  const handleSelectMemo = (memoId: string) => {
    setSelectedMemoId(memoId);
  };

  const handleDelete = async () => {
    if (!activeMemo) {
      return;
    }
    const memoId = activeMemo.id;
    const memoTitle = activeMemo.title;
    const projectId = activeMemo.projectId ?? selectedProjectId;
    const deleted = await deleteMemo(memoId);
    if (!deleted) {
      return;
    }

    toast({
      title: "Moved to Trash",
      description: "This memo can be restored from Trash for 30 days.",
      action: (
        <ToastAction
          altText="Undo"
          onClick={async () => {
            const trash = window.workspaceApi?.trash;
            if (!trash || !projectId) {
              return;
            }
            const restored = await trash.restore({ type: "memo", id: memoId });
            if (restored.ok === false) {
              toast({
                title: "Undo failed",
                description: restored.error.message,
                variant: "destructive",
              });
              return;
            }
            await setSelectedProject(projectId);
            setSelectedMemoId(memoId);
            toast({
              title: "Restored",
              description: memoTitle ? `"${memoTitle}" restored.` : "Memo restored.",
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  return (
    <div
      className={cn(
        "flex-1 flex p-6 h-full min-h-0 transition-[gap] duration-200",
        isSidebarOpen ? "gap-6" : "gap-0",
      )}
    >
      <div
        className={cn(
          "shrink-0 overflow-hidden transition-all duration-200 ease-out",
          isSidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none",
        )}
      >
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-mono text-lg font-bold text-primary">Memos</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAddMemo}
                disabled={!selectedProjectId || isMemoSubmitting}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSidebar}
                className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground"
                title={`Hide memo panel (${toggleShortcutLabel})`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {toggleShortcutLabel}
                </span>
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {projectMemos.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No memos yet. Create one to start capturing notes.
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {projectMemos.map((memo) => {
                  const isActive = memo.id === activeMemo?.id;
                  return (
                    <Button
                      key={memo.id}
                      type="button"
                      onClick={() => handleSelectMemo(memo.id)}
                      className={cn(
                        "w-full h-auto items-start justify-start text-left rounded-lg px-3 py-2 transition-all duration-200",
                        isActive
                          ? "border-primary bg-accent/20"
                          : "border-border bg-background hover:bg-accent/30",
                      )}
                      variant="outline"
                      size="sm"
                    >
                      <div className="w-full space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-sm text-foreground line-clamp-1">
                            {memo.title || "Untitled Memo"}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatTime(memo.updatedAt ?? memo.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-mono">
                            {memo.status === "saved"
                              ? "Saved"
                              : memo.status === "saving"
                                ? "Saving"
                                : "Unsaved"}
                          </span>
                          <span className="line-clamp-1">
                            {memo.updatedAt ? "Updated" : "Created"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {memo.contentText || "No content yet"}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!isSidebarOpen && (
          <div className="mb-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleSidebar}
              className="gap-2"
              title={`Show memo panel (${toggleShortcutLabel})`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>Show Panel</span>
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {toggleShortcutLabel}
              </span>
            </Button>
          </div>
        )}

        {activeMemo ? (
          <>
            <div className={cn("mb-4 lg:mb-2 rounded-lg border border-border bg-card/50")}>
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <StickyNote className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <AppInput
                      value={activeMemo.title}
                      onChange={(event) =>
                        updateMemoDraft(activeMemo.id, {
                          title: event.target.value,
                        })
                      }
                      placeholder="Memo title"
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">
                      Capture your thoughts instantly
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      Last saved:{" "}
                      {formatTime(activeMemo.updatedAt ?? activeMemo.createdAt)}
                    </span>
                    <span className={statusDotClass} />
                    <span>{statusCopy}</span>
                  </div>
                  <AlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        aria-label="Move memo to Trash"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      defaultAction="action"
                      className="bg-popover border-border"
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Move this memo to Trash?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          You can restore it from Trash for 30 days.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className={buttonVariants({ variant: "destructive" })}
                        >
                          Move to Trash
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex-1 min-h-0 rounded-lg border border-border bg-card lg:shadow-sm",
                "lg:min-h-[560px]",
              )}
            >
              <div className="flex h-full flex-col p-4">
                <div className="relative flex-1 min-h-0 rounded-md border border-border bg-input overflow-hidden">
                  <BlockEditor
                    key={activeMemo.id}
                    value={activeMemo.document}
                    editable
                    autofocus
                    className="h-full text-sm [&_.ProseMirror_p:first-child]:mt-0 [&_.ProseMirror_p:last-child]:mb-0"
                    onChange={(document) =>
                      updateMemoDraft(activeMemo.id, { document })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 lg:mt-2 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">TIP:</span> Blocks
                auto-save after 2 seconds of inactivity. Markdown shortcuts like
                headings, lists, quotes, task items, and code fences are supported.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <StickyNote className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-mono text-lg font-bold text-primary mb-2">
                Your Memos
              </h3>
              <p className="text-sm mb-4">
                Capture loose notes, postmortems, and structured retros in block form.
              </p>
              <Button
                onClick={handleAddMemo}
                variant="primary"
                disabled={!selectedProjectId || isMemoSubmitting}
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Memo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
