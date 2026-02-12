import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  CalendarDays,
  MoreHorizontal,
} from "lucide-react";
import { RelativeTime } from "@/components/ui/relative-time";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Task, KanbanColumn } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppInput } from "@/components/ui/app-input";

const columns: KanbanColumn[] = [
  { id: "backlog", title: "Backlog", color: "secondary" },
  { id: "in-progress", title: "In Progress", color: "warning" },
  { id: "done", title: "Done", color: "success" },
];

const columnIcons = {
  backlog: Clock,
  "in-progress": Loader2,
  done: CheckCircle2,
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-status-progress/20 text-status-progress",
  high: "bg-destructive/20 text-destructive",
};

export function KanbanBoard() {
  const { tasks, updateTaskStatus, updateTask, deleteTask } =
    useWorkspaceStore();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToView, setTaskToView] = useState<Task | null>(null);
  const [isDetailsSaving, setIsDetailsSaving] = useState(false);
  const [viewForm, setViewForm] = useState({
    title: "",
    details: "",
    priority: "medium" as Task["priority"],
    dueDate: "" as string,
  });

  const closeDetailsDialog = () => {
    setTaskToView(null);
    setViewForm({
      title: "",
      details: "",
      priority: "medium",
      dueDate: "",
    });
  };

  const getDueDateKey = (date: Date | null | undefined) =>
    date ? date.toISOString().split("T")[0] : "";
  const initialView = taskToView
    ? {
        title: taskToView.title,
        details: taskToView.details ?? "",
        priority: taskToView.priority,
        dueDate: getDueDateKey(taskToView.dueDate),
      }
    : null;
  const isDetailsDirty = initialView
    ? viewForm.title !== initialView.title ||
      viewForm.details !== initialView.details ||
      viewForm.priority !== initialView.priority ||
      viewForm.dueDate !== initialView.dueDate
    : false;

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: Task["status"]) => {
    if (draggedTask) {
      void updateTaskStatus(draggedTask, columnId);
      setDraggedTask(null);
    }
  };

  const getColumnTasks = (columnId: Task["status"]) => {
    return tasks.filter((task) => task.status === columnId);
  };

  const getHeaderColorClass = (color: KanbanColumn["color"]) => {
    const colorMap = {
      primary: "text-primary",
      secondary: "text-status-todo",
      warning: "text-status-progress",
      success: "text-status-done",
    };
    return colorMap[color];
  };

  const getColumnBorderClass = (color: KanbanColumn["color"]) => {
    const colorMap = {
      primary: "border-primary/40 hover:border-primary/60",
      secondary: "border-status-todo/40 hover:border-status-todo/60",
      warning: "border-status-progress/40 hover:border-status-progress/60",
      success: "border-status-done/40 hover:border-status-done/60",
    };
    return colorMap[color];
  };

  const getHeaderBorderClass = (color: KanbanColumn["color"]) => {
    const colorMap = {
      primary: "border-primary/30",
      secondary: "border-status-todo/30",
      warning: "border-status-progress/30",
      success: "border-status-done/30",
    };
    return colorMap[color];
  };

  const handleDeleteConfirm = async (taskId: string) => {
    await deleteTask(taskId);
    setTaskToDelete(null);
  };

  const handleSaveDetails = async () => {
    if (!taskToView) {
      return;
    }
    if (isDetailsSaving) {
      return;
    }
    const taskId = taskToView.id;
    const nextTitle = viewForm.title.trim();
    if (!nextTitle) {
      return;
    }
    setIsDetailsSaving(true);
    try {
      await updateTask(taskId, {
        title: nextTitle,
        details: viewForm.details,
        priority: viewForm.priority,
        dueDate: viewForm.dueDate ? new Date(viewForm.dueDate) : null,
      });
      const normalizedDetails = viewForm.details.trim()
        ? viewForm.details.trim()
        : null;
      setTaskToView((prev) =>
        prev && prev.id === taskId
          ? {
              ...prev,
              title: nextTitle,
              details: normalizedDetails,
              priority: viewForm.priority,
              dueDate: viewForm.dueDate ? new Date(viewForm.dueDate) : null,
            }
          : prev,
      );
      setViewForm((prev) => ({
        ...prev,
        title: nextTitle,
        details: normalizedDetails ?? "",
      }));
    } finally {
      setIsDetailsSaving(false);
    }
  };

  return (
    <>
      <div className="flex-1 p-6 overflow-x-auto scrollbar-thin h-full">
        <div className="flex gap-4 w-full min-w-[840px] h-full">
          {columns.map((column) => {
            const Icon = columnIcons[column.id];
            const columnTasks = getColumnTasks(column.id);

            return (
              <div
                key={column.id}
                className={cn(
                  "min-w-[260px] flex-1 rounded-lg border bg-kanban-column p-4 min-h-[500px] transition-all duration-200 flex flex-col",
                  getColumnBorderClass(column.color),
                  draggedTask && "border-dashed border-primary/50",
                )}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 mb-4 pb-3 border-b",
                    getHeaderBorderClass(column.color),
                  )}
                >
                  <Icon
                    className={cn("w-4 h-4", getHeaderColorClass(column.color))}
                  />
                  <h4
                    className={cn(
                      "font-semibold text-sm",
                      getHeaderColorClass(column.color),
                    )}
                  >
                    {column.title}
                  </h4>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className={cn(
                        "bg-kanban-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing",
                        "hover:bg-kanban-card-hover hover:border-primary/30 transition-all duration-200 group",
                        draggedTask === task.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                priorityColors[task.priority],
                              )}
                            >
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                                  task.dueDate < new Date() &&
                                    task.status !== "done"
                                    ? "bg-destructive/20 text-destructive"
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                <CalendarDays className="w-3 h-3" />
                                <RelativeTime date={task.dueDate} shortFormat />
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                }}
                                aria-label="Open task actions"
                                title="Actions"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  setTaskToView(task);
                                  setViewForm({
                                    title: task.title,
                                    details: task.details ?? "",
                                    priority: task.priority,
                                    dueDate: getDueDateKey(task.dueDate),
                                  });
                                }}
                              >
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className={cn("text-destructive focus:text-destructive")}
                                onSelect={(event) => {
                                  setTaskToDelete(task);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null);
          }
        }}
      >
        <AlertDialogContent defaultAction="action">
          <AlertDialogHeader>
            <AlertDialogTitle
              className={cn("font-mono text-lg font-bold text-primary")}
            >
              Permanently delete this task?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className={cn("font-medium text-foreground")}>
                {taskToDelete?.title ?? "this task"}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              )}
              onClick={() => {
                const taskId = taskToDelete?.id;
                if (!taskId) {
                  return;
                }
                void handleDeleteConfirm(taskId);
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!taskToView}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailsDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className={cn("font-mono text-lg font-bold text-primary")}>
              Task Details
            </DialogTitle>
            <DialogDescription className={cn("text-foreground font-medium")}>
              Update details and priority.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                priorityColors[viewForm.priority],
              )}
            >
              {viewForm.priority}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {taskToView?.status ?? "—"}
            </span>
            {taskToView?.dueDate && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                  taskToView.dueDate < new Date() && taskToView.status !== "done"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <CalendarDays className="w-3 h-3" />
                <RelativeTime date={taskToView.dueDate} shortFormat />
              </span>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-view-title">Title</Label>
              <AppInput
                id="task-view-title"
                value={viewForm.title}
                onChange={(event) =>
                  setViewForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-view-priority">Priority</Label>
              <Select
                value={viewForm.priority}
                onValueChange={(value: Task["priority"]) =>
                  setViewForm((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="task-view-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-view-dueDate">Due Date (optional)</Label>
              <AppInput
                id="task-view-dueDate"
                type="date"
                value={viewForm.dueDate}
                onChange={(event) =>
                  setViewForm((prev) => ({ ...prev, dueDate: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-view-details">Details</Label>
              <Textarea
                id="task-view-details"
                value={viewForm.details}
                onChange={(event) =>
                  setViewForm((prev) => ({ ...prev, details: event.target.value }))
                }
                placeholder="Write any extra context, steps, or notes…"
                className={cn("min-h-[220px] resize-none")}
              />
              <p className="text-xs text-muted-foreground">
                칸반 카드에는 표시되지 않지만, 여기에 상세 내용을 저장할 수 있어요.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={closeDetailsDialog}>
              Close
            </Button>
            <Button
              onClick={() => void handleSaveDetails()}
              disabled={!viewForm.title.trim() || !isDetailsDirty || isDetailsSaving}
            >
              {isDetailsSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
