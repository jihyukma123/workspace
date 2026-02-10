import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, Clock, Plus, Trash2, X } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RelativeTime } from "@/components/ui/relative-time";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Reminder } from "@/types/workspace";

const getReminderId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

function formatDateTimeLocal(date: Date | null): string {
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateTime(value: string) {
  if (!value) return null;
  const [dateStr, timeStr] = value.split("T");
  if (!dateStr || !timeStr) return null;
  return { dateStr, timeStr };
}

function buildLocalDateTime(dateStr: string, timeStr: string) {
  if (!dateStr || !timeStr) return "";
  return `${dateStr}T${timeStr}`;
}

const TIME_OPTIONS = Array.from({ length: 24 * 12 }, (_, index) => {
  const totalMinutes = index * 5;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

function getTimeMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

function getNextFutureTime(stepMinutes = 5) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextSlotMinutes =
    Math.ceil((currentMinutes + 1) / stepMinutes) * stepMinutes;
  const clampedMinutes = Math.min(nextSlotMinutes, 24 * 60 - stepMinutes);
  const hours = String(Math.floor(clampedMinutes / 60)).padStart(2, "0");
  const minutes = String(clampedMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

interface ReminderDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  hideClear?: boolean;
}

function ReminderDateTimePicker({
  value,
  onChange,
  hideClear,
}: ReminderDateTimePickerProps) {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const parsed = parseLocalDateTime(value);
    if (!parsed) {
      setDateStr("");
      setTimeStr("");
      return;
    }
    setDateStr(parsed.dateStr);
    setTimeStr(parsed.timeStr);
  }, [value]);

  const todayStr = getLocalDateString(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);
  const nowMinutes =
    dateStr === todayStr
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : null;

  const applyDatePreset = (nextDateStr: string) => {
    const nextTime = timeStr || getNextFutureTime();
    setDateStr(nextDateStr);
    setTimeStr(nextTime);
    onChange(buildLocalDateTime(nextDateStr, nextTime));
  };

  const handleTimeChange = (nextTime: string) => {
    const nextDate = dateStr || todayStr;
    setDateStr(nextDate);
    setTimeStr(nextTime);
    onChange(buildLocalDateTime(nextDate, nextTime));
  };

  const handleTimeOpenChange = (open: boolean) => {
    if (!open || timeStr) {
      return;
    }
    const nextTime = getNextFutureTime();
    const nextDate = dateStr || todayStr;
    setDateStr(nextDate);
    setTimeStr(nextTime);
    onChange(buildLocalDateTime(nextDate, nextTime));
  };

  const handleClear = () => {
    setDateStr("");
    setTimeStr("");
    onChange("");
  };

  return (
    <div className={cn("space-y-2")}>
      <div className={cn("flex items-center gap-2")}>
        <Button
          size="sm"
          variant={dateStr === todayStr ? "secondary" : "outline"}
          className={cn("text-xs")}
          onClick={() => applyDatePreset(todayStr)}
        >
          Today
        </Button>
        <Button
          size="sm"
          variant={dateStr === tomorrowStr ? "secondary" : "outline"}
          className={cn("text-xs")}
          onClick={() => applyDatePreset(tomorrowStr)}
        >
          Tomorrow
        </Button>
      </div>
      <Select
        value={timeStr}
        onValueChange={handleTimeChange}
        onOpenChange={handleTimeOpenChange}
      >
        <SelectTrigger
          className={cn(
            "h-9 w-full justify-center border border-border text-center text-xs",
          )}
        >
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent className={cn("max-h-56 border border-border")}>
          {TIME_OPTIONS.map((time) => (
            <SelectItem
              key={time}
              value={time}
              className={cn("justify-center text-xs")}
              disabled={
                nowMinutes !== null && getTimeMinutes(time) <= nowMinutes
              }
            >
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!hideClear && (dateStr || timeStr) && (
        <Button
          size="sm"
          variant="ghost"
          className={cn("w-full text-xs")}
          onClick={handleClear}
        >
          Clear
        </Button>
      )}
    </div>
  );
}

interface ReminderTimeEditorProps {
  reminder: Reminder;
  onUpdate: (
    id: string,
    updates: Partial<Pick<Reminder, "text" | "status" | "remindAt">>,
  ) => Promise<boolean>;
  disabled?: boolean;
}

function ReminderTimeEditor({
  reminder,
  onUpdate,
  disabled,
}: ReminderTimeEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localTime, setLocalTime] = useState(
    formatDateTimeLocal(reminder.remindAt),
  );

  const handleSave = async () => {
    const newRemindAt = localTime ? new Date(localTime) : null;
    await onUpdate(reminder.id, { remindAt: newRemindAt });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-6 w-6 shrink-0 transition-opacity",
            !reminder.remindAt && "opacity-0 group-hover:opacity-100",
            reminder.remindAt && "text-primary",
            "text-muted-foreground hover:text-primary",
          )}
          disabled={disabled}
          title="Set reminder time"
        >
          <Clock className={cn("h-3.5 w-3.5")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-3")} align="end">
        <div className={cn("space-y-2")}>
          <label className={cn("text-xs font-medium text-foreground")}>
            Remind me at
          </label>
          <ReminderDateTimePicker
            value={localTime}
            onChange={setLocalTime}
            hideClear
          />
          <div className={cn("flex gap-2")}>
            <Button
              size="sm"
              className={cn("flex-1 text-xs")}
              onClick={handleSave}
            >
              Save
            </Button>
            {(localTime || reminder.remindAt) && (
              <Button
                size="sm"
                variant="ghost"
                className={cn(
                  "flex-1 text-xs text-destructive hover:text-destructive",
                )}
                onClick={() => {
                  setLocalTime("");
                  void onUpdate(reminder.id, { remindAt: null });
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ReminderPanelContent() {
  const {
    selectedProjectId,
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
  } = useWorkspaceStore();
  const [newText, setNewText] = useState("");
  const [newRemindAt, setNewRemindAt] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReminderSubmitting, setIsReminderSubmitting] = useState(false);
  const reminderSubmitLock = useRef(false);

  const projectReminders = useMemo(() => {
    return reminders
      .filter((reminder) => reminder.projectId === selectedProjectId)
      .slice()
      .sort((a, b) => {
        // 미완료 항목을 위로, 완료 항목을 아래로
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [reminders, selectedProjectId]);

  const completedCount = projectReminders.filter(
    (r) => r.status === "done",
  ).length;

  const handleCreateReminder = async () => {
    if (!selectedProjectId) {
      setErrorMessage("Select a project to add reminders.");
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
        status: "todo",
        createdAt: now,
        updatedAt: null,
        remindAt: newRemindAt ? new Date(newRemindAt) : null,
      });
      if (!created) {
        setErrorMessage("Could not save the reminder. Try again.");
        return;
      }
      setNewText("");
      setNewRemindAt("");
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
    if (e.key === "Enter" && !e.shiftKey) {
      if (isReminderSubmitting) {
        return;
      }
      e.preventDefault();
      void handleCreateReminder();
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    const newStatus = reminder.status === "done" ? "todo" : "done";
    const ok = await updateReminder(reminder.id, {
      text: reminder.text,
      status: newStatus,
    });
    if (!ok) {
      setErrorMessage("Could not update the reminder.");
    }
  };

  const handleDelete = async (reminder: Reminder) => {
    setErrorMessage(null);
    const ok = await deleteReminder(reminder.id);
    if (!ok) {
      setErrorMessage("Could not delete the reminder.");
      return;
    }

    toast({
      title: "Reminder deleted",
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
                  title: "Undo failed",
                  description: "Could not restore the reminder. Try again.",
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
    <div className={cn("flex h-full flex-col")}>
      <div className={cn("border-b border-border px-4 py-4 pr-12")}>
        <div className={cn("flex items-center justify-between")}>
          <h2 className={cn("font-mono text-lg font-bold text-primary")}>
            Reminders
          </h2>
          <div
            className={cn(
              "flex items-center gap-2 text-xs text-muted-foreground",
            )}
          >
            <Check className={cn("h-4 w-4 text-primary")} />
            <span>
              {completedCount}/{projectReminders.length}
            </span>
          </div>
        </div>
        <p className={cn("mt-1 text-xs text-muted-foreground")}>
          Quick checklist to keep things top of mind.
        </p>
      </div>

      <div className={cn("border-b border-border px-4 py-3")}>
        <div className={cn("flex items-center gap-2")}>
          <Input
            placeholder="Add a reminder..."
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
            onKeyDown={handleKeyDown}
            containerClassName={cn("flex-1")}
            className={cn("bg-input border-border")}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className={cn(
                  "h-9 w-9 shrink-0",
                  newRemindAt && "border-primary text-primary",
                )}
                title="Set reminder time"
              >
                <Clock className={cn("h-4 w-4")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-auto p-3")} align="end">
              <div className={cn("space-y-2")}>
                <label className={cn("text-xs font-medium text-foreground")}>
                  Remind me at
                </label>
                <ReminderDateTimePicker
                  value={newRemindAt}
                  onChange={setNewRemindAt}
                />
              </div>
            </PopoverContent>
          </Popover>
          <Button
            size="icon"
            className={cn("h-9 w-9 shrink-0")}
            onClick={handleCreateReminder}
            disabled={!newText.trim() || isReminderSubmitting}
          >
            <Plus className={cn("h-4 w-4")} />
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className={cn("px-4 pt-4")}>
          <Alert>
            <AlertTitle>Reminder error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className={cn("flex-1 overflow-y-auto scrollbar-thin px-4 py-3")}>
        {!selectedProjectId ? (
          <div
            className={cn(
              "rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground",
            )}
          >
            Select a project to manage reminders.
          </div>
        ) : projectReminders.length === 0 ? (
          <div
            className={cn(
              "rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground",
            )}
          >
            No reminders yet. Add one above.
          </div>
        ) : (
          <div className={cn("space-y-1")}>
            {projectReminders.map((reminder) => {
              const isDone = reminder.status === "done";
              const hasRemindAt = reminder.remindAt !== null;
              const isPastDue = hasRemindAt && reminder.remindAt! < new Date();
              return (
                <div
                  key={reminder.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-md px-2 py-2 transition-all duration-200",
                    "hover:bg-accent/50",
                  )}
                >
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => handleToggleComplete(reminder)}
                    className={cn("mt-0.5 shrink-0")}
                  />
                  <div className={cn("flex-1 min-w-0")}>
                    <span
                      className={cn(
                        "block text-sm leading-relaxed",
                        isDone && "text-muted-foreground line-through",
                      )}
                    >
                      {reminder.text}
                    </span>
                    {hasRemindAt && !isDone && (
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1 text-xs",
                          isPastDue
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        <Bell className={cn("h-3 w-3")} />
                        <RelativeTime
                          date={reminder.remindAt!}
                          reminderFormat
                        />
                      </div>
                    )}
                  </div>
                  <ReminderTimeEditor
                    reminder={reminder}
                    onUpdate={updateReminder}
                    disabled={isDone}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                      "text-muted-foreground hover:text-destructive",
                    )}
                    onClick={() => handleDelete(reminder)}
                  >
                    <X className={cn("h-3.5 w-3.5")} />
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
        "w-full shrink-0 border-t border-sidebar-border bg-sidebar text-sidebar-foreground lg:w-80 lg:border-l lg:border-t-0",
      )}
    >
      <ReminderPanelContent />
    </aside>
  );
}
