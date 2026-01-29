import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export function DailyLogView() {
  const { selectedProjectId, dailyLogs, addDailyLog, updateDailyLog } = useWorkspaceStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveLock = useRef(false);

  useEffect(() => {
    setSelectedDate(new Date());
  }, [selectedProjectId]);

  const projectLogs = useMemo(
    () => dailyLogs.filter((log) => log.projectId === selectedProjectId),
    [dailyLogs, selectedProjectId]
  );

  const dateKey = formatDateKey(selectedDate);
  const selectedLog = projectLogs.find((log) => log.date === dateKey) ?? null;

  useEffect(() => {
    setContent(selectedLog?.content ?? "");
  }, [selectedLog?.id, selectedLog?.content, dateKey]);

  const logDates = useMemo(
    () => projectLogs.map((log) => new Date(`${log.date}T00:00:00`)),
    [projectLogs]
  );

  const formattedDate = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const isToday = isSameDay(selectedDate, new Date());
  const hasChanges = content !== (selectedLog?.content ?? "");

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
      } else {
        const now = new Date();
        await addDailyLog({
          id: `daily-log-${now.getTime()}`,
          projectId: selectedProjectId,
          date: dateKey,
          content,
          createdAt: now,
          updatedAt: null,
        });
      }
    } finally {
      setIsSaving(false);
      saveLock.current = false;
    }
  };

  const updatedAtLabel = selectedLog?.updatedAt
    ? selectedLog.updatedAt.toLocaleString()
    : selectedLog?.createdAt?.toLocaleString() ?? "—";

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-hidden">
      <div className="w-80 shrink-0">
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h3 className="font-mono text-lg font-bold text-primary">Calendar</h3>
            </div>
            <span className="text-xs text-muted-foreground">Daily Logs</span>
          </div>
          <div className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="w-full"
              modifiers={{ logged: logDates }}
              modifiersClassNames={{
                logged: "bg-primary/20 text-primary border border-primary/30",
              }}
            />
          </div>
          <div className="px-4 pb-4 text-xs text-muted-foreground">
            Highlighted days already have a log.
          </div>
        </div>
      </div>

      <Card className={cn("flex-1 min-w-0 flex flex-col")}>
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-mono text-lg font-bold text-primary">Daily Log</h3>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            {isToday && (
              <Badge className="bg-primary/20 text-primary border border-primary/30">
                Today
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-hidden">
          <Textarea
            placeholder="What did you work on today?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={cn("h-full min-h-[240px] resize-none bg-input border-border")}
          />
        </CardContent>
        <CardFooter className="p-4 border-t border-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Last updated: {updatedAtLabel}
          </span>
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
  );
}
