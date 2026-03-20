import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit2,
  Save,
  X,
  Trash2,
  Clock,
  GripVertical,
  FolderPlus,
  Home,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppInput } from "@/components/ui/app-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createEmptyWorkspaceDocument } from "@/lib/editor/documentSchema";
import { WikiPage } from "@/types/workspace";
import { toast } from "@/hooks/use-toast";

interface WikiTreeNode extends WikiPage {
  children: WikiTreeNode[];
  depth: number;
}

type WikiPageSnapshot = Pick<
  WikiPage,
  "id" | "title" | "document" | "contentText" | "updatedAt" | "status"
>;

function buildWikiTree(pages: WikiPage[]): WikiTreeNode[] {
  const pageMap = new Map<string, WikiTreeNode>();
  const rootNodes: WikiTreeNode[] = [];

  const sortedPages = [...pages].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  sortedPages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [], depth: 0 });
  });

  sortedPages.forEach((page) => {
    const node = pageMap.get(page.id)!;
    if (page.parentId && pageMap.has(page.parentId)) {
      const parent = pageMap.get(page.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  const updateDepths = (nodes: WikiTreeNode[], depth: number) => {
    nodes.forEach((node) => {
      node.depth = depth;
      updateDepths(node.children, depth + 1);
    });
  };
  updateDepths(rootNodes, 0);

  return rootNodes;
}

function getBreadcrumbPath(pageId: string, pages: WikiPage[]): WikiPage[] {
  const path: WikiPage[] = [];
  const pageMap = new Map(pages.map((page) => [page.id, page]));

  let currentId: string | null = pageId;
  while (currentId) {
    const page = pageMap.get(currentId);
    if (page) {
      path.unshift(page);
      currentId = page.parentId;
    } else {
      break;
    }
  }

  return path;
}

function getDescendantIds(pageId: string, pages: WikiPage[]): Set<string> {
  const descendants = new Set<string>();
  const findDescendants = (id: string) => {
    pages.forEach((page) => {
      if (page.parentId === id) {
        descendants.add(page.id);
        findDescendants(page.id);
      }
    });
  };
  findDescendants(pageId);
  return descendants;
}

interface WikiTreeItemProps {
  node: WikiTreeNode;
  selectedPageId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDragStart: (event: React.DragEvent, node: WikiTreeNode) => void;
  onDragOver: (event: React.DragEvent, node: WikiTreeNode) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent, node: WikiTreeNode) => void;
  dragOverId: string | null;
  dropPosition: "before" | "inside" | "after" | null;
}

function WikiTreeItem({
  node,
  selectedPageId,
  expandedIds,
  onSelect,
  onToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverId,
  dropPosition,
}: WikiTreeItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedPageId === node.id;
  const isDragOver = dragOverId === node.id;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 border border-transparent",
          isSelected ? "hover:bg-transparent" : "hover:bg-accent/30",
          isDragOver &&
            dropPosition === "before" &&
            "border-t-2 border-t-primary",
          isDragOver &&
            dropPosition === "after" &&
            "border-b-2 border-b-primary",
          isDragOver &&
            dropPosition === "inside" &&
            "bg-primary/20 border-primary",
        )}
        style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
        draggable
        onDragStart={(event) => onDragStart(event, node)}
        onDragOver={(event) => onDragOver(event, node)}
        onDragLeave={onDragLeave}
        onDrop={(event) => onDrop(event, node)}
        onClick={() => onSelect(node.id)}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

        {hasChildren ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        <FileText
          className={cn(
            "w-4 h-4 shrink-0",
            isSelected ? "text-foreground/70" : "text-muted-foreground",
          )}
        />
        <span
          className={cn(
            "truncate text-sm flex-1",
            isSelected ? "text-foreground font-semibold" : "text-foreground/80",
          )}
        >
          {node.title}
        </span>

        {isSelected && (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <WikiTreeItem
              key={child.id}
              node={child}
              selectedPageId={selectedPageId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              dragOverId={dragOverId}
              dropPosition={dropPosition}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BreadcrumbProps {
  path: WikiPage[];
  onNavigate: (pageId: string | null) => void;
}

function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="w-3 h-3" />
        <span>Wiki</span>
      </button>
      {path.map((page, index) => (
        <div key={page.id} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3" />
          {index === path.length - 1 ? (
            <span className="text-foreground font-medium">{page.title}</span>
          ) : (
            <button
              onClick={() => onNavigate(page.id)}
              className="hover:text-foreground transition-colors"
            >
              {page.title}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}

export function WikiEditor() {
  const {
    selectedProjectId,
    wikiPages,
    selectedWikiPageId,
    setSelectedWikiPageId,
    setSelectedProject,
    addWikiPage,
    updateWikiDraft,
    saveWikiPage,
    moveWikiPage,
    deleteWikiPage,
  } = useWorkspaceStore();

  const projectPages = useMemo(
    () => wikiPages.filter((page) => page.projectId === selectedProjectId),
    [wikiPages, selectedProjectId],
  );

  const treeNodes = useMemo(() => buildWikiTree(projectPages), [projectPages]);

  const selectedPageId = selectedWikiPageId;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<WikiPageSnapshot | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageParentId, setNewPageParentId] = useState<string | null>(null);
  const [isPageSubmitting, setIsPageSubmitting] = useState(false);
  const [isPageSaving, setIsPageSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pageSubmitLock = useRef(false);
  const pageSaveLock = useRef(false);
  const selectedPage = projectPages.find((page) => page.id === selectedPageId);
  const toggleShortcutLabel = "⌘B";

  useEffect(() => {
    const handleShortcut = () => {
      setNewPageParentId(null);
      setIsAddOpen(true);
    };
    window.addEventListener("shortcut:new-wiki-page", handleShortcut);
    return () =>
      window.removeEventListener("shortcut:new-wiki-page", handleShortcut);
  }, []);

  useEffect(() => {
    setIsDeleteDialogOpen(false);
  }, [selectedPageId]);

  useEffect(() => {
    if (isEditing) {
      setIsDeleteDialogOpen(false);
    }
  }, [isEditing]);

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

      if (!selectedPageId || !selectedPage || isEditing || isAddOpen) {
        return;
      }

      event.preventDefault();
      setIsDeleteDialogOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddOpen, isEditing, selectedPage, selectedPageId]);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((previous) => !previous);
  }, []);

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

  const [draggedNode, setDraggedNode] = useState<WikiTreeNode | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<
    "before" | "inside" | "after" | null
  >(null);

  const breadcrumbPath = useMemo(
    () =>
      selectedPageId ? getBreadcrumbPath(selectedPageId, projectPages) : [],
    [selectedPageId, projectPages],
  );

  useEffect(() => {
    if (selectedPageId) {
      const path = getBreadcrumbPath(selectedPageId, projectPages);
      const parentIds = path.slice(0, -1).map((page) => page.id);
      setExpandedIds((previous) => {
        const next = new Set(previous);
        parentIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [selectedPageId, projectPages]);

  useEffect(() => {
    if (!projectPages.length) {
      setSelectedWikiPageId(null);
      return;
    }

    if (
      !selectedPageId ||
      !projectPages.some((page) => page.id === selectedPageId)
    ) {
      setSelectedWikiPageId(projectPages[0].id);
    }
  }, [projectPages, selectedPageId, setSelectedWikiPageId]);

  useEffect(() => {
    if (
      !selectedPage ||
      !isEditing ||
      selectedPage.status !== "unsaved" ||
      !selectedPage.title.trim()
    ) {
      return;
    }
    const timer = setTimeout(() => {
      void saveWikiPage(selectedPage.id, {
        title: selectedPage.title,
        document: selectedPage.document,
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [isEditing, saveWikiPage, selectedPage]);

  useEffect(() => {
    if (!selectedPage || (editSnapshot && editSnapshot.id !== selectedPage.id)) {
      setIsEditing(false);
      setEditSnapshot(null);
    }
  }, [editSnapshot, selectedPage]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleEdit = () => {
    if (!selectedPage) return;
    setEditSnapshot({
      id: selectedPage.id,
      title: selectedPage.title,
      document: selectedPage.document,
      contentText: selectedPage.contentText,
      updatedAt: selectedPage.updatedAt,
      status: selectedPage.status,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    if (pageSaveLock.current) return;

    const trimmedTitle = selectedPage.title.trim();
    if (!trimmedTitle) {
      toast({
        title: "Page title required",
        description: "Add a title before saving this wiki page.",
      });
      return;
    }

    pageSaveLock.current = true;
    setIsPageSaving(true);
    setIsEditing(false);
    setEditSnapshot(null);
    try {
      await saveWikiPage(selectedPage.id, {
        title: trimmedTitle,
        document: selectedPage.document,
      });
    } finally {
      setIsPageSaving(false);
      pageSaveLock.current = false;
    }
  };

  const handleCancel = () => {
    if (selectedPage && editSnapshot && editSnapshot.id === selectedPage.id) {
      updateWikiDraft(selectedPage.id, {
        title: editSnapshot.title,
        document: editSnapshot.document,
      });
    }
    setIsEditing(false);
    setEditSnapshot(null);
  };

  const handleAddPage = async () => {
    if (!selectedProjectId) return;

    const trimmedTitle = newPageTitle.trim();
    if (!trimmedTitle) {
      toast({
        title: "Page title required",
        description: "Add a title to create a new wiki page.",
      });
      return;
    }

    if (pageSubmitLock.current) return;
    pageSubmitLock.current = true;
    setIsPageSubmitting(true);

    const siblings = projectPages.filter((page) => page.parentId === newPageParentId);
    const maxPosition = Math.max(0, ...siblings.map((sibling) => sibling.position ?? 0));

    const newPage: WikiPage = {
      id: Date.now().toString(),
      projectId: selectedProjectId,
      title: trimmedTitle,
      document: createEmptyWorkspaceDocument(),
      contentText: "",
      parentId: newPageParentId,
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      position: maxPosition + 1,
      status: "saved",
    };

    try {
      const created = await addWikiPage(newPage);
      if (created) {
        setSelectedWikiPageId(created.id);
        setIsEditing(true);
        setEditSnapshot({
          id: created.id,
          title: created.title,
          document: created.document,
          contentText: created.contentText,
          updatedAt: created.updatedAt,
          status: created.status,
        });
        setNewPageTitle("");
        setNewPageParentId(null);
        setIsAddOpen(false);

        if (newPageParentId) {
          setExpandedIds((previous) => new Set([...previous, newPageParentId]));
        }
      }
    } finally {
      setIsPageSubmitting(false);
      pageSubmitLock.current = false;
    }
  };

  const handleAddChildPage = () => {
    if (selectedPageId) {
      setNewPageParentId(selectedPageId);
      setIsAddOpen(true);
    }
  };

  const handleDelete = async (pageId: string) => {
    const page = projectPages.find((candidate) => candidate.id === pageId);
    const deleted = await deleteWikiPage(pageId);
    if (!deleted) {
      return;
    }

    setIsEditing(false);
    setEditSnapshot(null);

    toast({
      title: "Moved to Trash",
      description: "This page and its subpages can be restored from Trash for 30 days.",
      action: (
        <ToastAction
          altText="Undo"
          onClick={async () => {
            const trash = window.workspaceApi?.trash;
            if (!trash || !selectedProjectId) {
              return;
            }
            const restored = await trash.restore({ type: "wiki", id: pageId });
            if (restored.ok === false) {
              toast({
                title: "Undo failed",
                description: restored.error.message,
                variant: "destructive",
              });
              return;
            }
            await setSelectedProject(selectedProjectId);
            setSelectedWikiPageId(pageId);
            toast({
              title: "Restored",
              description: page?.title ? `"${page.title}" restored.` : "Wiki page restored.",
            });
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const handleDragStart = useCallback((event: React.DragEvent, node: WikiTreeNode) => {
    event.dataTransfer.effectAllowed = "move";
    setDraggedNode(node);
  }, []);

  const handleDragOver = useCallback(
    (event: React.DragEvent, node: WikiTreeNode) => {
      event.preventDefault();
      if (!draggedNode || draggedNode.id === node.id) return;

      const descendants = getDescendantIds(draggedNode.id, projectPages);
      if (descendants.has(node.id)) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const height = rect.height;

      let position: "before" | "inside" | "after";
      if (y < height * 0.25) {
        position = "before";
      } else if (y > height * 0.75) {
        position = "after";
      } else {
        position = "inside";
      }

      setDragOverId(node.id);
      setDropPosition(position);
    },
    [draggedNode, projectPages],
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (!event.currentTarget.contains(relatedTarget)) {
      setDragOverId(null);
      setDropPosition(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent, targetNode: WikiTreeNode) => {
      event.preventDefault();
      if (!draggedNode || !dropPosition) return;

      if (draggedNode.id === targetNode.id) return;
      const descendants = getDescendantIds(draggedNode.id, projectPages);
      if (descendants.has(targetNode.id)) return;

      let newParentId: string | null;
      let newPosition: number;

      if (dropPosition === "inside") {
        newParentId = targetNode.id;
        const siblings = projectPages.filter(
          (page) => page.parentId === targetNode.id,
        );
        newPosition = Math.max(0, ...siblings.map((sibling) => sibling.position ?? 0)) + 1;
        setExpandedIds((previous) => new Set([...previous, targetNode.id]));
      } else {
        newParentId = targetNode.parentId;
        const siblings = projectPages
          .filter(
            (page) =>
              page.parentId === targetNode.parentId && page.id !== draggedNode.id,
          )
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        const targetIndex = siblings.findIndex((page) => page.id === targetNode.id);
        if (dropPosition === "before") {
          newPosition =
            targetIndex > 0
              ? ((siblings[targetIndex - 1]?.position ?? 0) +
                  (targetNode.position ?? 0)) /
                2
              : (targetNode.position ?? 0) - 1;
        } else {
          newPosition =
            targetIndex < siblings.length - 1
              ? ((targetNode.position ?? 0) +
                  (siblings[targetIndex + 1]?.position ?? 0)) /
                2
              : (targetNode.position ?? 0) + 1;
        }
      }

      await moveWikiPage(draggedNode.id, newParentId, newPosition);

      setDraggedNode(null);
      setDragOverId(null);
      setDropPosition(null);
    },
    [draggedNode, dropPosition, projectPages, moveWikiPage],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedNode(null);
    setDragOverId(null);
    setDropPosition(null);
  }, []);

  const statusCopy = !selectedPage
    ? "No page selected"
    : selectedPage.status === "saved"
      ? "All changes saved"
      : selectedPage.status === "saving"
        ? "Saving changes..."
        : "Unsaved changes";

  const saveButtonLabel = !selectedPage
    ? "Save"
    : selectedPage.status === "saved"
      ? "Saved"
      : selectedPage.status === "saving"
        ? "Saving..."
        : "Save";

  const statusDotClass = cn(
    "w-2 h-2 rounded-full transition-all duration-200",
    selectedPage?.status === "saved" && "bg-status-done",
    selectedPage?.status === "saving" && "bg-status-progress animate-pulse",
    selectedPage?.status === "unsaved" && "bg-status-todo",
    !selectedPage && "bg-muted",
  );

  return (
    <div
      className={cn(
        "flex-1 flex p-6 h-full min-h-0 transition-[gap] duration-200",
        isSidebarOpen ? "gap-6" : "gap-0",
      )}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "shrink-0 overflow-hidden transition-all duration-200 ease-out",
          isSidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 pointer-events-none",
        )}
      >
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-mono text-lg font-bold text-primary">Wiki</h3>
            <div className="flex items-center gap-2">
              <Dialog
                open={isAddOpen}
                onOpenChange={(open) => {
                  setIsAddOpen(open);
                  if (!open) setNewPageParentId(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2" variant="primary">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="bg-popover border-border"
                  onKeyDown={(event) => {
                    if (event.defaultPrevented) return;
                    if (event.key === "Enter" && !event.shiftKey) {
                      if (isPageSubmitting) return;
                      event.preventDefault();
                      handleAddPage();
                    }
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>
                      {newPageParentId
                        ? `New Subpage of "${projectPages.find((page) => page.id === newPageParentId)?.title}"`
                        : "New Wiki Page"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <AppInput
                      placeholder="Page title"
                      value={newPageTitle}
                      onChange={(event) => setNewPageTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          if (isPageSubmitting) return;
                          event.preventDefault();
                          handleAddPage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddPage}
                      className="w-full"
                      variant="primary"
                      disabled={isPageSubmitting}
                    >
                      Create Page
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSidebar}
                className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground"
                title={`Hide wiki panel (${toggleShortcutLabel})`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {toggleShortcutLabel}
                </span>
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 scrollbar-thin">
            {treeNodes.length ? (
              <div className="p-2 space-y-0.5">
                {treeNodes.map((node) => (
                  <WikiTreeItem
                    key={node.id}
                    node={node}
                    selectedPageId={selectedPageId}
                    expandedIds={expandedIds}
                    onSelect={(id) => {
                      if (isEditing) {
                        handleCancel();
                      }
                      setSelectedWikiPageId(id);
                    }}
                    onToggle={handleToggle}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    dragOverId={dragOverId}
                    dropPosition={dropPosition}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                No pages yet. Create your first wiki page.
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!isSidebarOpen && (
          <div className="p-4 pb-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleSidebar}
              className="gap-2"
              title={`Show wiki panel (${toggleShortcutLabel})`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>Show Panel</span>
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {toggleShortcutLabel}
              </span>
            </Button>
          </div>
        )}
        {selectedPage ? (
          <>
            <div
              className={
                isEditing
                  ? "px-4 py-2.5 border-b border-border"
                  : "p-4 border-b border-border"
              }
            >
              {!isEditing && (
                <Breadcrumb
                  path={breadcrumbPath}
                  onNavigate={(pageId) => {
                    if (pageId) {
                      setSelectedWikiPageId(pageId);
                      setIsEditing(false);
                    }
                  }}
                />
              )}
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <div className="w-full max-w-xl pr-4 space-y-1.5">
                    <AppInput
                      value={selectedPage.title}
                      onChange={(event) =>
                        updateWikiDraft(selectedPage.id, { title: event.target.value })
                      }
                      className="h-8"
                      placeholder="Page title"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Updated <RelativeTime date={selectedPage.updatedAt} />
                      </span>
                      <span className={statusDotClass} />
                      <span>{statusCopy}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="font-mono text-lg font-bold text-primary">
                      {selectedPage.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Updated <RelativeTime date={selectedPage.updatedAt} />
                      </span>
                      <span className={statusDotClass} />
                      <span>{statusCopy}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        variant="primary"
                        disabled={
                          !selectedPage ||
                          selectedPage.status !== "unsaved" ||
                          isPageSaving ||
                          !selectedPage.title.trim()
                        }
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {saveButtonLabel}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddChildPage}
                        title="Add Subpage"
                      >
                        <FolderPlus className="w-4 h-4 mr-1" />
                        Subpage
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleEdit}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            aria-label="Move wiki page to Trash"
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
                              Move this page to Trash?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This page and its subpages can be restored from
                              Trash for 30 days.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(selectedPage.id)}
                              className={buttonVariants({
                                variant: "destructive",
                              })}
                            >
                              Move to Trash
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col bg-background">
              {isEditing ? (
                <BlockEditor
                  key={`${selectedPage.id}:edit`}
                  value={selectedPage.document}
                  editable
                  autofocus
                  className="h-full text-sm"
                  onChange={(document) =>
                    updateWikiDraft(selectedPage.id, { document })
                  }
                />
              ) : (selectedPage.contentText ?? "").trim() ? (
                <BlockEditor
                  key={`${selectedPage.id}:read`}
                  value={selectedPage.document}
                  className="h-full"
                />
              ) : (
                <ScrollArea className="flex-1 p-6 scrollbar-thin">
                  <div className="text-sm text-muted-foreground">
                    No content yet. Click Edit to start writing this page.
                  </div>
                </ScrollArea>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-mono text-lg font-bold text-primary mb-2">
                Your Wiki
              </h3>
              <p className="text-sm mb-4">
                Capture architecture, onboarding notes, and decisions in one place.
              </p>
              <Button onClick={() => setIsAddOpen(true)} variant="primary">
                <Plus className="w-4 h-4 mr-1" />
                Create Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
