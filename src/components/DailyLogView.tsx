import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay as isSameDayFns,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

const formatDateKey = (date: Date) => format(date, "yyyy-MM-dd");
const isSameDay = (left: Date, right: Date) => isSameDayFns(left, right);

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

const getWeekDays = (anchor: Date) => {
  const weekStart = startOfWeek(anchor, WEEK_OPTIONS);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
};

const getWeekdayLabels = () => {
  const base = startOfWeek(new Date(), WEEK_OPTIONS);
  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(base, index), "EEE"),
  );
};

const getMonthGridDays = (anchor: Date) => {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, WEEK_OPTIONS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTIONS);

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  while (days.length < 42) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return days.slice(0, 42);
};

export function DailyLogView() {
  const { selectedProjectId, dailyLogs, addDailyLog, updateDailyLog } =
    useWorkspaceStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [content, setContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const saveLock = useRef(false);

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState<Date>(() =>
    startOfMonth(new Date()),
  );

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setMonthAnchor(startOfMonth(now));
  }, [selectedProjectId]);

  const projectLogs = useMemo(
    () => dailyLogs.filter((log) => log.projectId === selectedProjectId),
    [dailyLogs, selectedProjectId],
  );

  const dateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const selectedLog = useMemo(
    () => projectLogs.find((log) => log.date === dateKey) ?? null,
    [projectLogs, dateKey],
  );

  useEffect(() => {
    setContent(selectedLog?.content ?? "");
  }, [selectedLog?.id, selectedLog?.content, dateKey]);

  const loggedDateKeys = useMemo(
    () => new Set(projectLogs.map((log) => log.date)),
    [projectLogs],
  );
  const logByDateKey = useMemo(
    () => new Map(projectLogs.map((log) => [log.date, log] as const)),
    [projectLogs],
  );

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(), []);
  const monthGridDays = useMemo(
    () => getMonthGridDays(monthAnchor),
    [monthAnchor],
  );

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startYearSuffix = isSameMonth(start, end)
      ? ""
      : `, ${format(start, "yyyy")}`;
    return `${format(start, "MMM d")}${startYearSuffix} – ${format(end, "MMM d, yyyy")}`;
  }, [weekDays]);

  const formattedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [selectedDate],
  );

  const isToday = isSameDay(selectedDate, new Date());
  const hasChanges = content !== (selectedLog?.content ?? "");

  const handleGoPrevWeek = () => setSelectedDate((prev) => addDays(prev, -7));
  const handleGoNextWeek = () => setSelectedDate((prev) => addDays(prev, 7));

  const openMonthPicker = () => {
    setMonthAnchor(startOfMonth(selectedDate));
    setIsMonthPickerOpen(true);
  };

  const handleMonthPick = (date: Date) => {
    const isOutside = !isSameMonth(date, monthAnchor);
    setSelectedDate(date);

    if (isOutside) {
      setMonthAnchor(startOfMonth(date));
      return;
    }

    setIsMonthPickerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSave = async () => {
    if (!selectedProjectId || !hasChanges) {
      return;
    }
    if (saveLock.current) {
      return;
    }

    saveLock.current = true;
    setIsSaving(true);
    try {
      if (selectedLog) {
        await updateDailyLog(selectedLog.id, { content });
        return;
      }

      const now = new Date();
      await addDailyLog({
        id: `daily-log-${now.getTime()}`,
        projectId: selectedProjectId,
        date: dateKey,
        content,
        createdAt: now,
        updatedAt: null,
      });
    } finally {
      setIsSaving(false);
      saveLock.current = false;
    }
  };

  const updatedAtLabel = selectedLog?.updatedAt
    ? selectedLog.updatedAt.toLocaleString()
    : (selectedLog?.createdAt?.toLocaleString() ?? "—");

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-[14rem]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <div className="font-mono text-lg font-bold text-primary">
                  Daily Log
                </div>
                {isToday && (
                  <Badge className="bg-primary/20 text-primary border border-primary/30">
                    Today
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formattedDate}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleGoPrevWeek}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="hidden sm:block text-sm text-muted-foreground min-w-[15rem] text-center">
                {weekRangeLabel}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleGoNextWeek}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button variant="secondary" size="sm" onClick={openMonthPicker}>
                Pick date
              </Button>
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date) => {
                const key = formatDateKey(date);
                const isSelected = isSameDay(date, selectedDate);
                const hasLog = loggedDateKeys.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "rounded-md border border-border px-2 py-2 text-left",
                      "transition-all duration-200 hover:bg-muted/40",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected && "bg-primary/15 ring-1 ring-primary/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          isSelected && "text-primary",
                        )}
                      >
                        {format(date, "d")}
                      </div>
                      {hasLog && (
                        <span
                          className="h-2 w-2 rounded-full bg-primary/70"
                          aria-label="Has log"
                        />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {format(date, "EEE")}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-4 overflow-auto scrollbar-thin">
        <Card className="min-w-0 flex flex-col">
          <CardHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-lg font-bold text-primary">
                  What did you work on?
                </div>
                <div className="text-sm text-muted-foreground">
                  {formattedDate}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {updatedAtLabel}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <Textarea
              ref={(node) => {
                textareaRef.current = node;
              }}
              placeholder="What did you work on today?"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[420px] resize-none bg-input border-border"
            />
          </CardContent>
          <CardFooter className="p-4 border-t border-border flex items-center justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Log"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isMonthPickerOpen} onOpenChange={setIsMonthPickerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono">Pick a date</DialogTitle>
            <DialogDescription>
              Calendar is just navigation — the log editor is the main view.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setMonthAnchor((prev) => startOfMonth(subMonths(prev, 1)))
              }
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <div className="text-sm font-medium">
                {format(monthAnchor, "MMMM yyyy")}
              </div>
              <div className="text-xs text-muted-foreground">
                Click a day to select
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setMonthAnchor((prev) => startOfMonth(addMonths(prev, 1)))
              }
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-7 gap-0">
              {weekdayLabels.map((label) => (
                <div
                  key={label}
                  className="pb-2 text-xs font-medium text-muted-foreground text-center"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
              {monthGridDays.map((date) => {
                const key = formatDateKey(date);
                const isOutside = !isSameMonth(date, monthAnchor);
                const isSelected = isSameDay(date, selectedDate);
                const hasLog = loggedDateKeys.has(key);
                const preview = logByDateKey.get(key)?.content?.trim() ?? "";

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleMonthPick(date)}
                    className={cn(
                      "border-r border-b border-border",
                      "min-h-[52px] px-2 py-1 text-left",
                      "transition-all duration-200 hover:bg-muted/40",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isOutside && "bg-muted/10 text-muted-foreground",
                      isSelected && "bg-primary/15",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={cn(
                          "text-sm font-medium",
                          isSelected && "text-primary",
                        )}
                      >
                        {format(date, "d")}
                      </div>
                      {hasLog && (
                        <span
                          className="h-2 w-2 rounded-full bg-primary/70"
                          aria-label="Has log"
                        />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">
                      {hasLog ? preview.split("\n")[0] || "(Saved)" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
