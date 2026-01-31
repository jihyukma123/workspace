import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  Pencil,
  CalendarDays,
} from "lucide-react";
import { RelativeTime } from "@/components/ui/relative-time";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Task, KanbanColumn } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    priority: "medium" as Task["priority"],
    dueDate: "" as string,
  });

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

  const openEditDialog = (task: Task) => {
    setEditForm({
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : "",
    });
    setTaskToEdit(task);
  };

  const handleEditSubmit = async () => {
    if (!taskToEdit || !editForm.title.trim()) return;
    await updateTask(taskToEdit.id, {
      title: editForm.title.trim(),
      priority: editForm.priority,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate) : null,
    });
    setTaskToEdit(null);
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
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              openEditDialog(task);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setTaskToDelete(task);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={cn("font-mono text-lg font-bold text-primary")}
            >
              Delete Task
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!taskToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToEdit(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle
              className={cn("font-mono text-lg font-bold text-primary")}
            >
              Edit Task
            </DialogTitle>
            <DialogDescription>
              Modify the task details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editForm.priority}
                onValueChange={(value: Task["priority"]) =>
                  setEditForm({ ...editForm, priority: value })
                }
              >
                <SelectTrigger id="edit-priority">
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
              <Label htmlFor="edit-dueDate">Due Date (optional)</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={editForm.dueDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setTaskToEdit(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleEditSubmit()}
              disabled={!editForm.title.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
