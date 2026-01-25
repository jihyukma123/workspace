import { useState } from 'react';
import { GripVertical, Trash2, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Task, KanbanColumn } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const columns: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', color: 'secondary' },
  { id: 'in-progress', title: 'In Progress', color: 'warning' },
  { id: 'done', title: 'Done', color: 'success' },
];

const columnIcons = {
  backlog: Clock,
  'in-progress': Loader2,
  done: CheckCircle2,
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-status-progress/20 text-status-progress',
  high: 'bg-destructive/20 text-destructive',
};

export function KanbanBoard() {
  const { tasks, updateTaskStatus, deleteTask } = useWorkspaceStore();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: Task['status']) => {
    if (draggedTask) {
      void updateTaskStatus(draggedTask, columnId);
      setDraggedTask(null);
    }
  };

  const getColumnTasks = (columnId: Task['status']) => {
    return tasks.filter((task) => task.status === columnId);
  };

  const getHeaderColorClass = (color: KanbanColumn['color']) => {
    const colorMap = {
      primary: 'text-primary',
      secondary: 'text-status-todo',
      warning: 'text-status-progress',
      success: 'text-status-done',
    };
    return colorMap[color];
  };

  const getColumnBorderClass = (color: KanbanColumn['color']) => {
    const colorMap = {
      primary: 'border-primary/40 hover:border-primary/60',
      secondary: 'border-status-todo/40 hover:border-status-todo/60',
      warning: 'border-status-progress/40 hover:border-status-progress/60',
      success: 'border-status-done/40 hover:border-status-done/60',
    };
    return colorMap[color];
  };

  const getHeaderBorderClass = (color: KanbanColumn['color']) => {
    const colorMap = {
      primary: 'border-primary/30',
      secondary: 'border-status-todo/30',
      warning: 'border-status-progress/30',
      success: 'border-status-done/30',
    };
    return colorMap[color];
  };

  return (
    <div className="flex-1 p-6 overflow-x-auto scrollbar-thin h-full">
      <div className="flex gap-4 w-full min-w-[840px] h-full">
        {columns.map((column) => {
          const Icon = columnIcons[column.id];
          const columnTasks = getColumnTasks(column.id);

          return (
            <div
              key={column.id}
              className={cn(
                'min-w-[260px] flex-1 rounded-lg border bg-kanban-column p-4 min-h-[500px] transition-all duration-200 flex flex-col',
                getColumnBorderClass(column.color),
                draggedTask && 'border-dashed border-primary/50'
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div
                className={cn(
                  'flex items-center gap-2 mb-4 pb-3 border-b',
                  getHeaderBorderClass(column.color)
                )}
              >
                <Icon className={cn('w-4 h-4', getHeaderColorClass(column.color))} />
                <h4 className={cn('font-semibold text-sm', getHeaderColorClass(column.color))}>
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
                      'bg-kanban-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing',
                      'hover:bg-kanban-card-hover hover:border-primary/30 transition-all duration-200 group',
                      draggedTask === task.id && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityColors[task.priority])}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => void deleteTask(task.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
