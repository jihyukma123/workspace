import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, FileText, ChevronRight, Edit2, Save, X, Trash2, Clock } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AppInput } from '@/components/ui/app-input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { renderMarkdown } from '@/components/markdown/renderMarkdown';

export function WikiEditor() {
  const { selectedProjectId, wikiPages, addWikiPage, updateWikiPage, deleteWikiPage } = useWorkspaceStore();
  const projectPages = useMemo(
    () => wikiPages.filter((page) => page.projectId === selectedProjectId),
    [wikiPages, selectedProjectId]
  );
  const [selectedPageId, setSelectedPageId] = useState<string | null>(projectPages[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isPageSubmitting, setIsPageSubmitting] = useState(false);
  const [isPageSaving, setIsPageSaving] = useState(false);
  const pageSubmitLock = useRef(false);
  const pageSaveLock = useRef(false);

  const selectedPage = projectPages.find((p) => p.id === selectedPageId);

  useEffect(() => {
    if (!projectPages.length) {
      setSelectedPageId(null);
      return;
    }

    if (!selectedPageId || !projectPages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(projectPages[0].id);
    }
  }, [projectPages, selectedPageId]);

  const handleEdit = () => {
    if (selectedPage) {
      setEditContent(selectedPage.content);
      setEditTitle(selectedPage.title);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!selectedPageId) {
      return;
    }
    if (pageSaveLock.current) {
      return;
    }
    pageSaveLock.current = true;
    setIsPageSaving(true);
    setIsEditing(false);
    try {
      await updateWikiPage(selectedPageId, {
        title: editTitle.trim() || 'Untitled',
        content: editContent,
      });
    } finally {
      setIsPageSaving(false);
      pageSaveLock.current = false;
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
    setEditTitle('');
  };

  const handleAddPage = async () => {
    if (!selectedProjectId) {
      return;
    }

    if (newPageTitle.trim()) {
      if (pageSubmitLock.current) {
        return;
      }
      pageSubmitLock.current = true;
      setIsPageSubmitting(true);
      const newPage = {
        id: Date.now().toString(),
        projectId: selectedProjectId,
        title: newPageTitle,
        content: `# ${newPageTitle}\n\nStart writing your documentation here...`,
        parentId: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      try {
        const created = await addWikiPage(newPage);
        if (created) {
          setSelectedPageId(created.id);
          setNewPageTitle('');
          setIsAddOpen(false);
        }
      } finally {
        setIsPageSubmitting(false);
        pageSubmitLock.current = false;
      }
    }
  };

  const handleDelete = (pageId: string) => {
    void deleteWikiPage(pageId);
    setSelectedPageId((current) => {
      if (current !== pageId) {
        return current;
      }
      const remaining = projectPages.filter((page) => page.id !== pageId);
      return remaining[0]?.id ?? null;
    });
    setIsEditing(false);
  };

  const formatUpdatedAt = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex gap-6 p-6 h-full min-h-0">
      {/* Sidebar */}
      <div className="w-72 shrink-0">
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-mono text-lg font-bold text-primary">Wiki</h3>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2"
                  variant="primary"
                >
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent
                className="bg-popover border-border"
                onKeyDown={(e) => {
                  if (e.defaultPrevented) {
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    if (isPageSubmitting) {
                      return;
                    }
                    e.preventDefault();
                    handleAddPage();
                  }
                }}
              >
                <DialogHeader>
                  <DialogTitle>New Wiki Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <AppInput
                    placeholder="Page title"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (isPageSubmitting) {
                          return;
                        }
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
            {projectPages.length ? (
              <div className="p-2 space-y-2">
                {projectPages.map((page) => (
                  <Button
                    key={page.id}
                    onClick={() => {
                      setSelectedPageId(page.id);
                      setIsEditing(false);
                    }}
                    className={cn(
                      'group w-full h-auto justify-start gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200',
                      selectedPageId === page.id
                        ? 'border-primary bg-accent/20'
                        : 'border-border bg-background hover:bg-accent/30'
                    )}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate text-sm">{page.title}</span>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity',
                        selectedPageId === page.id && 'opacity-100'
                      )}
                    />
                  </Button>
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
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-mono text-lg font-bold text-primary">{selectedPage.title}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Updated {formatUpdatedAt(selectedPage.updatedAt)}</span>
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
                      onClick={handleEdit}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-popover border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this page?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The wiki page will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(selectedPage.id)}
                            className={buttonVariants({ variant: 'destructive' })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
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
                    className="min-h-[500px] text-sm resize-none bg-input border-border focus-visible:ring-ring"
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
              <h3 className="font-mono text-lg font-bold text-primary mb-2">Your Wiki</h3>
              <p className="text-sm mb-4">
                Capture architecture, onboarding notes, and decisions in one place.
              </p>
              <Button
                onClick={() => setIsAddOpen(true)}
                variant="primary"
              >
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
