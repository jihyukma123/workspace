import { useState } from 'react';
import { Plus, GripVertical, Trash2, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Task, KanbanColumn } from '@/types/workspace';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const columns: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', color: 'primary' },
  { id: 'in-progress', title: 'In Progress', color: 'secondary' },
  { id: 'waiting-approval', title: 'Waiting Approval', color: 'warning' },
  { id: 'verified', title: 'Verified', color: 'success' },
];

const columnIcons = {
  backlog: Clock,
  'in-progress': Loader2,
  'waiting-approval': AlertCircle,
  verified: CheckCircle2,
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-status-progress/20 text-status-progress',
  high: 'bg-destructive/20 text-destructive',
};

export function KanbanBoard() {
  const { tasks, addTask, updateTaskStatus, deleteTask } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'] });
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      addTask({
        id: Date.now().toString(),
        title: newTask.title,
        description: newTask.description,
        status: 'backlog',
        priority: newTask.priority,
        createdAt: new Date(),
      });
      setNewTask({ title: '', description: '', priority: 'medium' });
      setIsOpen(false);
    }
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: Task['status']) => {
    if (draggedTask) {
      updateTaskStatus(draggedTask, columnId);
      setDraggedTask(null);
    }
  };

  const getColumnTasks = (columnId: Task['status']) => {
    return tasks.filter((task) => task.status === columnId);
  };

  const getHeaderColorClass = (color: KanbanColumn['color']) => {
    const colorMap = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      warning: 'text-status-progress',
      success: 'text-status-done',
    };
    return colorMap[color];
  };

  return (
    <div className="flex-1 p-6 overflow-x-auto scrollbar-thin h-full">
      <div className="flex gap-4 min-w-[900px] h-full">
        {columns.map((column) => {
          const Icon = columnIcons[column.id];
          const columnTasks = getColumnTasks(column.id);

          return (
            <div
              key={column.id}
              className={cn(
                'flex-1 rounded-lg border border-border bg-kanban-column p-4 min-h-[500px] transition-all duration-200 flex flex-col',
                draggedTask && 'border-dashed border-primary/50'
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
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
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 border border-dashed border-border hover:bg-muted/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-popover border-border">
                  <DialogHeader>
                    <DialogTitle>New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                    <Select
                      value={newTask.priority}
                      onValueChange={(value: Task['priority']) => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddTask}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
