import { useMemo, useRef, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Reminder } from '@/types/workspace';

const getReminderId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export function ReminderPanelContent() {
  const {
    selectedProjectId,
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
  } = useWorkspaceStore();
  const [newText, setNewText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReminderSubmitting, setIsReminderSubmitting] = useState(false);
  const reminderSubmitLock = useRef(false);

  const projectReminders = useMemo(() => {
    return reminders
      .filter((reminder) => reminder.projectId === selectedProjectId)
      .slice()
      .sort((a, b) => {
        // 미완료 항목을 위로, 완료 항목을 아래로
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [reminders, selectedProjectId]);

  const completedCount = projectReminders.filter((r) => r.status === 'done').length;

  const handleCreateReminder = async () => {
    if (!selectedProjectId) {
      setErrorMessage('Select a project to add reminders.');
      return;
    }
    const trimmed = newText.trim();
    if (!trimmed) {
      return;
    }
    if (reminderSubmitLock.current) {
      return;
    }
    reminderSubmitLock.current = true;
    setErrorMessage(null);
    const now = new Date();
    setIsReminderSubmitting(true);
    try {
      const created = await addReminder({
        id: getReminderId(),
        projectId: selectedProjectId,
        text: trimmed,
        status: 'todo',
        createdAt: now,
        updatedAt: null,
      });
      if (!created) {
        setErrorMessage('Could not save the reminder. Try again.');
        return;
      }
      setNewText('');
    } finally {
      setIsReminderSubmitting(false);
      reminderSubmitLock.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // IME 입력 중(한글 등)에는 Enter 무시
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      if (isReminderSubmitting) {
        return;
      }
      e.preventDefault();
      void handleCreateReminder();
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    const newStatus = reminder.status === 'done' ? 'todo' : 'done';
    const ok = await updateReminder(reminder.id, { text: reminder.text, status: newStatus });
    if (!ok) {
      setErrorMessage('Could not update the reminder.');
    }
  };

  const handleDelete = async (reminder: Reminder) => {
    setErrorMessage(null);
    const ok = await deleteReminder(reminder.id);
    if (!ok) {
      setErrorMessage('Could not delete the reminder.');
      return;
    }

    toast({
      title: 'Reminder deleted',
      description: reminder.text,
      action: (
        <ToastAction
          altText="Undo delete"
          onClick={() => {
            void (async () => {
              const restored = await addReminder({
                ...reminder,
                updatedAt: reminder.updatedAt,
              });
              if (!restored) {
                toast({
                  title: 'Undo failed',
                  description: 'Could not restore the reminder. Try again.',
                });
              }
            })();
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  return (
    <div className={cn('flex h-full flex-col')}>
      <div className={cn('border-b border-border px-4 py-4 pr-12')}>
        <div className={cn('flex items-center justify-between')}>
          <h2 className={cn('font-mono text-lg font-bold text-primary')}>Reminders</h2>
          <div className={cn('flex items-center gap-2 text-xs text-muted-foreground')}>
            <Check className={cn('h-4 w-4 text-primary')} />
            <span>{completedCount}/{projectReminders.length}</span>
          </div>
        </div>
        <p className={cn('mt-1 text-xs text-muted-foreground')}>
          Quick checklist to keep things top of mind.
        </p>
      </div>

      <div className={cn('border-b border-border px-4 py-3')}>
        <div className={cn('flex items-center gap-2')}>
          <Input
            placeholder="Add a reminder..."
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
            onKeyDown={handleKeyDown}
            className={cn('flex-1 bg-input border-border')}
          />
          <Button
            size="icon"
            className={cn('h-9 w-9 shrink-0')}
            onClick={handleCreateReminder}
            disabled={!newText.trim() || isReminderSubmitting}
          >
            <Plus className={cn('h-4 w-4')} />
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className={cn('px-4 pt-4')}>
          <Alert>
            <AlertTitle>Reminder error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className={cn('flex-1 overflow-y-auto scrollbar-thin px-4 py-3')}>
        {!selectedProjectId ? (
          <div className={cn('rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground')}>
            Select a project to manage reminders.
          </div>
        ) : projectReminders.length === 0 ? (
          <div className={cn('rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground')}>
            No reminders yet. Add one above.
          </div>
        ) : (
          <div className={cn('space-y-1')}>
            {projectReminders.map((reminder) => {
              const isDone = reminder.status === 'done';
              return (
                <div
                  key={reminder.id}
                  className={cn(
                    'group flex items-start gap-3 rounded-md px-2 py-2 transition-all duration-200',
                    'hover:bg-accent/50'
                  )}
                >
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => handleToggleComplete(reminder)}
                    className={cn('mt-0.5 shrink-0')}
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm leading-relaxed',
                      isDone && 'text-muted-foreground line-through'
                    )}
                  >
                    {reminder.text}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      'h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
                      'text-muted-foreground hover:text-destructive'
                    )}
                    onClick={() => handleDelete(reminder)}
                  >
                    <X className={cn('h-3.5 w-3.5')} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReminderPanel() {
  return (
    <aside
      className={cn(
        'w-full shrink-0 border-t border-sidebar-border bg-sidebar text-sidebar-foreground lg:w-80 lg:border-l lg:border-t-0'
      )}
    >
      <ReminderPanelContent />
    </aside>
  );
}
