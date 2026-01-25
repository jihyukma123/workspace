import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, ChevronRight, Edit2, Save, X, Trash2, Clock } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
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

  const handleSave = () => {
    if (selectedPageId) {
      updateWikiPage(selectedPageId, {
        title: editTitle.trim() || 'Untitled',
        content: editContent,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
    setEditTitle('');
  };

  const handleAddPage = () => {
    if (!selectedProjectId) {
      return;
    }

    if (newPageTitle.trim()) {
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
      addWikiPage(newPage);
      setSelectedPageId(newPage.id);
      setNewPageTitle('');
      setIsAddOpen(false);
    }
  };

  const handleDelete = (pageId: string) => {
    deleteWikiPage(pageId);
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
    <div className="flex-1 flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card/30 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-mono text-sm font-semibold text-primary uppercase tracking-wider">
            Wiki Pages
          </h3>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border">
              <DialogHeader>
                <DialogTitle>New Wiki Page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Page title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPage();
                    }
                  }}
                />
                <Button
                  onClick={handleAddPage}
                  className="w-full"
                >
                  Create Page
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="p-2 space-y-1">
            {projectPages.length ? (
              projectPages.map((page) => (
                <Button
                  key={page.id}
                  onClick={() => {
                    setSelectedPageId(page.id);
                    setIsEditing(false);
                  }}
                  className={cn(
                    'w-full h-auto justify-start gap-2 px-3 py-2 rounded-lg text-left',
                    'group',
                    selectedPageId === page.id
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'text-foreground border border-transparent'
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
              ))
            ) : (
              <div className="p-4 text-xs text-muted-foreground text-center">
                No pages yet. Create your first wiki page.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
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
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
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
                          <AlertDialogAction onClick={() => handleDelete(selectedPage.id)}>
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
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-input border-border focus-visible:ring-ring"
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
