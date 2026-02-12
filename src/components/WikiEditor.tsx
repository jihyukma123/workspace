import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  FileText,
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { renderMarkdown } from "@/components/markdown/renderMarkdown";
import { WikiPage } from "@/types/workspace";
import { toast } from "@/hooks/use-toast";

interface WikiTreeNode extends WikiPage {
  children: WikiTreeNode[];
  depth: number;
}

// Build tree structure from flat list
function buildWikiTree(pages: WikiPage[]): WikiTreeNode[] {
  const pageMap = new Map<string, WikiTreeNode>();
  const rootNodes: WikiTreeNode[] = [];

  // Sort by position first
  const sortedPages = [...pages].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  // Create nodes with depth
  sortedPages.forEach((page) => {
    pageMap.set(page.id, { ...page, children: [], depth: 0 });
  });

  // Build tree
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

  // Update depths recursively
  const updateDepths = (nodes: WikiTreeNode[], depth: number) => {
    nodes.forEach((node) => {
      node.depth = depth;
      updateDepths(node.children, depth + 1);
    });
  };
  updateDepths(rootNodes, 0);

  return rootNodes;
}

// Get breadcrumb path for a page
function getBreadcrumbPath(pageId: string, pages: WikiPage[]): WikiPage[] {
  const path: WikiPage[] = [];
  const pageMap = new Map(pages.map((p) => [p.id, p]));

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

// Get all descendant IDs of a page
function getDescendantIds(pageId: string, pages: WikiPage[]): Set<string> {
  const descendants = new Set<string>();
  const findDescendants = (id: string) => {
    pages.forEach((p) => {
      if (p.parentId === id) {
        descendants.add(p.id);
        findDescendants(p.id);
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
  onDragStart: (e: React.DragEvent, node: WikiTreeNode) => void;
  onDragOver: (e: React.DragEvent, node: WikiTreeNode) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, node: WikiTreeNode) => void;
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
          "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200",
          isSelected
            ? "bg-accent/20 border border-primary"
            : "hover:bg-accent/30 border border-transparent",
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
        onDragStart={(e) => onDragStart(e, node)}
        onDragOver={(e) => onDragOver(e, node)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node)}
        onClick={() => onSelect(node.id)}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
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

        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="truncate text-sm flex-1">{node.title}</span>

        {isSelected && (
          <ChevronRight className="w-4 h-4 text-primary shrink-0" />
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
    setSelectedProject,
    addWikiPage,
    updateWikiPage,
    moveWikiPage,
    deleteWikiPage,
  } = useWorkspaceStore();

  const projectPages = useMemo(
    () => wikiPages.filter((page) => page.projectId === selectedProjectId),
    [wikiPages, selectedProjectId],
  );

  const treeNodes = useMemo(() => buildWikiTree(projectPages), [projectPages]);

  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    projectPages[0]?.id || null,
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageParentId, setNewPageParentId] = useState<string | null>(null);
  const [isPageSubmitting, setIsPageSubmitting] = useState(false);
  const [isPageSaving, setIsPageSaving] = useState(false);
  const pageSubmitLock = useRef(false);
  const pageSaveLock = useRef(false);
  const selectedPage = projectPages.find((p) => p.id === selectedPageId);

  // Listen for keyboard shortcut event
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

  // Drag and drop state
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

  // Auto-expand parents when selecting a page
  useEffect(() => {
    if (selectedPageId) {
      const path = getBreadcrumbPath(selectedPageId, projectPages);
      const parentIds = path.slice(0, -1).map((p) => p.id);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        parentIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [selectedPageId, projectPages]);

  useEffect(() => {
    if (!projectPages.length) {
      setSelectedPageId(null);
      return;
    }

    if (
      !selectedPageId ||
      !projectPages.some((page) => page.id === selectedPageId)
    ) {
      setSelectedPageId(projectPages[0].id);
    }
  }, [projectPages, selectedPageId]);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleEdit = () => {
    if (selectedPage) {
      setEditContent(selectedPage.content);
      setEditTitle(selectedPage.title);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!selectedPageId) return;
    if (pageSaveLock.current) return;

    const trimmedTitle = editTitle.trim();
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
    try {
      await updateWikiPage(selectedPageId, {
        title: trimmedTitle,
        content: editContent,
      });
    } finally {
      setIsPageSaving(false);
      pageSaveLock.current = false;
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent("");
    setEditTitle("");
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

    // Calculate position for new page
    const siblings = projectPages.filter((p) => p.parentId === newPageParentId);
    const maxPosition = Math.max(0, ...siblings.map((s) => s.position ?? 0));

    const newPage: WikiPage = {
      id: Date.now().toString(),
      projectId: selectedProjectId,
      title: trimmedTitle,
      content: "",
      parentId: newPageParentId,
      children: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      position: maxPosition + 1,
    };

    try {
      const created = await addWikiPage(newPage);
      if (created) {
        setSelectedPageId(created.id);
        setEditTitle(created.title);
        setEditContent(created.content);
        setIsEditing(true);
        setNewPageTitle("");
        setNewPageParentId(null);
        setIsAddOpen(false);

        // Expand parent if adding as child
        if (newPageParentId) {
          setExpandedIds((prev) => new Set([...prev, newPageParentId]));
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
    const page = projectPages.find((p) => p.id === pageId);
    const deleted = await deleteWikiPage(pageId);
    if (!deleted) {
      return;
    }

    setSelectedPageId((current) => {
      if (current !== pageId) return current;
      const remaining = projectPages.filter((p) => p.id !== pageId);
      return remaining[0]?.id ?? null;
    });
    setIsEditing(false);

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
            setSelectedPageId(pageId);
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

  // Drag and Drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, node: WikiTreeNode) => {
      e.dataTransfer.effectAllowed = "move";
      setDraggedNode(node);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, node: WikiTreeNode) => {
      e.preventDefault();
      if (!draggedNode || draggedNode.id === node.id) return;

      // Don't allow dropping on descendants
      const descendants = getDescendantIds(draggedNode.id, projectPages);
      if (descendants.has(node.id)) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
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

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the element
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverId(null);
      setDropPosition(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetNode: WikiTreeNode) => {
      e.preventDefault();
      if (!draggedNode || !dropPosition) return;

      // Don't allow dropping on self or descendants
      if (draggedNode.id === targetNode.id) return;
      const descendants = getDescendantIds(draggedNode.id, projectPages);
      if (descendants.has(targetNode.id)) return;

      let newParentId: string | null;
      let newPosition: number;

      if (dropPosition === "inside") {
        // Move as child of target
        newParentId = targetNode.id;
        const siblings = projectPages.filter(
          (p) => p.parentId === targetNode.id,
        );
        newPosition = Math.max(0, ...siblings.map((s) => s.position ?? 0)) + 1;

        // Expand the target node
        setExpandedIds((prev) => new Set([...prev, targetNode.id]));
      } else {
        // Move as sibling
        newParentId = targetNode.parentId;
        const siblings = projectPages
          .filter(
            (p) =>
              p.parentId === targetNode.parentId && p.id !== draggedNode.id,
          )
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        const targetIndex = siblings.findIndex((s) => s.id === targetNode.id);
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

  return (
    <div
      className="flex-1 flex gap-6 p-6 h-full min-h-0"
      onDragEnd={handleDragEnd}
    >
      {/* Sidebar */}
      <div className="w-72 shrink-0">
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-mono text-lg font-bold text-primary">Wiki</h3>
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
                onKeyDown={(e) => {
                  if (e.defaultPrevented) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (isPageSubmitting) return;
                    e.preventDefault();
                    handleAddPage();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>
                    {newPageParentId
                      ? `New Subpage of "${projectPages.find((p) => p.id === newPageParentId)?.title}"`
                      : "New Wiki Page"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <AppInput
                    placeholder="Page title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (isPageSubmitting) return;
                        e.preventDefault();
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
                      setSelectedPageId(id);
                      setIsEditing(false);
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

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedPage ? (
          <>
            <div className="p-4 border-b border-border">
              <Breadcrumb
                path={breadcrumbPath}
                onNavigate={(pageId) => {
                  if (pageId) {
                    setSelectedPageId(pageId);
                    setIsEditing(false);
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-lg font-bold text-primary">
                    {selectedPage.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      Updated <RelativeTime date={selectedPage.updatedAt} />
                    </span>
                  </div>
                </div>
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
                        disabled={isPageSaving}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
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

            <ScrollArea className="flex-1 p-6 scrollbar-thin">
              {isEditing ? (
                <div className="space-y-4">
                  <AppInput
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Page title"
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[500px] text-sm resize-none bg-input border-border focus-visible:ring-inset focus-visible:ring-offset-0"
                    placeholder="Write your documentation in Markdown..."
                  />
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {renderMarkdown(selectedPage.content)}
                </div>
              )}
            </ScrollArea>
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
                Capture architecture, onboarding notes, and decisions in one
                place.
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
