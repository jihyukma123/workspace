import { useEffect, useMemo, useState } from 'react';
import { StickyNote, Save, Clock, Plus, Edit2, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
      saveMemo(activeMemo.id, activeMemo.content);
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

  const handleAddMemo = () => {
    if (!selectedProjectId) {
      return;
    }
    const now = new Date();
    addMemo({
      id: `memo-${now.getTime()}`,
      projectId: selectedProjectId,
      title: 'Untitled Memo',
      content:
        '# Untitled Memo\n\nStart typing your notes here...\n\n- [ ] First thought\n- [ ] Next step',
      createdAt: now,
      updatedAt: null,
      status: 'unsaved',
    });
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
    saveMemo(activeMemo.id, activeMemo.content);
    setIsEditing(false);
    setEditSnapshot(null);
  };

  const handleSelectMemo = (memoId: string) => {
    if (isEditing) {
      handleCancel();
    }
    setSelectedMemoId(memoId);
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
                        'w-full h-auto items-start justify-start text-left rounded-lg px-3 py-2',
                        isActive
                          ? 'border-primary bg-accent/20'
                          : 'border-border bg-background'
                      )}
                      variant="outline"
                      size="sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-foreground">
                          {memo.title || 'Untitled Memo'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(memo.updatedAt ?? memo.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {memo.content || 'No content yet'}
                      </p>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!activeMemo || activeMemo.status !== 'unsaved'}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveButtonLabel}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={!activeMemo}
                className="text-muted-foreground hover:text-primary"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="mb-4 flex items-center gap-2">
          <span className={statusDotClass} />
          <span className="text-xs text-muted-foreground">{statusCopy}</span>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 rounded-lg border border-border overflow-hidden">
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
                className="h-full w-full resize-none text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4 scrollbar-thin"
              />
            ) : (
              <div className="h-full w-full overflow-y-auto p-4 scrollbar-thin">
                {activeMemo?.content?.trim() ? (
                  <div className="prose dark:prose-invert max-w-none">
                    {renderMarkdown(activeMemo.content)}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No content yet. Click Edit to add your notes.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-medium">TIP:</span> Edits auto-save after 2
            seconds of inactivity. Use Markdown syntax for formatting.
          </p>
        </div>
      </div>
    </div>
  );
}
