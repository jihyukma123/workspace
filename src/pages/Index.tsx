import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { KanbanBoard } from "@/components/KanbanBoard";
import { WikiEditor } from "@/components/WikiEditor";
import { MemoEditor } from "@/components/MemoEditor";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { Search, Filter, Plus } from "lucide-react";
import { Task } from "@/types/workspace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { activeTab, selectedProjectId, projects, addTask } = useWorkspaceStore();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' as Task['priority'] });

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
      setIsTaskDialogOpen(false);
    }
  };

  const renderContent = () => {
    if (!selectedProjectId) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to Workspace
            </h2>
            <p className="text-muted-foreground max-w-md">
              Select a project from the sidebar to view its Kanban board, Wiki, and Memo.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'kanban':
        return <KanbanBoard />;
      case 'wiki':
        return <WikiEditor />;
      case 'memo':
        return <MemoEditor />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        {selectedProjectId && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{selectedProject?.name || 'Workspace'}</h1>
              <p className="text-sm text-muted-foreground">{selectedProject?.description || 'Select a project'}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 h-9 pl-9 pr-4 rounded-lg bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
              
              {/* Filter */}
              <button className="h-9 px-3 flex items-center gap-2 rounded-lg border border-border hover:bg-muted transition-colors">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Filter</span>
              </button>
              
              {/* Add Task */}
              {activeTab === 'kanban' && (
                <>
                  <Button
                    onClick={() => setIsTaskDialogOpen(true)}
                    className="h-9 px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Task</span>
                  </Button>
                  <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogContent className="bg-popover border-border">
                      <DialogHeader>
                        <DialogTitle>New Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Task title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddTask();
                            }
                          }}
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
                </>
              )}
            </div>
          </header>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
