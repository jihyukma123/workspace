import { useEffect, useMemo, useState } from 'react';
import { StickyNote, Save, Clock, Plus, Edit2, X, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/components/markdown/renderMarkdown';
import { MemoStatus } from '@/types/workspace';

type MemoSnapshot = {
  id: string;
  content: string;
  updatedAt: Date | null;
  status: MemoStatus;
};

export function MemoEditor() {
  const {
    selectedProjectId,
    memos,
    selectedMemoId,
    setSelectedMemoId,
    addMemo,
    updateMemoDraft,
    saveMemo,
    revertMemo,
    deleteMemo,
  } = useWorkspaceStore();

  const projectMemos = useMemo(
    () => memos.filter((memo) => memo.projectId === selectedProjectId),
    [memos, selectedProjectId]
  );

  const activeMemo = projectMemos.find((memo) => memo.id === selectedMemoId) ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState<MemoSnapshot | null>(null);

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
  }, [activeMemo, projectMemos, selectedMemoId, selectedProjectId, setSelectedMemoId]);

  useEffect(() => {
    if (!activeMemo || (editSnapshot && editSnapshot.id !== activeMemo.id)) {
      setIsEditing(false);
      setEditSnapshot(null);
    }
  }, [activeMemo, editSnapshot]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!activeMemo || !isEditing || activeMemo.status !== 'unsaved') {
      return;
    }
    const timer = setTimeout(() => {
      void saveMemo(activeMemo.id, activeMemo.content);
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeMemo, isEditing, saveMemo]);

  const formatTime = (date: Date | null) => {
    if (!date) {
      return '—';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusCopy = !activeMemo
    ? 'No memo selected'
    : activeMemo.status === 'saved'
    ? 'All changes saved'
    : activeMemo.status === 'saving'
    ? 'Saving changes...'
    : 'Unsaved changes';

  const saveButtonLabel = !activeMemo
    ? 'Save'
    : activeMemo.status === 'saved'
    ? 'Saved'
    : activeMemo.status === 'saving'
    ? 'Saving...'
    : 'Save';

  const statusDotClass = cn(
    'w-2 h-2 rounded-full transition-all duration-200',
    activeMemo?.status === 'saved' && 'bg-status-done',
    activeMemo?.status === 'saving' && 'bg-status-progress animate-pulse',
    activeMemo?.status === 'unsaved' && 'bg-status-todo',
    !activeMemo && 'bg-muted'
  );

  const handleAddMemo = async () => {
    if (!selectedProjectId) {
      return;
    }
    const now = new Date();
    const created = await addMemo({
      id: `memo-${now.getTime()}`,
      projectId: selectedProjectId,
      title: 'Untitled Memo',
      content: '',
      createdAt: now,
      updatedAt: null,
      status: 'unsaved',
    });
    if (!created) {
      return;
    }
  };

  const handleEdit = () => {
    if (!activeMemo) {
      return;
    }
    setEditSnapshot({
      id: activeMemo.id,
      content: activeMemo.content,
      updatedAt: activeMemo.updatedAt,
      status: activeMemo.status,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (!editSnapshot) {
      setIsEditing(false);
      return;
    }
    revertMemo(editSnapshot.id, {
      content: editSnapshot.content,
      updatedAt: editSnapshot.updatedAt,
      status: editSnapshot.status,
    });
    setIsEditing(false);
    setEditSnapshot(null);
  };

  const handleSave = () => {
    if (!activeMemo) {
      return;
    }
    void saveMemo(activeMemo.id, activeMemo.content);
    setIsEditing(false);
    setEditSnapshot(null);
  };

  const handleSelectMemo = (memoId: string) => {
    if (isEditing) {
      handleCancel();
    }
    setSelectedMemoId(memoId);
  };

  const handleDelete = async () => {
    if (!activeMemo) {
      return;
    }
    if (isEditing) {
      handleCancel();
    }
    await deleteMemo(activeMemo.id);
  };

  return (
    <div className="flex-1 flex gap-6 p-6">
      <div className="w-72 shrink-0">
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-mono text-lg font-bold text-primary">Memos</h3>
            <Button
              size="sm"
              onClick={handleAddMemo}
              disabled={!selectedProjectId}
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
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
                        'w-full h-auto items-start justify-start text-left rounded-lg px-3 py-2 transition-all duration-200',
                        isActive
                          ? 'border-primary bg-accent/20'
                          : 'border-border bg-background hover:bg-accent/30'
                      )}
                      variant="outline"
                      size="sm"
                    >
                      <div className="w-full space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-sm text-foreground line-clamp-1">
                            {memo.title || 'Untitled Memo'}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatTime(memo.updatedAt ?? memo.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-mono">
                            {memo.status === 'saved'
                              ? 'Saved'
                              : memo.status === 'saving'
                              ? 'Saving'
                              : 'Unsaved'}
                          </span>
                          <span className="line-clamp-1">
                            {memo.updatedAt ? 'Updated' : 'Created'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {memo.content || 'No content yet'}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4 lg:mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-bold text-primary">
                {activeMemo?.title || 'Quick Memo'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Capture your thoughts instantly
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                Last saved: {formatTime(activeMemo?.updatedAt ?? activeMemo?.createdAt ?? null)}
              </span>
            </div>
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
                  onClick={handleSave}
                  disabled={!activeMemo || activeMemo.status !== 'unsaved'}
                  size="sm"
                  variant="primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveButtonLabel}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEdit}
                  disabled={!activeMemo}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!activeMemo}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-popover border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this memo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The memo will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
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

        {/* Status indicator */}
        <div className="mb-4 lg:mb-2 flex items-center gap-2">
          <span className={statusDotClass} />
          <span className="text-xs text-muted-foreground">{statusCopy}</span>
        </div>

        {/* Editor */}
        <div className={cn("flex-1 relative min-h-0", "lg:min-h-[560px]")}>
          <div
            className={cn(
              "absolute inset-0 rounded-lg border border-border overflow-hidden",
              "lg:shadow-sm"
            )}
          >
            {isEditing ? (
              <Textarea
                value={activeMemo?.content ?? ''}
                onChange={(e) => {
                  if (!activeMemo) {
                    return;
                  }
                  updateMemoDraft(activeMemo.id, e.target.value);
                }}
                placeholder="Start typing your notes here... 

You can use Markdown:
# Heading
- List items
- [ ] Todo items
**Bold text**"
                disabled={!activeMemo}
                className={cn(
                  "h-full w-full resize-none text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 scrollbar-thin",
                  "lg:text-base lg:leading-7"
                )}
              />
            ) : (
              <div className="h-full w-full overflow-y-auto p-4 scrollbar-thin">
                {activeMemo?.content?.trim() ? (
                  <div className="prose dark:prose-invert max-w-none lg:prose-lg">
                    {renderMarkdown(activeMemo.content)}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground lg:text-base lg:leading-7">
                    No content yet. Click Edit to add your notes.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 lg:mt-2 p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">TIP:</span> Edits auto-save after 2
            seconds of inactivity. Use Markdown syntax for formatting.
          </p>
        </div>
      </div>
    </div>
  );
}
