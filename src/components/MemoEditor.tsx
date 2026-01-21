import { useState, useEffect } from 'react';
import { StickyNote, Save, Clock } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function MemoEditor() {
  const { memo, updateMemo } = useWorkspaceStore();
  const [content, setContent] = useState(memo.content);
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date>(memo.updatedAt);

  useEffect(() => {
    setContent(memo.content);
  }, [memo.content]);

  useEffect(() => {
    const hasChanges = content !== memo.content;
    setIsSaved(!hasChanges);
  }, [content, memo.content]);

  const handleSave = () => {
    updateMemo(content);
    setIsSaved(true);
    setLastSaved(new Date());
  };

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSaved) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, isSaved]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quick Memo</h2>
            <p className="text-xs text-muted-foreground">
              Capture your thoughts instantly
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Last saved: {formatTime(lastSaved)}</span>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaved}
            className={
              isSaved
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isSaved ? 'bg-status-done' : 'bg-status-progress animate-pulse'
          }`}
        />
        <span className="text-xs text-muted-foreground">
          {isSaved ? 'All changes saved' : 'Unsaved changes...'}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 rounded-lg border border-border overflow-hidden">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your notes here... 

You can use Markdown:
# Heading
- List items
- [ ] Todo items
**Bold text**"
            className="h-full w-full resize-none text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
          />
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">TIP:</span> Your memo auto-saves after 2 seconds of inactivity. 
          Use Markdown syntax for formatting.
        </p>
      </div>
    </div>
  );
}
